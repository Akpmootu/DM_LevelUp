import React from 'react';
import { clsx } from 'clsx';
import Swal from 'sweetalert2';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBackupModal?: () => void;
}

export function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab, onOpenBackupModal }: SidebarProps) {
  const menus = [
    { id: 'dashboard', label: 'แดชบอร์ดสรุปผล', icon: 'fa-chart-pie' },
    { id: 'profile', label: 'ประวัติส่วนตัว', icon: 'fa-user' },
    { id: 'official', label: 'ประวัติรับราชการ', icon: 'fa-user-tie' },
    { id: 'training', label: 'ประวัติการฝึกอบรม', icon: 'fa-chalkboard-user' },
    { id: 'experience', label: 'ประสบการณ์ทำงาน', icon: 'fa-briefcase' },
    { id: 'leave', label: 'ประวัติการลา', icon: 'fa-umbrella-beach' },
    { id: 'search', label: 'ค้นหา & ติดแท็ก', icon: 'fa-magnifying-glass' },
    { id: 'documents', label: 'เอกสาร/รูปภาพ', icon: 'fa-folder-open' }
  ];

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "📢 <b>ข้อความทดสอบจากระบบทะเบียนประวัติ</b>\n\nระบบ API สามารถส่งการแจ้งเตือนได้สำเร็จ ✅",
          platform: 'telegram'
        })
      });
      
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'ทดสอบสำเร็จ',
          text: 'ส่งแจ้งเตือนเข้าระบบแล้ว (โปรดตรวจสอบใน Telegram)',
          confirmButtonColor: '#0F172A'
        });
      } else {
         throw new Error('Response error');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถติดต่อ API แจ้งเตือนได้',
        confirmButtonColor: '#f43f5e'
      });
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0F172A] via-[#0B132B] to-[#070D1E] text-slate-100 border-r border-slate-800/80 transform transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none select-none font-sans",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-amber-500/40 rounded-xl blur-xs group-hover:bg-amber-400/60 transition" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <i className="fa-solid fa-address-card text-lg" aria-hidden="true"></i>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg tracking-tight text-white">mootu LevelUp!</span>
              <span className="text-[10px] text-amber-400 tracking-[0.2em] font-bold uppercase flex items-center gap-1">
                <span>PROFILE DECK</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <i className="fa-solid fa-xmark text-xl" aria-hidden="true"></i>
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            เมนูหลัก
          </div>
          {menus.map((menu) => {
            const isActive = activeTab === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => { setActiveTab(menu.id); setIsOpen(false); }}
                className={clsx(
                  "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group text-left relative overflow-hidden font-medium text-sm",
                  isActive 
                    ? "bg-slate-800/90 text-amber-300 font-bold shadow-inner border border-amber-500/30" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                )}
              >
                {/* Active Neon Left Accent Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"></div>
                )}
                
                <i className={clsx(
                  "fa-solid w-5 text-center transition-transform text-base group-hover:scale-110", 
                  menu.icon,
                  isActive ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                )} aria-hidden="true"></i>

                <span className="tracking-wide flex-1">{menu.label}</span>

                {isActive && (
                  <i className="fa-solid fa-angle-right text-xs text-amber-400/80 ml-auto" aria-hidden="true"></i>
                )}
              </button>
            );
          })}
        </nav>

        {/* Backup & Telegram Notification Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-sm space-y-2">
          {onOpenBackupModal && (
            <button
              onClick={() => { onOpenBackupModal(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 justify-center text-emerald-300 hover:bg-emerald-950/40 font-semibold text-xs border border-emerald-500/30 hover:border-emerald-400/60 active:scale-98 shadow-xs"
            >
              <i className="fa-solid fa-shield-halved text-emerald-400 text-sm" aria-hidden="true"></i>
              <span className="tracking-wide">สำรองข้อมูล & Drive</span>
            </button>
          )}

          <button
            onClick={handleTestNotification}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white font-medium text-xs border border-slate-700/80 hover:border-amber-500/50 active:scale-98 shadow-xs"
          >
            <i className="fa-brands fa-telegram text-sky-400 text-sm" aria-hidden="true"></i>
            <span className="tracking-wider">ทดสอบแจ้งเตือน</span>
          </button>
        </div>
      </aside>
    </>
  );
}
