import React from 'react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import { YearlyAnalyticsChart } from './YearlyAnalyticsChart';
import { ServiceCalculatorCard } from './ServiceCalculatorCard';
import { OfficialHistory, TrainingHistory, UserProfile } from '../types';

interface DashboardProps {
  officialCount: number;
  trainingCount: number;
  experienceCount: number;
  loading: boolean;
  officialLogs?: OfficialHistory[];
  trainingLogs?: TrainingHistory[];
  profileData?: UserProfile | null;
  onOpenProfile?: () => void;
}

export function Dashboard({ 
  officialCount, 
  trainingCount, 
  experienceCount, 
  loading,
  officialLogs = [],
  trainingLogs = [],
  profileData,
  onOpenProfile
}: DashboardProps) {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 text-slate-500 gap-4 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-spin">
            <i className="fa-solid fa-circle-notch text-3xl text-amber-600"></i>
          </div>
          <i className="fa-solid fa-chart-pie text-amber-600 text-lg absolute"></i>
        </div>
        <p className="text-sm font-medium tracking-wide">กำลังโหลดข้อมูลกระดานสรุปผล...</p>
      </div>
    );
  }

  const total = officialCount + trainingCount + experienceCount;

  const handlePrintSummary = () => {
    Swal.fire({
      icon: 'info',
      title: 'พิมพ์รายงานสรุปผล',
      text: `ระบบกำลังจัดเตรียมเอกสารสรุปข้อมูลประวัติรวม ${total} รายการ`,
      confirmButtonText: 'พิมพ์เอกสาร (PDF)',
      confirmButtonColor: '#0F172A',
      showCancelButton: true,
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        window.print();
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Live Analytics & Profile Feed
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-none">
            ภาพรวม <span className="font-light italic text-slate-500">แฟ้มประวัติส่วนบุคคล</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-2xs">
          <i className="fa-regular fa-clock text-amber-600"></i>
          <span>อัปเดตล่าสุด: วันนี้</span>
        </div>
      </div>

      {/* Government Service & Retirement Calculator Card */}
      <ServiceCalculatorCard profileData={profileData} onOpenProfile={onOpenProfile} />

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bento Box 1: Official History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="group relative bg-gradient-to-br from-white via-white to-amber-50/40 p-7 rounded-3xl border border-amber-200/60 shadow-lg shadow-amber-900/5 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[240px]"
        >
          {/* Top Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <i className="fa-solid fa-user-tie text-2xl"></i>
            </div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/50">
              ประวัติรับราชการ
            </span>
          </div>

          <div className="relative z-10 my-4 flex items-baseline justify-between">
            <div>
              <h3 className="text-5xl sm:text-6xl font-sans font-extrabold text-slate-900 tracking-tight">
                {officialCount}
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                รายการคำสั่ง / โยกย้าย
              </p>
            </div>

            {/* Sparkline Graphic */}
            <div className="w-24 h-10 flex items-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <span className="w-2 h-40% bg-amber-300 rounded-t-sm"></span>
              <span className="w-2 h-65% bg-amber-400 rounded-t-sm"></span>
              <span className="w-2 h-45% bg-amber-300 rounded-t-sm"></span>
              <span className="w-2 h-90% bg-amber-500 rounded-t-sm"></span>
              <span className="w-2 h-100% bg-amber-600 rounded-t-sm"></span>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-amber-100/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>สถานะข้อมูล: สมบูรณ์</span>
            <i className="fa-solid fa-arrow-right text-amber-600 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </motion.div>

        {/* Bento Box 2: Training History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="group relative bg-gradient-to-br from-white via-white to-indigo-50/40 p-7 rounded-3xl border border-indigo-200/60 shadow-lg shadow-indigo-900/5 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[240px]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <i className="fa-solid fa-chalkboard-user text-2xl"></i>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/80 px-3 py-1 rounded-full border border-indigo-300/50">
              อบรม / ดูงาน
            </span>
          </div>

          <div className="relative z-10 my-4 flex items-baseline justify-between">
            <div>
              <h3 className="text-5xl sm:text-6xl font-sans font-extrabold text-slate-900 tracking-tight">
                {trainingCount}
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                หลักสูตรพัฒนาทักษะ
              </p>
            </div>

            {/* Circular Progress Ring Representation */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-indigo-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600"
                  strokeDasharray="75, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <i className="fa-solid fa-graduation-cap text-indigo-600 text-xs absolute"></i>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>การยกระดับทักษะ: ต่อเนื่อง</span>
            <i className="fa-solid fa-arrow-right text-indigo-600 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </motion.div>

        {/* Bento Box 3: Work Experience (Midnight Dark Glass Accent) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-7 rounded-3xl border border-slate-800 shadow-xl shadow-slate-950/20 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[240px]"
        >
          {/* Subtle Emerald Neon Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform" />

          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
              <i className="fa-solid fa-briefcase text-2xl"></i>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
              คณะทำงาน / ประสบการณ์
            </span>
          </div>

          <div className="relative z-10 my-4 flex items-baseline justify-between">
            <div>
              <h3 className="text-5xl sm:text-6xl font-sans font-extrabold text-white tracking-tight">
                {experienceCount}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                บทบาทหน้าที่พิเศษ
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <i className="fa-solid fa-circle-check text-[10px]"></i>
              <span>Active</span>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>ความเชี่ยวชาญวิชาชีพ</span>
            <i className="fa-solid fa-arrow-right text-emerald-400 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </motion.div>
      </div>

      {/* Yearly Summary Recharts Analytics Component */}
      <YearlyAnalyticsChart officialLogs={officialLogs} trainingLogs={trainingLogs} />

      {/* Glassmorphic Welcome Banner & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative bg-white/85 backdrop-blur-2xl rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
      >
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-white shadow-md flex justify-center items-center text-amber-700 text-2xl">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"
              title="ระบบออนไลน์"
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-serif font-bold text-2xl text-slate-900 tracking-tight">
                ยินดีต้อนรับกลับเข้าสู่ระบบ
              </h4>
              <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2.5 py-0.5 rounded-full border border-amber-200">
                Verified Profile
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              คุณมีประวัติผลงานในระบบรวมทั้งสิ้น{' '}
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-900 text-white font-bold text-xs mx-1">
                {total}
              </span>{' '}
              รายการ
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintSummary}
          className="group relative w-full md:w-auto whitespace-nowrap px-8 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-900/20 active:scale-98 transition-all duration-300 flex items-center justify-center gap-3 border border-slate-700"
        >
          <i className="fa-solid fa-print text-amber-400 text-sm group-hover:scale-110 transition-transform"></i>
          <span>พิมพ์รายงานสรุป</span>
          <i className="fa-solid fa-angle-right text-xs text-slate-400 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </motion.div>
    </div>
  );
}
