import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { logout } from '../lib/googleAuth';
import Swal from 'sweetalert2';

interface HeaderProps {
  toggleSidebar: () => void;
  activeTabLabel: string;
  profileData?: UserProfile | null;
  setActiveTab?: (tab: string) => void;
  onOpenBackupModal?: () => void;
}

export function Header({ toggleSidebar, activeTabLabel, profileData, setActiveTab, onOpenBackupModal }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const displayName = profileData?.firstName && profileData?.lastName
    ? `${profileData.firstName} ${profileData.lastName}`
    : 'ผู้รับบริการ';
    
  const fullNameWithPrefix = profileData?.prefix && profileData?.firstName && profileData?.lastName
    ? `${profileData.prefix}${profileData.firstName} ${profileData.lastName}`
    : displayName;
    
  const jobTitle = profileData?.position || 'บุคลากรหน่วยงาน';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-8 shadow-xs select-none font-sans">
      {/* Left side: Hamburger + Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="text-slate-600 hover:text-slate-900 lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <i className="fa-solid fa-bars text-xl" aria-hidden="true"></i>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline-block">หน้าหลัก</span>
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 hidden sm:inline-block"></i>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{activeTabLabel}</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="ระบบเชื่อมต่ออยู่"></span>
          </h1>
        </div>
      </div>

      {/* Right side: Notifications + User Dropdown */}
      <div className="flex items-center gap-3 sm:gap-5 ml-auto" ref={dropdownRef}>
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center relative shadow-2xs border border-slate-200/60" 
            aria-label="Notifications" 
            title="การแจ้งเตือนระบบ"
          >
            <i className="fa-regular fa-bell text-base" aria-hidden="true"></i>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          <AnimatePresence>
            {notificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-bell text-amber-500"></i>
                    การแจ้งเตือน
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">1 ใหม่</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                    <i className="fa-solid fa-circle-check text-emerald-500 text-sm mt-0.5"></i>
                    <div>
                      <p className="font-semibold text-slate-800">เชื่อมต่อ Google Sheets สำเร็จ</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">ข้อมูลของคุณได้รับการซิงค์แบบเรียลไทม์</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown Button */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 bg-slate-100/80 hover:bg-slate-200/80 py-1.5 px-3 sm:px-3.5 rounded-full transition-all border border-slate-200/70 active:scale-98 shadow-2xs"
            aria-expanded={dropdownOpen}
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-white shadow-2xs flex items-center justify-center">
              {profileData?.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-user text-slate-400 text-xs" aria-hidden="true"></i>
              )}
            </div>
            <span className="font-medium text-xs sm:text-sm text-slate-800 hidden md:block max-w-[140px] truncate">
              {displayName}
            </span>
            <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 ml-0.5" aria-hidden="true"></i>
          </button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-50"
              >
                <div className="p-5 flex flex-col items-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                  <div className="w-18 h-18 rounded-full overflow-hidden bg-slate-200 mb-3 shadow-md border-2 border-white flex justify-center items-center">
                    {profileData?.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-user text-3xl text-slate-400" aria-hidden="true"></i>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm text-center">
                    {fullNameWithPrefix} {profileData?.nickname ? `(${profileData.nickname})` : ''}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium text-center mt-0.5">{jobTitle}</p>
                  
                  <button 
                    className="mt-3 text-[11px] text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-200/80 transition-colors font-medium flex items-center gap-1.5"
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveTab && setActiveTab('profile');
                    }}
                  >
                    <span>ดูประวัติเต็ม</span>
                    <i className="fa-solid fa-arrow-right text-[9px]" aria-hidden="true"></i>
                  </button>
                </div>
                
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenBackupModal?.();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-colors flex items-center gap-3 font-semibold"
                  >
                    <i className="fa-solid fa-shield-halved w-4 text-center text-emerald-500" aria-hidden="true"></i> สำรองข้อมูล & Drive
                  </button>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveTab && setActiveTab('profile');
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-100/80 rounded-2xl transition-colors flex items-center gap-3 font-medium"
                  >
                    <i className="fa-regular fa-user w-4 text-center text-slate-400" aria-hidden="true"></i> ข้อมูลส่วนตัว
                  </button>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      Swal.fire({
                        title: 'ตั้งค่าระบบ',
                        text: 'เชื่อมต่อด้วยระบบ Google Authentication ปลอดภัยสูงสุด',
                        icon: 'info',
                        confirmButtonColor: '#0F172A'
                      });
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-100/80 rounded-2xl transition-colors flex items-center gap-3 font-medium"
                  >
                    <i className="fa-solid fa-shield-halved w-4 text-center text-slate-400" aria-hidden="true"></i> ความปลอดภัยบัญชี
                  </button>
                  
                  <div className="h-px bg-slate-100 my-1 mx-2"></div>

                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-red-600 hover:bg-red-50 rounded-2xl transition-colors flex items-center gap-3 font-medium"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-red-400" aria-hidden="true"></i> ลงชื่อออก
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
