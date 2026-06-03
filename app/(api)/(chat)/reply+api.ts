import { adminDb } from "@/lib/firebaseAdmin";
import { generateDriverReply } from "@/lib/gemini";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const { rideId } = await request.json();
        if (!rideId) return Response.json({ error: "Missing rideId" }, { status: 400 });

        const roomRef = adminDb.collection("chatRooms").doc(`ride-${rideId}`);
        const roomSnap = await roomRef.get();
        if (!roomSnap.exists) return Response.json({ error: "Room not found" }, { status: 404 });
        const room = roomSnap.data()!;

        // Fetch last 15 messages
        const msgsSnap = await roomRef
            .collection("messages")
            .orderBy("createdAt", "desc")
            .limit(15)
            .get();

        const ordered = msgsSnap.docs.reverse();
        if (ordered.length === 0) return Response.json({ ok: true, skipped: "empty" });

        const driverSenderId = `driver-${room.driverId}`;
        const latest = ordered[ordered.length - 1].data();

        // Only reply if the LAST message is from the rider (prevents double-replies)
        if (latest.senderId === driverSenderId) {
            return Response.json({ ok: true, skipped: "last_is_driver" });
        }

        // Build history excluding the latest (which we pass separately)
        const history = ordered.slice(0, -1).map((d) => {
            const m = d.data();
            return {
                role: m.senderId === driverSenderId ? ("model" as const) : ("user" as const),
                text: m.text as string,
            };
        });

        const text = await generateDriverReply(
            {
                driverName: room.driverName ?? "Driver",
                riderName: room.rider?.name ?? "sir",
                originAddress: room.originAddress ?? "",
                destinationAddress: room.destinationAddress ?? "",
            },
            history,
            latest.text
        );

        await roomRef.collection("messages").add({
            senderId: driverSenderId,
            text,
            createdAt: FieldValue.serverTimestamp(),
            isAI: true,
        });
        await roomRef.update({
            lastMessage: text,
            lastMessageAt: FieldValue.serverTimestamp(),
        });

        return Response.json({ ok: true, text });
    } catch (err: any) {
        console.error("[reply] error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}