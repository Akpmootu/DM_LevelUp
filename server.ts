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

async function sendTelegramNotification(message: string, buttons?: Array<{ text: string; url: string }>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { success: false, reason: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" };
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: any = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    if (buttons && buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          buttons.map(b => ({ text: b.text, url: b.url }))
        ]
      };
    }

    const res = await axios.post(url, payload);
    return { success: true, data: res.data };
  } catch (err: any) {
    console.error("Telegram error:", err?.response?.data || err.message);
    return { success: false, error: err?.response?.data || err.message };
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

// Track last daily reminder sent date (YYYY-MM-DD in Asia/Bangkok)
let lastDailyReminderDate = "";

function setupDailyReminderScheduler() {
  setInterval(async () => {
    try {
      const now = new Date();
      // Formatter in Bangkok timezone (UTC+7)
      const bkkFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
      });
      const parts = bkkFormatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const todayStr = `${year}-${month}-${day}`;

      // Send daily reminder at 17:00 (5 PM) Bangkok time once per day
      if (hour >= 17 && lastDailyReminderDate !== todayStr) {
        lastDailyReminderDate = todayStr;
        const thaiDate = now.toLocaleDateString('th-TH', {
          timeZone: 'Asia/Bangkok',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        const appUrl = process.env.DEV_APP_URL || 'https://ais-dev-5wkxh3vsspnreidonm5qnf-10830053760.asia-southeast1.run.app';
        const msg = `🏛️ <b>แจ้งเตือนประจำวัน: ระบบประวัติข้าราชการและพัฒนาตนเอง</b> ⏰\n📅 <i>${thaiDate}</i>\n\nสวัสดีครับข้าราชการและเจ้าหน้าที่ทุกท่าน 🙏😊\nอย่าลืมติดตามและอัปเดตข้อมูลการปฏิบัติงานประจำวัน เพื่อความพร้อมในการประเมินผลงานและเลื่อนระดับครับ:\n\n✨ <b>ภารกิจแนะนำประจำวัน:</b>\n1️⃣ ตรวจสอบและบันทึกชั่วโมงการฝึกอบรม/สัมมนา/e-Learning\n2️⃣ ตรวจสอบคำสั่งแต่งตั้ง/ย้าย หรือเลื่อนขั้นเงินเดือนล่าสุด\n3️⃣ บันทึกประวัติการลาป่วย/ลากิจ/ลาพักผ่อน\n4️⃣ ถ่ายภาพ/สแกนเอกสารหลักฐานเก็บไว้ใน Google Drive\n\n💡 <i>"ความก้าวหน้าในสายอาชีพ เริ่มต้นจากการบันทึกผลงานอย่างสม่ำเสมอ"</i>`;

        await sendTelegramNotification(msg, [
          { text: '📝 เปิดระบบบันทึกประวัติ', url: appUrl },
          { text: '🏖️ บันทึกการลา', url: `${appUrl}` }
        ]);
        console.log(`Automated Daily Telegram Reminder sent for ${todayStr}`);
      }
    } catch (e) {
      console.error("Daily reminder check error", e);
    }
  }, 15 * 60 * 1000); // Check every 15 minutes
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup background daily reminder
  setupDailyReminderScheduler();

  // API endpoints
  app.get("/api/telegram/status", (req, res) => {
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasChatId = !!process.env.TELEGRAM_CHAT_ID;
    res.json({
      configured: hasToken && hasChatId,
      hasToken,
      hasChatId,
      lastSentDate: lastDailyReminderDate || null
    });
  });

  app.post("/api/telegram/daily-reminder", async (req, res) => {
    try {
      const { userName, appUrl, customStats } = req.body;
      const now = new Date();
      const thaiDate = now.toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const targetUrl = appUrl || process.env.DEV_APP_URL || 'https://ais-dev-5wkxh3vsspnreidonm5qnf-10830053760.asia-southeast1.run.app';
      const namePart = userName ? `คุณ <b>${userName}</b>` : 'ข้าราชการและเจ้าหน้าที่ทุกท่าน';

      let statsPart = '';
      if (customStats) {
        statsPart = `\n📊 <b>สถานะข้อมูลปัจจุบัน:</b>\n• คำสั่งรับราชการ: ${customStats.officialCount || 0} รายการ\n• หลักสูตรอบรม: ${customStats.trainingCount || 0} หลักสูตร\n• ผลงาน/คณะทำงาน: ${customStats.experienceCount || 0} รายการ\n• บันทึกการลา: ${customStats.leaveCount || 0} รายการ\n`;
      }

      const msg = `🏛️ <b>แจ้งเตือนประจำวัน: ระบบประวัติข้าราชการและพัฒนาตนเอง</b> ⏰\n📅 <i>${thaiDate}</i>\n\nเรียน ${namePart} 🙏😊\nวันนี้อย่าลืมติดตามและบันทึกข้อมูลการปฏิบัติงานประจำวัน เพื่อความพร้อมในรอบการประเมินเลื่อนระดับ ก.พ. 7 ครับ\n${statsPart}\n✨ <b>สิ่งที่แนะนำให้ตรวจสอบวันนี้:</b>\n1️⃣ บันทึกชั่วโมงการฝึกอบรม / สัมมนา / e-Learning ล่าสุด\n2️⃣ ตรวจสอบคำสั่งเลื่อนขั้นเงินเดือน หรือคำสั่งแต่งตั้ง\n3️⃣ บันทึกวันลา หรือตรวจเช็คโควตาวันลาสะสม\n4️⃣ สแกนและแนบเอกสารหลักฐานสำคัญลง Google Drive\n\n💡 <i>"บันทึกผลงานวันนี้ สบายใจในวันประเมินราชการ"</i>`;

      const result = await sendTelegramNotification(msg, [
        { text: '📱 เปิดระบบบันทึกทันที', url: targetUrl },
        { text: '🏖️ บันทึกประวัติการลา', url: targetUrl }
      ]);

      if (result && !result.success && result.reason) {
        return res.status(400).json({ success: false, message: result.reason });
      }

      res.json({ success: true, message: 'ส่งการแจ้งเตือนประจำวันเข้า Telegram เรียบร้อยแล้ว 📲' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notify", async (req, res) => {
    try {
      const { message, platform = 'all', buttons } = req.body;
      
      if (platform === 'telegram' || platform === 'all') {
        await sendTelegramNotification(message, buttons);
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
