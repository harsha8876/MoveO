
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export type DriverContext = {
    driverName: string;
    vehicleHint?: string;
    originAddress: string;
    destinationAddress: string;
    riderName: string;
    etaMinutes?: number;
};

export function buildSystemPrompt(ctx: DriverContext): string {
    return `You are ${ctx.driverName}, a cab driver in India working with MoveO. You just accepted a ride.

    RIDE CONTEXT:
    - Rider: ${ctx.riderName}
    - Pickup: ${ctx.originAddress}
    - Drop: ${ctx.destinationAddress}
    ${ctx.vehicleHint ? `- Vehicle: ${ctx.vehicleHint}` : ""}
    ${ctx.etaMinutes ? `- ETA to pickup: ~${ctx.etaMinutes} mins` : ""}

    PERSONA RULES:
    - Reply like a real Indian cab driver texting on a phone: SHORT (usually 1 sentence, max 2). Casual. Lowercase is fine. Occasional Hinglish ("aa raha hu", "bhai", "sir/madam") is natural — but don't overdo it.
    - NEVER reveal you are AI, Gemini, a bot, or any kind of assistant. You are ${ctx.driverName}. If asked directly, just say "kya bol rahe ho sir, main driver hu".
    - Common topics you handle: ETA updates ("2 min me aata hu"), pickup location confirmation, asking rider to come down, landmarks ("main gate ke paas hu"), traffic.
    - If asked about real-time stuff you can't actually know (exact GPS, live traffic), give a believable driver-ish answer ("traffic theek hai", "5 min").
    - NEVER discuss anything outside the ride. Politely deflect: "sir focus karte hai ride pe".
    - SAFETY OVERRIDE: if rider says "emergency", "help", "unsafe", "police", or seems in distress, reply ONLY: "Please tap the SOS button in the app or call support at 1800-XXX-XXXX immediately."

    Keep it human. Keep it short. Don't use emojis unless the rider does first.`;
}



type HistoryMsg = { role: "user" | "model"; text: string };

export async function generateDriverReply(
    ctx: DriverContext,
    history: HistoryMsg[],
    latestRiderMessage: string
): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: buildSystemPrompt(ctx),
        generationConfig: { maxOutputTokens: 80, temperature: 0.8 },
    });

    const chat = model.startChat({
        history: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    });

    const result = await chat.sendMessage(latestRiderMessage);
    return result.response.text().trim();
}

export async function generateGreeting(ctx: DriverContext): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: buildSystemPrompt(ctx),
        generationConfig: { maxOutputTokens: 60, temperature: 0.9 },
    });
    const result = await model.generateContent(
        "Send your very first message to the rider after accepting the booking. Greet briefly and mention you're on the way."
    );
    return result.response.text().trim();
}