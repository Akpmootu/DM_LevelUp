import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import appletConfig from "../../firebase-applet-config.json";

export const app = initializeApp(appletConfig);
export const db = getFirestore(app, (appletConfig as any).firestoreDatabaseId);

