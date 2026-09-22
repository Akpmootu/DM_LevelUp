import React, { useState, useEffect } from 'react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { getOfflineQueue, syncOfflineQueue, clearOfflineQueue, OfflineQueueItem } from '../lib/offlineSync';
import Swal from 'sweetalert2';

interface OfflineSyncBannerProps {
  onSyncSuccess?: () => void;
  userStats?: {
    officialCount: number;
    trainingCount: number;
    experienceCount: number;
    leaveCount: number;
  };
  userName?: string;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onSyncSuccess, userStats, userName }) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ configured: boolean; lastSentDate: string | null } | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const updateQueueCount = () => {
    const queue = getOfflineQueue();
    setQueueCount(queue.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleQueueChange = () => updateQueueCount();
    window.addEventListener('offline-queue-updated', handleQueueChange);
    window.addEventListener('offline-sync-completed', handleQueueChange);

    // Auto-sync when coming back online
    const handleOnlineEvent = async () => {
      const q = getOfflineQueue();
      if (q.length > 0) {
        Swal.fire({
          icon: 'info',
          title: 'กลับมาเชื่อมต่ออินเทอร์เน็ตแล้ว 📶',
          text: `พบข้อมูลที่บันทึกขณะออฟไลน์ ${q.length} รายการ ระบบกำลังเริ่มซิงค์อัตโนมัติ...`,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        handleSync();
      }
    };
    window.addEventListener('online', handleOnlineEvent);

    // Check Telegram Bot connection status
    fetch('/api/telegram/status')
      .then(res => res.json())
      .then(data => setTelegramStatus(data))
      .catch(e => console.warn('Could not fetch telegram status', e));

    return () => {
      window.removeEventListener('offline-queue-updated', handleQueueChange);
      window.removeEventListener('offline-sync-completed', handleQueueChange);
      window.removeEventListener('online', handleOnlineEvent);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      Swal.fire({
        icon: 'warning',
        title: 'ขณะนี้ไม่มีสัญญาณอินเทอร์เน็ต',
        text: 'ระบบจะซิงค์ให้อัตโนมัติเมื่ออุปกรณ์กลับมาออนไลน์ครับ',
        confirmButtonColor: '#0f172a'
      });
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncOfflineQueue((synced, total, item) => {
        // progress callback
      });

      if (res.syncedCount > 0) {
        Swal.fire({
          icon: 'success',
          title: 'ซิงค์ข้อมูลสำเร็จ! ✅',
          text: `อัปเดตข้อมูลขึ้น Google Sheets/Drive เรียบร้อยแล้ว ${res.syncedCount} รายการ`,
          confirmButtonColor: '#0f172a',
          timer: 2500
        });
        if (onSyncSuccess) onSyncSuccess();
      } else if (res.errors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'ซิงค์ข้อมูลไม่สำเร็จ',
          text: 'กรุณาตรวจสอบการเข้าสู่ระบบ Google อีกครั้ง',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการซิงค์',
        text: e.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setIsSyncing(false);
      updateQueueCount();
    }
  };

  const handleTriggerDailyReminder = async () => {
    setIsSendingReminder(true);
    try {
      const res = await fetch('/api/telegram/daily-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName || 'ข้าราชการ/บุคลากร',
          appUrl: window.location.origin,
          customStats: userStats || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'ส่งการแจ้งเตือนสำเร็จ! 📲',
          html: `<p class="text-sm text-slate-600">ระบบได้ส่งข้อความแจ้งเตือนติดตามงานประจำวันเข้า Group Telegram เรียบร้อยแล้ว พร้อมปุ่มกด Inline Keyboard</p>`,
          confirmButtonColor: '#0f172a'
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'แจ้งเตือน Telegram',
          text: data.message || 'ยังไม่ได้ระบุ TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ในระบบ',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ส่งไม่สำเร็จ',
        text: err.message || 'เกิดข้อผิดพลาด',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  return (
    <>
      <div className="w-full bg-slate-900 border-b border-slate-800 text-white px-4 py-2 sm:py-2.5 text-xs select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Online/Offline Status */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className={isOnline ? 'text-emerald-300' : 'text-rose-300 font-bold'}>
                {isOnline ? 'ออนไลน์ (Online)' : 'ออฟไลน์ (Offline Mode)'}
              </span>
            </span>

            {/* Offline Queue Badge */}
            {queueCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-medium">
                <i className="fa-solid fa-cloud-arrow-up text-xs animate-bounce"></i>
                <span>มี {queueCount} รายการรอซิงค์</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Sync + Daily Reminder + PWA Install */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Sync Now Button if pending */}
            {queueCount > 0 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold px-3 py-1 rounded-lg transition shadow-xs text-xs"
              >
                <i className={`fa-solid fa-arrows-rotate text-xs ${isSyncing ? 'animate-spin' : ''}`}></i>
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลทันที'}</span>
              </button>
            )}

            {/* Daily Telegram Reminder Button */}
            <button
              onClick={handleTriggerDailyReminder}
              disabled={isSendingReminder}
              title="ส่งการแจ้งเตือนติดตามงานประจำวันเข้า Telegram"
              className="flex items-center gap-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-lg transition active:scale-95 text-xs font-medium"
            >
              <i className={`fa-brands fa-telegram text-sky-400 ${isSendingReminder ? 'animate-pulse' : ''}`}></i>
              <span className="hidden sm:inline">แจ้งเตือนประจำวัน</span>
              <span className="sm:hidden">เตือน Telegram</span>
            </button>

            {/* PWA Install Button (Chromium / Android) */}
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-1 rounded-lg transition active:scale-95 shadow-xs text-xs"
              >
                <i className="fa-solid fa-mobile-screen-button"></i>
                <span>ติดตั้งแอป (PWA)</span>
              </button>
            )}

            {/* iOS Safari Guide Button */}
            {isIOS && !isInstalled && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg transition text-xs"
              >
                <i className="fa-brands fa-apple text-slate-300"></i>
                <span>วิธีติดตั้งบน iPhone</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800 animate-in fade-in duration-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <i className="fa-brands fa-apple text-xl text-slate-900"></i>
                ติดตั้งแอปบน iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">1</span>
                <span>เปิดเว็บไซต์นี้ด้วยเบราว์เซอร์ <strong>Safari</strong> บน iPhone</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">2</span>
                <span>แตะปุ่ม <strong>แชร์ (Share)</strong> <i className="fa-solid fa-arrow-up-from-bracket text-blue-500 mx-1"></i> ที่แถบด้านล่าง</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">3</span>
                <span>เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong> 📲</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">4</span>
                <span>เปิดใช้งานได้เหมือนแอปพลิเคชัน พร้อมรองรับการบันทึกประวัติแบบออฟไลน์</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
};
