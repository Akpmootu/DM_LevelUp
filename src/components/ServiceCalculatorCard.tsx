import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface ServiceCalculatorCardProps {
  profileData?: UserProfile | null;
  onOpenProfile?: () => void;
}

// Helper to parse dates in format YYYY-MM-DD or DD/MM/YYYY or BE years
function parseAnyDate(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const str = dateStr.trim();

  // Check YYYY-MM-DD
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      let year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (year > 2400) year -= 543; // Convert B.E. to A.D.
      return new Date(year, month, day);
    }
  }

  // Check DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year > 2400) year -= 543; // Convert B.E. to A.D.
      return new Date(year, month, day);
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Calculate diff in Y, M, D
function calculateDiffYMD(startDate: Date, endDate: Date = new Date()) {
  if (startDate > endDate) return { years: 0, months: 0, days: 0 };

  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

// Compute official Thai government retirement date (30 September)
function calculateRetirement(birthDate?: string) {
  const bDate = parseAnyDate(birthDate);
  if (!bDate) return null;

  const birthYearAD = bDate.getFullYear();
  const birthMonth = bDate.getMonth() + 1; // 1-12
  const birthDay = bDate.getDate();

  // Thai civil service rule:
  // Born Oct 1 onwards -> retires Sep 30 after turning 60 (which is birthYear + 61)
  // Born Sep 30 or earlier -> retires Sep 30 of year turning 60 (birthYear + 60)
  let retirementYearAD = birthYearAD + 60;
  if (birthMonth > 9 || (birthMonth === 9 && birthDay > 30)) {
    retirementYearAD += 1;
  }

  const retirementDate = new Date(retirementYearAD, 8, 30); // 30 September
  const retirementYearBE = retirementYearAD + 543;

  const now = new Date();
  const remaining = calculateDiffYMD(now, retirementDate);

  return {
    date: retirementDate,
    yearBE: retirementYearBE,
    formattedDateStr: `30 กันยายน พ.ศ. ${retirementYearBE}`,
    remaining,
    isRetired: now > retirementDate,
  };
}

// Performance evaluation cycle info
function getEvaluationCycleInfo() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Round 1: April 1 (Evaluates Oct 1 - Mar 31)
  const apr1 = new Date(currentYear, 3, 1);
  // Round 2: October 1 (Evaluates Apr 1 - Sep 30)
  const oct1 = new Date(currentYear, 9, 1);

  let nextEvalDate: Date;
  let cycleName: string;

  if (now < apr1) {
    nextEvalDate = apr1;
    cycleName = 'รอบที่ 1/ประจำปี (1 ต.ค. - 31 มี.ค.)';
  } else if (now < oct1) {
    nextEvalDate = oct1;
    cycleName = 'รอบที่ 2/ประจำปี (1 เม.ย. - 30 ก.ย.)';
  } else {
    nextEvalDate = new Date(currentYear + 1, 3, 1);
    cycleName = 'รอบที่ 1/ประจำปีถัดไป (1 ต.ค. - 31 มี.ค.)';
  }

  const diffTime = nextEvalDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    cycleName,
    nextEvalDateStr: nextEvalDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
    daysLeft,
  };
}

