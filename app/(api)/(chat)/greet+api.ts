import { adminDb } from "@/lib/firebaseAdmin";
import { generateGreeting } from "@/lib/gemini";
const admin = require("firebase-admin");

export async function POST(request: Request) {
    try {
        const { rideId, driverId, driverName, riderName, originAddress, destinationAddress } =
            await request.json();

        if (!rideId || !driverId || !driverName) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
        }

        const text = await generateGreeting({
            driverName,
            riderName: riderName ?? "sir",
            originAddress: originAddress ?? "",
            destinationAddress: destinationAddress ?? "",
        });

        const roomRef = adminDb.collection("chatRooms").doc(`ride-${rideId}`);
        await roomRef.collection("messages").add({
            senderId: `driver-${driverId}`,
            text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isAI: true,
        });
        await roomRef.update({
            lastMessage: text,
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return Response.json({ ok: true, text });
    } catch (err: any) {
        console.error("[greet] error:", err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}