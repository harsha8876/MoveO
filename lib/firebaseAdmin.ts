import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");

const serviceAccount = JSON.parse(
    Buffer.from(b64, "base64").toString("utf-8")
);

const app = getApps().length
    ? getApp()
    : initializeApp({ credential: cert(serviceAccount) });

    
export const adminDb = getFirestore(app);