export function ServiceCalculatorCard({ profileData, onOpenProfile }: ServiceCalculatorCardProps) {
  const appDate = parseAnyDate(profileData?.appointDate || profileData?.startDate);
  const positionDate = parseAnyDate(profileData?.licenseDate || profileData?.appointDate || profileData?.startDate);
  const birthDate = profileData?.birthDate;

  const totalService = appDate ? calculateDiffYMD(appDate) : null;
  const positionService = positionDate ? calculateDiffYMD(positionDate) : null;
  const retirementInfo = calculateRetirement(birthDate);
  const evalInfo = getEvaluationCycleInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-7 space-y-6 relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/10 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-amber-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              คำนวณอายุราชการและวันเกษียณ ⏳
            </h3>
            <p className="text-xs text-slate-500">
              ประมวลผลอายุราชการ วันเกษียณอายุ และรอบประเมินผลการปฏิบัติราชการ
            </p>
          </div>
        </div>

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-pen-to-square text-indigo-600"></i>
            <span>ตั้งค่าวันบรรจุ/วันเกิด</span>
          </button>
        )}
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Government Service */}
        <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-2">
            <span>อายุราชการรวมทั้งหมด</span>
            <i className="fa-solid fa-award text-amber-400 text-base"></i>
          </div>
          {totalService ? (
            <div className="my-2">
              <div className="flex items-baseline gap-1 text-3xl font-black text-amber-400 tracking-tight">
                <span>{totalService.years}</span>
                <span className="text-xs font-normal text-slate-300">ปี</span>
                <span>{totalService.months}</span>
                <span className="text-xs font-normal text-slate-300">เดือน</span>
                <span>{totalService.days}</span>
                <span className="text-xs font-normal text-slate-300">วัน</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                บรรจุเมื่อ:{' '}
                <span className="text-slate-200 font-medium">
                  {profileData?.appointDate || profileData?.startDate}
                </span>
              </p>
            </div>
          ) : (
            <div className="my-3 text-xs text-slate-400 italic">
              โปรดระบุวันบรรจุรับราชการในหน้าประวัติส่วนตัว
            </div>
          )}
          <div className="pt-2 border-t border-indigo-900/60 text-[10px] text-indigo-300/80 flex items-center justify-between">
            <span>สถานะ: รับราชการปัจจุบัน</span>
            <i className="fa-solid fa-check-double text-emerald-400"></i>
          </div>
        </div>

        {/* Card 2: Retirement Date */}
        <div className="p-4 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white rounded-2xl border border-amber-200/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-2">
            <span>วันเกษียณอายุราชการ</span>
            <i className="fa-solid fa-calendar-check text-amber-600 text-base"></i>
          </div>
          {retirementInfo ? (
            <div className="my-2">
              <div className="text-sm font-bold text-slate-900">
                {retirementInfo.formattedDateStr}
              </div>
              <div className="text-xs text-amber-900 font-medium mt-1 flex items-center gap-1">
                <span>คงเหลืออีก:</span>
                <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  {retirementInfo.remaining.years} ปี {retirementInfo.remaining.months} เดือน {retirementInfo.remaining.days} วัน
                </span>
              </div>
            </div>
          ) : (
            <div className="my-3 text-xs text-slate-500 italic">
              โปรดระบุวันเกิดในหน้าประวัติส่วนตัวเพื่อคำนวณวันเกษียณ
            </div>
          )}
          <div className="pt-2 border-t border-amber-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>เกณฑ์: 30 กันยายน (อายุครบ 60 ปี)</span>
            <i className="fa-solid fa-circle-info text-amber-600"></i>
          </div>
        </div>

        {/* Card 3: Position Tenure */}
        <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white rounded-2xl border border-emerald-200/80 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-2">
            <span>ระยะเวลาในตำแหน่งปัจจุบัน</span>
            <i className="fa-solid fa-briefcase text-emerald-600 text-base"></i>
          </div>
          {positionService ? (
            <div className="my-2">
              <div className="flex items-baseline gap-1 text-2xl font-bold text-slate-900">
                <span>{positionService.years}</span>
                <span className="text-xs font-normal text-slate-500">ปี</span>
                <span>{positionService.months}</span>
                <span className="text-xs font-normal text-slate-500">เดือน</span>
                <span>{positionService.days}</span>
                <span className="text-xs font-normal text-slate-500">วัน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                ตำแหน่ง: <span className="font-semibold text-slate-800">{profileData?.position || 'รับราชการ'}</span>
              </p>
            </div>
          ) : (
            <div className="my-3 text-xs text-slate-500 italic">
              อ้างอิงจากวันที่ดำรงตำแหน่งในระบบ
            </div>
          )}
          <div className="pt-2 border-t border-emerald-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>ระดับ: {profileData?.level || '-'}</span>
            <i className="fa-solid fa-user-check text-emerald-600"></i>
          </div>
        </div>
      </div>

      {/* Performance Evaluation Reminder Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 text-lg">
            <i className="fa-solid fa-bell"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">แจ้งเตือนรอบประเมินผลการปฏิบัติราชการ</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                {evalInfo.cycleName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              รอบประเมินถัดไป: <span className="text-amber-300 font-semibold">{evalInfo.nextEvalDateStr}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 shrink-0 self-end sm:self-center">
          <i className="fa-solid fa-clock text-amber-400"></i>
          <span className="text-xs text-slate-300">อีก</span>
          <span className="text-base font-extrabold text-amber-400">{evalInfo.daysLeft}</span>
          <span className="text-xs text-slate-300">วัน</span>
        </div>
      </div>
    </motion.div>
  );
}
