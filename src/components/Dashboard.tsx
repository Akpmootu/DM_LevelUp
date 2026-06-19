import React from 'react';
import { motion } from 'motion/react';

interface DashboardProps {
  officialCount: number;
  trainingCount: number;
  experienceCount: number;
  loading: boolean;
}

export function Dashboard({ officialCount, trainingCount, experienceCount, loading }: DashboardProps) {

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <i className="fa-solid fa-spinner fa-spin text-3xl mr-3 text-[#D4AF37]"></i>กำลังโหลดข้อมูลระบบ...
      </div>
    );
  }

  const total = officialCount + trainingCount + experienceCount;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      
      <div className="mb-8">
         <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase font-bold mb-3">Live Feed</p>
         <h2 className="font-serif text-3xl md:text-5xl text-slate-900 leading-tight">
            ภาพรวม <br/><i className="font-light text-slate-500">แฟ้มประวัติส่วนบุคคล</i>
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
               <i className="fa-solid fa-user-tie text-2xl text-slate-800"></i>
            </div>
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">ราชการ</span>
          </div>
          <div>
            <h3 className="text-5xl font-sans font-medium text-slate-900 tracking-tighter mb-2">{officialCount}</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">รายการบันทึกประวัติ</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
               <i className="fa-solid fa-chalkboard-user text-2xl text-indigo-600"></i>
            </div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">อบรม/ดูงาน</span>
          </div>
          <div>
            <h3 className="text-5xl font-sans font-medium text-slate-900 tracking-tighter mb-2">{trainingCount}</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">รายการหลักสูตร</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0A192F] p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-between min-h-[220px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
               <i className="fa-solid fa-briefcase text-2xl text-white"></i>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">ประสบการณ์</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-sans font-medium text-white tracking-tighter mb-2">{experienceCount}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">คณะทำงาน / หน้าที่</p>
          </div>
        </motion.div>
        
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
           <div className="relative">
             <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md flex justify-center items-center text-slate-400 text-2xl">
               <i className="fa-solid fa-user"></i>
             </div>
             <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
           </div>
           <div>
             <h4 className="font-serif text-2xl text-slate-900 mb-1">ยินดีต้อนรับกลับเข้าสู่ระบบ</h4>
             <p className="text-sm font-bold tracking-widest uppercase text-slate-500">
               คุณมีข้อมูลในระบบทั้งสิ้น <span className="text-indigo-600 mx-1">{total}</span> รายการ
             </p>
           </div>
         </div>
         <button className="whitespace-nowrap px-8 py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
            พิมพ์รายงานสรุป
         </button>
      </motion.div>

    </div>
  );
}
