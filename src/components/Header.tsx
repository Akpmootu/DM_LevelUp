import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { logout } from '../lib/googleAuth';

interface HeaderProps {
  toggleSidebar: () => void;
  activeTabLabel: string;
  profileData?: UserProfile | null;
  setActiveTab?: (tab: string) => void;
}

export function Header({ toggleSidebar, activeTabLabel, profileData, setActiveTab }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
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
    
  const jobTitle = profileData?.position || 'บุคลากร';

  return (
    <header className="sticky top-0 z-30 bg-indigo-600 lg:bg-white border-b border-indigo-700 lg:border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 shadow-sm lg:shadow-none">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="text-white lg:text-slate-400 hover:text-indigo-100 lg:hover:text-slate-600 lg:hidden transition-colors mr-2"
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-white lg:text-slate-900 tracking-tight hidden sm:block">{activeTabLabel}</h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 ml-auto">
        <button className="text-indigo-100 lg:text-slate-400 hover:text-white lg:hover:text-slate-600 transition-all relative" aria-label="Notifications" title="การแจ้งเตือน">
          <i className="fa-regular fa-bell text-lg"></i>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 bg-indigo-700 lg:bg-slate-50 hover:bg-indigo-800 lg:hover:bg-slate-100 py-1.5 px-3 sm:px-4 rounded-full transition-colors border border-indigo-500 lg:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center">
              {profileData?.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-user text-slate-300"></i>
              )}
            </div>
            <span className="font-medium text-sm text-white lg:text-slate-700 hidden md:block">
              {displayName}
            </span>
            <i className="fa-solid fa-chevron-down text-xs text-indigo-200 lg:text-slate-400 ml-1"></i>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
              >
                <div className="p-6 flex flex-col items-center border-b border-slate-100 bg-slate-50">
                   <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 mb-3 shadow border-2 border-white">
                      {profileData?.avatarUrl ? (
                        <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <i className="fa-solid fa-user text-4xl text-slate-400 mt-4"></i>
                      )}
                   </div>
                   <h3 className="font-bold text-slate-800 text-center">{fullNameWithPrefix} {profileData?.nickname ? `(${profileData.nickname})` : ''}</h3>
                   <p className="text-sm text-slate-500 text-center">{jobTitle}</p>
                   
                   <button 
                     className="mt-3 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-medium flex items-center gap-1"
                     onClick={() => {
                        setDropdownOpen(false);
                        setActiveTab && setActiveTab('profile');
                     }}
                   >
                      ข้อมูลเพิ่มเติม <i className="fa-solid fa-caret-down"></i>
                   </button>
                </div>
                
                <div className="p-2 space-y-1">
                  <button 
                     onClick={() => {
                       setDropdownOpen(false);
                       setActiveTab && setActiveTab('profile');
                     }}
                     className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 font-medium"
                   >
                    <i className="fa-regular fa-user w-5 text-center text-slate-400"></i> ข้อมูลส่วนตัว
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 font-medium">
                    <i className="fa-solid fa-key w-5 text-center text-slate-400"></i> แก้ไขรหัสผ่าน
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3 font-medium">
                    <i className="fa-regular fa-bell w-5 text-center text-slate-400"></i> ตั้งค่าการแจ้งเตือน
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2"></div>
                  <button 
                     onClick={handleLogout}
                     className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 font-medium"
                   >
                    <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center text-red-400"></i> ลงชื่อออก
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
