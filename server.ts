import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";

// Initialize Firebase Admin silently. 
if (!getApps().length) {
  try {
    initializeApp();
    console.log("Firebase Admin initialized");
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
  }
}

const db = getApps().length > 0 ? getFirestore() : null;

async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML' // Or Markdown
    });
  } catch (err: any) {
    console.error("Telegram error:", err?.response?.data || err.message);
  }
}

async function sendLineNotification(message: string) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) return;
  try {
    await axios.post('https://notify-api.line.me/api/notify', 
      new URLSearchParams({ message }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        }
      }
    );
  } catch (err: any) {
    console.error("LINE error:", err?.response?.data || err.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.post("/api/notify", async (req, res) => {
    try {
      const { message, platform = 'all' } = req.body;
      
      if (platform === 'telegram' || platform === 'all') {
        await sendTelegramNotification(message);
      }
      if (platform === 'line' || platform === 'all') {
        await sendLineNotification(message);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
