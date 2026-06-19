import React from 'react';
import { clsx } from 'clsx';
import Swal from 'sweetalert2';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ isOpen, setIsOpen, activeTab, setActiveTab }: SidebarProps) {
  const menus = [
    { id: 'dashboard', label: 'แดชบอร์ดสรุปผล', icon: 'fa-chart-pie' },
    { id: 'profile', label: 'ประวัติส่วนตัว', icon: 'fa-user' },
    { id: 'official', label: 'ประวัติรับราชการ', icon: 'fa-user-tie' },
    { id: 'training', label: 'ประวัติการฝึกอบรม', icon: 'fa-chalkboard-user' },
    { id: 'experience', label: 'ประสบการณ์ทำงาน', icon: 'fa-briefcase' },
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
          confirmButtonColor: '#4f46e5'
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
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0A192F] text-slate-50 border-r border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-20 px-8 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-white shadow-lg shadow-[#D4AF37]/20">
              <i className="fa-solid fa-address-card text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wide font-serif">mootu LevelUp!</span>
              <span className="text-[10px] text-[#D4AF37] tracking-[0.2em] font-semibold uppercase">Profile Deck</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => { setActiveTab(menu.id); setIsOpen(false); }}
              className={clsx(
                "w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group text-left relative overflow-hidden",
                activeTab === menu.id 
                  ? "bg-slate-800 text-[#D4AF37] font-bold shadow-md" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-[#FAFAFA] font-medium"
              )}
            >
              {activeTab === menu.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]"></div>
              )}
              <i className={clsx(
                "fa-solid w-5 text-center transition-colors text-lg", 
                menu.icon,
                activeTab === menu.id ? "text-[#D4AF37]" : "text-slate-500 group-hover:text-slate-300"
              )}></i>
              <span className="text-sm tracking-widest">{menu.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
           <button
             onClick={handleTestNotification}
             className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 text-center justify-center text-slate-300 hover:bg-slate-800 hover:text-[#FAFAFA] font-bold border border-slate-700 hover:border-[#D4AF37]"
           >
             <i className="fa-brands fa-line text-[#00B900] text-lg"></i>
             <span className="text-xs uppercase tracking-widest">ทดสอบแจ้งเตือน</span>
           </button>
        </div>
      </aside>
    </>
  );
}
