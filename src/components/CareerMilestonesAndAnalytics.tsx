import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'motion/react';
import { OfficialHistory, LeaveLog, TrainingHistory } from '../types';

interface CareerMilestonesAndAnalyticsProps {
  officialLogs?: OfficialHistory[];
  leaveLogs?: LeaveLog[];
  trainingLogs?: TrainingHistory[];
  currentFiscalYear?: string;
}

export function CareerMilestonesAndAnalytics({
  officialLogs = [],
  leaveLogs = [],
  trainingLogs = [],
  currentFiscalYear,
}: CareerMilestonesAndAnalyticsProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<'salary_career' | 'leave_analytics'>('salary_career');
  const [salaryViewType, setSalaryViewType] = useState<'area' | 'line'>('area');

  // Determine current Thai fiscal year (Government fiscal year starts Oct 1)
  const now = new Date();
  const fiscalYearThai = useMemo(() => {
    if (currentFiscalYear) return currentFiscalYear;
    const yearAD = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    // If October or later, fiscal year is next calendar year
    const fiscalAD = month >= 10 ? yearAD + 1 : yearAD;
    return (fiscalAD + 543).toString();
  }, [currentFiscalYear]);

  // 1. Process Career Milestones & Salary Progression Over Time
  const { salaryTimelineData, careerMilestones, salaryGrowthPercent, currentSalary, startingSalary } = useMemo(() => {
    // Standard baseline fallback if user has few or no records
    const fallbackList: Array<{
      dateStr: string;
      orderTimestamp: number;
      yearLabel: string;
      salary: number;
      position: string;
      movement: string;
      isMilestone: boolean;
      milestoneBadge?: string;
    }> = [
      {
        dateStr: '01/05/2564',
        orderTimestamp: new Date('2021-05-01').getTime(),
        yearLabel: '2564',
        salary: 21500,
        position: 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ',
        movement: 'บรรจุแต่งตั้งเข้ารับราชการ',
        isMilestone: true,
        milestoneBadge: 'บรรจุแรกเข้า',
      },
      {
        dateStr: '01/10/2565',
        orderTimestamp: new Date('2022-10-01').getTime(),
        yearLabel: '2565',
        salary: 24200,
        position: 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ',
        movement: 'เลื่อนขั้นเงินเดือนประจำปี รอบ 2',
        isMilestone: false,
      },
      {
        dateStr: '01/10/2566',
        orderTimestamp: new Date('2023-10-01').getTime(),
        yearLabel: '2566',
        salary: 27800,
        position: 'นักวิชาการคอมพิวเตอร์ปฏิบัติการ',
        movement: 'เลื่อนขั้นเงินเดือนประจำปี ร้อยละ 3.2',
        isMilestone: false,
      },
      {
        dateStr: '01/10/2567',
        orderTimestamp: new Date('2024-10-01').getTime(),
        yearLabel: '2567',
        salary: 31500,
        position: 'นักวิชาการคอมพิวเตอร์ชำนาญการ',
        movement: 'แต่งตั้งให้ดำรงตำแหน่งระดับชำนาญการ',
        isMilestone: true,
        milestoneBadge: 'เลื่อนระดับ ชำนาญการ',
      },
      {
        dateStr: '01/04/2568',
        orderTimestamp: new Date('2025-04-01').getTime(),
        yearLabel: '2568',
        salary: 33800,
        position: 'นักวิชาการคอมพิวเตอร์ชำนาญการ',
        movement: 'เลื่อนขั้นเงินเดือน รอบ เม.ย. 2568',
        isMilestone: false,
      },
      {
        dateStr: '01/10/2568',
        orderTimestamp: new Date('2025-10-01').getTime(),
        yearLabel: '2569 (ปัจจุบัน)',
        salary: 36200,
        position: 'นักวิชาการคอมพิวเตอร์ชำนาญการ',
        movement: 'เลื่อนขั้นเงินเดือน รอบ ต.ค. 2568',
        isMilestone: true,
        milestoneBadge: 'ปัจจุบัน',
      },
    ];

    if (officialLogs.length === 0) {
      const startSal = fallbackList[0].salary;
      const curSal = fallbackList[fallbackList.length - 1].salary;
      const growth = Math.round(((curSal - startSal) / startSal) * 100);
      const milestones = fallbackList.filter((m) => m.isMilestone);
      return {
        salaryTimelineData: fallbackList,
        careerMilestones: milestones,
        salaryGrowthPercent: growth,
        currentSalary: curSal,
        startingSalary: startSal,
      };
    }

    // Process real officialLogs
    const parsedList = officialLogs
      .filter((item) => item.salary || item.date)
      .map((item, index) => {
        let timestamp = item.timestamp || 0;
        let yearLabel = 'พ.ศ. -';
        if (item.date) {
          const matchYear = item.date.match(/\b(25\d{2}|20\d{2})\b/);
          if (matchYear) {
            yearLabel = matchYear[1];
          }
        }

        const salary = Number(item.salary) || 0;
        const movement = item.movement || 'เลื่อนขั้น/คำสั่ง';
        const position = item.positionAndDept || 'ตำแหน่งราชการ';

        // Check if milestone (e.g. Appointment, Level advancement, Transfer)
        const isMilestone =
          index === 0 ||
          movement.includes('บรรจุ') ||
          movement.includes('แต่งตั้ง') ||
          movement.includes('ชำนาญการ') ||
          movement.includes('เชี่ยวชาญ') ||
          movement.includes('โอนย้าย') ||
          movement.includes('เลื่อนระดับ');

        let milestoneBadge = undefined;
        if (movement.includes('บรรจุ')) milestoneBadge = 'บรรจุรับราชการ';
        else if (movement.includes('ชำนาญการพิเศษ')) milestoneBadge = 'ชำนาญการพิเศษ';
        else if (movement.includes('ชำนาญการ')) milestoneBadge = 'เลื่อนชำนาญการ';
        else if (movement.includes('เชี่ยวชาญ')) milestoneBadge = 'เชี่ยวชาญ';
        else if (movement.includes('โอนย้าย')) milestoneBadge = 'โอนย้ายหน่วยงาน';
        else if (index === 0) milestoneBadge = 'จุดเริ่มต้น';

        return {
          dateStr: item.date || `รายการที่ ${index + 1}`,
          orderTimestamp: timestamp,
          yearLabel: yearLabel.startsWith('25') ? `ปี ${yearLabel}` : yearLabel,
          salary,
          position,
          movement,
          isMilestone,
          milestoneBadge,
        };
      })
      .filter((item) => item.salary > 0);

    if (parsedList.length === 0) {
      return {
        salaryTimelineData: fallbackList,
        careerMilestones: fallbackList.filter((m) => m.isMilestone),
        salaryGrowthPercent: 68,
        currentSalary: 36200,
        startingSalary: 21500,
      };
    }

    // Sort chronologically
    parsedList.sort((a, b) => a.orderTimestamp - b.orderTimestamp);

    const startSal = parsedList[0].salary;
    const curSal = parsedList[parsedList.length - 1].salary;
    const growth = startSal > 0 ? Math.round(((curSal - startSal) / startSal) * 100) : 0;
    const milestones = parsedList.filter((m) => m.isMilestone);

    return {
      salaryTimelineData: parsedList,
      careerMilestones: milestones.length > 0 ? milestones : [parsedList[0], parsedList[parsedList.length - 1]],
      salaryGrowthPercent: growth,
      currentSalary: curSal,
      startingSalary: startSal,
    };
  }, [officialLogs]);

  // 2. Process Current Fiscal Year Leave Usage Trends
  const {
    fiscalLeaveSummary,
    monthlyLeaveTrends,
    totalLeaveThisFiscal,
    sickDays,
    personalDays,
    vacationDays,
    otherDays,
    leaveQuotaRemaining,
  } = useMemo(() => {
    // Filter leave logs for current fiscal year
    const targetFY = fiscalYearThai;
    const currentFYLogs = leaveLogs.filter((log) => {
      if (!log.fiscalYear) return true; // If not tagged, include if recent
      return log.fiscalYear.toString().includes(targetFY) || targetFY.includes(log.fiscalYear.toString());
    });

    // Monthly bucket for fiscal year: Oct(10), Nov(11), Dec(12), Jan(01), Feb(02), Mar(03), Apr(04), May(05), Jun(06), Jul(07), Aug(08), Sep(09)
    const fiscalMonths = [
      { key: '10', label: 'ต.ค.', full: 'ตุลาคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '11', label: 'พ.ย.', full: 'พฤศจิกายน', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '12', label: 'ธ.ค.', full: 'ธันวาคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '01', label: 'ม.ค.', full: 'มกราคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '02', label: 'ก.พ.', full: 'กุมภาพันธ์', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '03', label: 'มี.ค.', full: 'มีนาคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '04', label: 'เม.ย.', full: 'เมษายน', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '05', label: 'พ.ค.', full: 'พฤษภาคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '06', label: 'มิ.ย.', full: 'มิถุนายน', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '07', label: 'ก.ค.', full: 'กรกฎาคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '08', label: 'ส.ค.', full: 'สิงหาคม', sick: 0, personal: 0, vacation: 0, other: 0 },
      { key: '09', label: 'ก.ย.', full: 'กันยายน', sick: 0, personal: 0, vacation: 0, other: 0 },
    ];

    let sickTotal = 0;
    let personalTotal = 0;
    let vacationTotal = 0;
    let otherTotal = 0;

    if (currentFYLogs.length > 0) {
      currentFYLogs.forEach((log) => {
        const days = Number(log.totalDays) || 1;
        const type = log.leaveType || 'ลาป่วย';

        // Extract month from startDate
        let monthKey = '10';
        if (log.startDate) {
          const parts = log.startDate.split(/[-/]/);
          if (parts.length >= 2) {
            // Check if format is YYYY-MM-DD or DD/MM/YYYY
            if (parts[0].length === 4) {
              monthKey = parts[1].padStart(2, '0');
            } else if (parts[2]?.length === 4) {
              monthKey = parts[1].padStart(2, '0');
            }
          }
        }

        const bucket = fiscalMonths.find((m) => m.key === monthKey) || fiscalMonths[0];

        if (type.includes('ป่วย')) {
          sickTotal += days;
          bucket.sick += days;
        } else if (type.includes('กิจ')) {
          personalTotal += days;
          bucket.personal += days;
        } else if (type.includes('พักผ่อน')) {
          vacationTotal += days;
          bucket.vacation += days;
        } else {
          otherTotal += days;
          bucket.other += days;
        }
      });
    } else {
      // Default demo distribution for current fiscal year visualization
      fiscalMonths[0].vacation = 2;
      fiscalMonths[1].sick = 1;
      fiscalMonths[2].vacation = 3;
      fiscalMonths[4].personal = 1;
      fiscalMonths[6].sick = 2;
      fiscalMonths[7].vacation = 2;

      sickTotal = 3;
      personalTotal = 1;
      vacationTotal = 7;
      otherTotal = 0;
    }

    const totalDays = sickTotal + personalTotal + vacationTotal + otherTotal;

    // Civil service annual vacation quota (usually 10 days for normal, up to 20 with accumulated)
    const vacationQuota = 10;
    const remainingVacation = Math.max(0, vacationQuota - vacationTotal);

    const pieData = [
      { name: 'ลาพักผ่อน', value: vacationTotal, color: '#D97706', icon: 'fa-mug-hot' },
      { name: 'ลาป่วย', value: sickTotal, color: '#2563EB', icon: 'fa-user-injured' },
      { name: 'ลากิจส่วนตัว', value: personalTotal, color: '#7C3AED', icon: 'fa-envelope' },
    ];

    if (otherTotal > 0) {
      pieData.push({ name: 'การลาอื่นๆ', value: otherTotal, color: '#059669', icon: 'fa-calendar-check' });
    }

    return {
      fiscalLeaveSummary: pieData,
      monthlyLeaveTrends: fiscalMonths,
      totalLeaveThisFiscal: totalDays,
      sickDays: sickTotal,
      personalDays: personalTotal,
      vacationDays: vacationTotal,
      otherDays: otherTotal,
      leaveQuotaRemaining: remainingVacation,
    };
  }, [leaveLogs, fiscalYearThai]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Section Title Header */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-lg shadow-slate-200/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 uppercase tracking-widest mb-2">
              <i className="fa-solid fa-chart-line text-amber-600"></i>
              Interactive Visualization Engine (Recharts)
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
              การวิเคราะห์เส้นทางวิชาชีพ <span className="font-light italic text-slate-500">& สถิติการลา</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              แสดงการเติบโตของอัตราเงินเดือน, หมุดหมายสำคัญในราชการ (Milestones), และพฤติกรรมการลาประจำปีงบประมาณ พ.ศ. {fiscalYearThai}
            </p>
          </div>

          {/* SubTab Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold self-start md:self-auto">
            <button
              onClick={() => setSelectedSubTab('salary_career')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                selectedSubTab === 'salary_career'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-award text-amber-400"></i>
              <span>เส้นทางเงินเดือน & Milestones</span>
            </button>
            <button
              onClick={() => setSelectedSubTab('leave_analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                selectedSubTab === 'leave_analytics'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-calendar-days"></i>
              <span>แนวโน้มการลาปี {fiscalYearThai}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Sub-Tab Content 1: Salary Progression & Career Milestones */}
        {selectedSubTab === 'salary_career' && (
          <div className="mt-6 space-y-6">
            {/* KPI Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">เงินเดือนปัจจุบัน</span>
                  <p className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
                    ฿{currentSalary.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-amber-700 font-medium">อัตราปัจจุบันตามคำสั่งล่าสุด</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center text-xl">
                  <i className="fa-solid fa-coins"></i>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">อัตราการเติบโตรวม</span>
                  <p className="text-2xl font-serif font-bold text-emerald-700 mt-0.5">
                    +{salaryGrowthPercent}%
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    จากจุดเริ่มต้น ฿{startingSalary.toLocaleString()}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center text-xl">
                  <i className="fa-solid fa-arrow-trend-up"></i>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">หมุดหมายสำคัญในราชการ</span>
                  <p className="text-2xl font-serif font-bold text-indigo-700 mt-0.5">
                    {careerMilestones.length} <span className="text-xs font-sans text-slate-500">เหตุการณ์</span>
                  </p>
                  <span className="text-[10px] text-indigo-600 font-medium">บันทึกประวัติการเลื่อนระดับและแต่งตั้ง</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-700 flex items-center justify-center text-xl">
                  <i className="fa-solid fa-flag-checkered"></i>
                </div>
              </div>
            </div>

            {/* Chart Control & View Switcher */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <i className="fa-solid fa-chart-area text-amber-600"></i>
                กราฟแสดงวิวัฒนาการอัตราเงินเดือนตามลำดับเวลา (Salary Progression Over Time)
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setSalaryViewType('area')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    salaryViewType === 'area' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setSalaryViewType('line')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    salaryViewType === 'line' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            {/* Recharts Salary Canvas */}
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {salaryViewType === 'area' ? (
                  <AreaChart data={salaryTimelineData} margin={{ top: 20, right: 25, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="salaryGradEnhanced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="yearLabel"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      domain={['dataMin - 3000', 'dataMax + 4000']}
                      tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-800 max-w-xs">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                                <span className="font-bold text-amber-400">{label} ({data.dateStr})</span>
                                {data.milestoneBadge && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {data.milestoneBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-serif font-bold text-white pt-0.5">
                                อัตราเงินเดือน: ฿{Number(data.salary).toLocaleString()}
                              </p>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                ตำแหน่ง: <span className="text-slate-100">{data.position}</span>
                              </p>
                              {data.movement && (
                                <p className="text-slate-400 text-[10px] italic">
                                  คำสั่ง: {data.movement}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="salary"
                      name="อัตราเงินเดือน"
                      stroke="#B48A1E"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#salaryGradEnhanced)"
                      dot={{ r: 5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#0F172A', stroke: '#F59E0B', strokeWidth: 3 }}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={salaryTimelineData} margin={{ top: 20, right: 25, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="yearLabel" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      domain={['dataMin - 3000', 'dataMax + 4000']}
                      tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-800">
                              <p className="font-bold text-amber-400">{label}</p>
                              <p className="text-base font-bold">฿{Number(data.salary).toLocaleString()}</p>
                              <p className="text-slate-400 text-[11px]">{data.movement}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="salary"
                      name="อัตราเงินเดือน"
                      stroke="#B48A1E"
                      strokeWidth={3.5}
                      dot={{ r: 5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Career Milestones Timeline Component */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <i className="fa-solid fa-timeline text-amber-600"></i>
                หมุดหมายสำคัญในเส้นทางราชการ (Career Milestones)
              </h4>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-indigo-500 before:to-slate-300">
                {careerMilestones.map((milestone, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 border border-slate-200/80 transition-all shadow-2xs"
                  >
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[27px] sm:-left-[35px] top-4 w-4 h-4 rounded-full bg-amber-500 border-3 border-white shadow-xs"></div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {milestone.position}
                        </span>
                        {milestone.milestoneBadge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/80">
                            {milestone.milestoneBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {milestone.movement}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="inline-block text-xs font-bold text-slate-900 font-mono bg-white px-2 py-1 rounded-lg border border-slate-200">
                        ฿{Number(milestone.salary).toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{milestone.dateStr}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Sub-Tab Content 2: Current Fiscal Year Leave Usage Trends */}
        {selectedSubTab === 'leave_analytics' && (
          <div className="mt-6 space-y-6">
            {/* Fiscal Year Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-mug-hot"></i> ลาพักผ่อน
                </span>
                <p className="text-2xl font-serif font-bold text-amber-900 mt-1">
                  {vacationDays} <span className="text-xs font-sans text-slate-500">วัน</span>
                </p>
                <span className="text-[10px] text-amber-700 font-medium">
                  คงเหลือสิทธิ์ {leaveQuotaRemaining} วัน
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-user-injured"></i> ลาป่วย
                </span>
                <p className="text-2xl font-serif font-bold text-blue-900 mt-1">
                  {sickDays} <span className="text-xs font-sans text-slate-500">วัน</span>
                </p>
                <span className="text-[10px] text-blue-600 font-medium">โควตาไม่เกิน 60 วัน/ปี</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
                <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-envelope"></i> ลากิจส่วนตัว
                </span>
                <p className="text-2xl font-serif font-bold text-purple-900 mt-1">
                  {personalDays} <span className="text-xs font-sans text-slate-500">วัน</span>
                </p>
                <span className="text-[10px] text-purple-600 font-medium">โควตาไม่เกิน 45 วัน/ปี</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300/80">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-calculator"></i> รวมการลาทั้งสิ้น
                </span>
                <p className="text-2xl font-serif font-bold text-slate-900 mt-1">
                  {totalLeaveThisFiscal} <span className="text-xs font-sans text-slate-500">วัน</span>
                </p>
                <span className="text-[10px] text-slate-500 font-medium">ปีงบประมาณ {fiscalYearThai}</span>
              </div>
            </div>

            {/* Split View: Monthly Bar Trends + Leave Distribution Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Left 2 Cols: Monthly Leave Distribution Bar Chart */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <i className="fa-solid fa-chart-column text-amber-600"></i>
                    สถิติการลารายเดือน (ตุลาคม - กันยายน ปีงบประมาณ {fiscalYearThai})
                  </span>
                  <span className="text-[11px] text-slate-500">หน่วย: จำนวนวัน</span>
                </div>

                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyLeaveTrends} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const totalMonth = data.sick + data.personal + data.vacation + (data.other || 0);
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-800">
                                <p className="font-bold text-amber-400">{data.full} ({data.label})</p>
                                <div className="space-y-0.5 text-slate-200 pt-1 border-t border-slate-800">
                                  <p className="flex justify-between gap-4">
                                    <span>ลาพักผ่อน:</span>
                                    <span className="font-bold text-amber-400">{data.vacation} วัน</span>
                                  </p>
                                  <p className="flex justify-between gap-4">
                                    <span>ลาป่วย:</span>
                                    <span className="font-bold text-blue-400">{data.sick} วัน</span>
                                  </p>
                                  <p className="flex justify-between gap-4">
                                    <span>ลากิจ:</span>
                                    <span className="font-bold text-purple-400">{data.personal} วัน</span>
                                  </p>
                                  <p className="flex justify-between gap-4 pt-1 border-t border-slate-800 font-bold text-white">
                                    <span>รวมเดือนนี้:</span>
                                    <span>{totalMonth} วัน</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                      <Bar dataKey="vacation" name="ลาพักผ่อน" stackId="a" fill="#D97706" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="sick" name="ลาป่วย" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="personal" name="ลากิจส่วนตัว" stackId="a" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right 1 Col: Pie Chart Breakdown */}
              <div className="space-y-2 flex flex-col justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <i className="fa-solid fa-chart-pie text-amber-600"></i>
                    สัดส่วนประเภทวันลา
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">แบ่งตามประเภทการลาที่อนุมัติ</p>
                </div>

                <div className="w-full h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fiscalLeaveSummary}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {fiscalLeaveSummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                                {data.name}: {data.value} วัน
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold font-serif text-slate-900">{totalLeaveThisFiscal}</span>
                    <span className="text-[10px] text-slate-500 font-medium">วันทั้งหมด</span>
                  </div>
                </div>

                {/* Custom Legends */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/80 text-xs">
                  {fiscalLeaveSummary.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">{item.value} วัน</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
