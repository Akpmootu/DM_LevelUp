import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  ReferenceLine,
  Label
} from 'recharts';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import { OfficialHistory, TrainingHistory } from '../types';

interface YearlyAnalyticsChartProps {
  officialLogs?: OfficialHistory[];
  trainingLogs?: TrainingHistory[];
}

export function YearlyAnalyticsChart({ officialLogs = [], trainingLogs = [] }: YearlyAnalyticsChartProps) {
  const [activeChartTab, setActiveChartTab] = useState<'salary' | 'training' | 'combined'>('combined');
  const [yearRange, setYearRange] = useState<'all' | '3' | '5' | '10'>('5');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [targetTrainingDays, setTargetTrainingDays] = useState<number>(5); // Default 5 days per year according to civil service target
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const chartCardRef = useRef<HTMLDivElement>(null);

  // Process and aggregate timeline data
  const rawChartData = useMemo(() => {
    // Default fallback data for 5 years timeline if dataset is empty or initializing
    const defaultYears = ['2565', '2566', '2567', '2568', '2569'];
    const defaultSalaryMap: Record<string, number> = {
      '2565': 24500,
      '2566': 26800,
      '2567': 29400,
      '2568': 32100,
      '2569': 35500,
    };
    const defaultTrainingMap: Record<string, { count: number; days: number }> = {
      '2565': { count: 2, days: 5 },
      '2566': { count: 3, days: 8 },
      '2567': { count: 4, days: 12 },
      '2568': { count: 3, days: 7 },
      '2569': { count: 5, days: 15 },
    };

    const yearMap: Record<
      string,
      { year: string; yrNum: number; salary: number; trainingCourses: number; trainingDays: number; movementNote?: string }
    > = {};

    // Populate from real official history if available
    officialLogs.forEach((item) => {
      if (!item.date && !item.id) return;
      const yearMatch = (item.date || '').match(/\b(25\d{2}|20\d{2})\b/);
      const yr = yearMatch ? yearMatch[1] : '2568';
      const yrNum = parseInt(yr, 10);

      const salaryVal = Number(item.salary) || 0;
      if (!yearMap[yr]) {
        yearMap[yr] = {
          year: `พ.ศ. ${yr}`,
          yrNum,
          salary: salaryVal,
          trainingCourses: 0,
          trainingDays: 0,
          movementNote: item.movement,
        };
      } else {
        if (salaryVal > yearMap[yr].salary) {
          yearMap[yr].salary = salaryVal;
          if (item.movement) yearMap[yr].movementNote = item.movement;
        }
      }
    });

    // Populate from training history
    trainingLogs.forEach((item) => {
      const yr = item.year || '2568';
      const cleanYr = yr.replace('พ.ศ.', '').trim();
      const yrKey = cleanYr.length === 4 ? cleanYr : '2568';
      const yrNum = parseInt(yrKey, 10);

      if (!yearMap[yrKey]) {
        yearMap[yrKey] = {
          year: `พ.ศ. ${yrKey}`,
          yrNum,
          salary: defaultSalaryMap[yrKey] || 30000,
          trainingCourses: 1,
          trainingDays: Number(item.durationDays) || 1,
        };
      } else {
        yearMap[yrKey].trainingCourses += 1;
        yearMap[yrKey].trainingDays += Number(item.durationDays) || 1;
      }
    });

    // If yearMap is sparse or empty, build complete default series
    defaultYears.forEach((yr) => {
      if (!yearMap[yr]) {
        yearMap[yr] = {
          year: `พ.ศ. ${yr}`,
          yrNum: parseInt(yr, 10),
          salary: defaultSalaryMap[yr],
          trainingCourses: defaultTrainingMap[yr].count,
          trainingDays: defaultTrainingMap[yr].days,
          movementNote: 'ปรับเลื่อนขั้นปกติ',
        };
      }
    });

    // Sort by year ascending
    return Object.values(yearMap).sort((a, b) => a.yrNum - b.yrNum);
  }, [officialLogs, trainingLogs]);

  // Filter dataset according to selected year range
  const chartData = useMemo(() => {
    if (yearRange === 'all') return rawChartData;
    const limit = parseInt(yearRange, 10);
    return rawChartData.slice(-limit);
  }, [rawChartData, yearRange]);

  // Calculate high-level metrics for badges
  const latestData = chartData[chartData.length - 1] || { salary: 0, trainingDays: 0, trainingCourses: 0 };
  const latestSalary = latestData.salary;
  const latestDays = latestData.trainingDays;
  const totalTrainingDays = chartData.reduce((acc, curr) => acc + curr.trainingDays, 0);
  const totalCourses = chartData.reduce((acc, curr) => acc + curr.trainingCourses, 0);

  // Goal tracking status
  const isGoalAchieved = latestDays >= targetTrainingDays;

  // Export functions
  const handleExportPNG = async () => {
    if (!chartCardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartCardRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true,
      });
      const imageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = `mootu-levelup-analytics-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();

      Swal.fire({
        icon: 'success',
        title: 'ดาวน์โหลดรูปภาพสำเร็จ',
        text: 'บันทึกไฟล์กราฟสรุป (.PNG) เรียบร้อยแล้ว',
        confirmButtonColor: '#0F172A',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสร้างไฟล์รูปภาพได้',
        confirmButtonColor: '#0F172A',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!chartCardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartCardRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      // Executive Header Title
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('รายงานสรุปแนวโน้มการเติบโตและพัฒนาทักษะรายปี (Executive Analytics)', 14, 18);

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(`หน่วยงาน: IT SSJ Satun 2569 | พัฒนาโดย mootu LevelUp! | วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, 14, 25);

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 28, pdfWidth - 14, 28);

      // Add Captured Chart Image
      const imgWidth = pdfWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 14, 32, imgWidth, imgHeight);

      // Add Data Table Summary below chart
      let startY = 32 + imgHeight + 10;
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('ตารางสรุปข้อมูลรายปี', 14, startY);

      startY += 6;
      pdf.setFontSize(9);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, startY, pdfWidth - 28, 8, 'F');
      pdf.setTextColor(51, 65, 85);
      pdf.text('ปี พ.ศ.', 18, startY + 5.5);
      pdf.text('อัตราเงินเดือน (บาท)', 60, startY + 5.5);
      pdf.text('จำนวนการอบรม (หลักสูตร)', 110, startY + 5.5);
      pdf.text('รวมระยะเวลา (วัน)', 160, startY + 5.5);

      startY += 8;
      chartData.forEach((row, idx) => {
        if (idx % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(14, startY, pdfWidth - 28, 7, 'F');
        }
        pdf.setTextColor(15, 23, 42);
        pdf.text(row.year, 18, startY + 5);
        pdf.text(`฿${row.salary.toLocaleString()}`, 60, startY + 5);
        pdf.text(`${row.trainingCourses} หลักสูตร`, 110, startY + 5);
        pdf.text(`${row.trainingDays} วัน`, 160, startY + 5);
        startY += 7;
      });

      pdf.save(`mootu-levelup-executive-report-${new Date().toISOString().slice(0, 10)}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'ดาวน์โหลดรายงาน PDF สำเร็จ',
        text: 'บันทึกเอกสารเสนอผู้บริหาร (.PDF) เรียบร้อยแล้ว',
        confirmButtonColor: '#0F172A',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสร้างไฟล์ PDF ได้',
        confirmButtonColor: '#0F172A',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      ref={chartCardRef}
      className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6 font-sans relative"
    >
      {/* Header, Export & Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 uppercase tracking-widest mb-2">
            <i className="fa-solid fa-chart-area text-amber-600"></i>
            Timeline & Executive Analytics
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            สรุปแนวโน้มการเติบโต <span className="font-light italic text-slate-500">และพัฒนาทักษะรายปี</span>
          </h3>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Range Filter */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200 text-xs font-medium">
            <span className="px-2 text.slate-400 font-bold hidden sm:inline">
              <i className="fa-solid fa-filter text-slate-400 mr-1"></i> ช่วงปี:
            </span>
            <button
              onClick={() => setYearRange('3')}
              className={`px-2.5 py-1 rounded-xl transition-all font-bold ${
                yearRange === '3' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3 ปี
            </button>
            <button
              onClick={() => setYearRange('5')}
              className={`px-2.5 py-1 rounded-xl transition-all font-bold ${
                yearRange === '5' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              5 ปี
            </button>
            <button
              onClick={() => setYearRange('10')}
              className={`px-2.5 py-1 rounded-xl transition-all font-bold ${
                yearRange === '10' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              10 ปี
            </button>
            <button
              onClick={() => setYearRange('all')}
              className={`px-2.5 py-1 rounded-xl transition-all font-bold ${
                yearRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ทั้งหมด
            </button>
          </div>

          {/* Chart View Mode Tabs */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveChartTab('combined')}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeChartTab === 'combined' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รวม
            </button>
            <button
              onClick={() => setActiveChartTab('salary')}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeChartTab === 'salary' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เงินเดือน
            </button>
            <button
              onClick={() => setActiveChartTab('training')}
              className={`px-3 py-1 rounded-xl transition-all ${
                activeChartTab === 'training' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              อบรม
            </button>
          </div>

          {/* Download Buttons (PNG / PDF) */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              title="ดาวน์โหลดรูปภาพกราฟ (.PNG)"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className="fa-solid fa-image text-amber-600"></i>
              <span className="hidden sm:inline">PNG</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              title="ดาวน์โหลดรายงานเสนอผู้บริหาร (.PDF)"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className="fa-solid fa-file-pdf text-red-400"></i>
              <span>PDF รายงาน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Goal Tracking & Target Setting Header Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <i className="fa-solid fa-bullseye text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm tracking-wide text-white">
                Goal Tracking: เป้าหมายวันอบรม/ดูงานสะสม
              </h4>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                พ.ร.บ. ข้าราชการ/พนักงานราชการ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              กำหนดเป้าหมายการพัฒนาตนเองอย่างน้อย{' '}
              <span className="font-bold text-amber-400">{targetTrainingDays} วัน/ปี</span> (ปีล่าสุด: {latestDays} วัน)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Target Status Indicator */}
          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              isGoalAchieved
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}
          >
            <i className={`fa-solid ${isGoalAchieved ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-amber-400'}`}></i>
            <span>{isGoalAchieved ? 'ผ่านเกณฑ์เป้าหมาย (100%+)' : 'ต่ำกว่าเป้าหมาย'}</span>
          </div>

          {/* Toggle Target Line Checkbox */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 transition">
            <input
              type="checkbox"
              checked={showTargetLine}
              onChange={(e) => setShowTargetLine(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
            />
            <span>แสดงเส้น Target Line</span>
          </label>
        </div>
      </div>

      {/* Quick Trend Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">เงินเดือนปัจจุบัน (ล่าสุด)</p>
            <p className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
              ฿{latestSalary.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
            <i className="fa-solid fa-coins text-lg"></i>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">สะสมหลักสูตรอบรม</p>
            <p className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
              {totalCourses} <span className="text-xs font-sans text-slate-500">หลักสูตร</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-700 flex items-center justify-center">
            <i className="fa-solid fa-graduation-cap text-lg"></i>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">สะสมวันอบรมทั้งหมด</p>
            <p className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
              {totalTrainingDays} <span className="text-xs font-sans text-slate-500">วัน</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center">
            <i className="fa-solid fa-calendar-check text-lg"></i>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-84 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartTab === 'salary' ? (
            <AreaChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="year" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-800">
                        <p className="font-bold text-amber-400">{label}</p>
                        <p className="font-serif text-sm">
                          เงินเดือน: <span className="font-bold">฿{Number(data.salary).toLocaleString()}</span>
                        </p>
                        {data.movementNote && (
                          <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                            หมายเหตุ: {data.movementNote}
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
                name="อัตราเงินเดือน (บาท)"
                stroke="#B48A1E"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salaryGradient)"
              />
            </AreaChart>
          ) : activeChartTab === 'training' ? (
            <BarChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="year" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-800">
                        <p className="font-bold text-indigo-400">{label}</p>
                        <p>จำนวนหลักสูตร: <span className="font-bold text-white">{data.trainingCourses} หลักสูตร</span></p>
                        <p>ระยะเวลารวม: <span className="font-bold text-emerald-400">{data.trainingDays} วัน</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="trainingCourses" name="จำนวนหลักสูตร (ครั้ง)" fill="#6366F1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="trainingDays" name="รวมระยะเวลา (วัน)" fill="#10B981" radius={[8, 8, 0, 0]} />

              {/* Goal Target Line */}
              {showTargetLine && (
                <ReferenceLine
                  y={targetTrainingDays}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                >
                  <Label
                    value={`🎯 เป้าหมาย: ${targetTrainingDays} วัน`}
                    position="top"
                    fill="#EF4444"
                    fontSize={11}
                    fontWeight="bold"
                  />
                </ReferenceLine>
              )}
            </BarChart>
          ) : (
            <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salaryGradientCombined" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="year" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#B48A1E"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `฿${(val / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6366F1"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                        <p className="font-bold text-amber-400 text-sm">{label}</p>
                        <div className="space-y-0.5 pt-1 border-t border-slate-800">
                          <p className="text-amber-200">
                            อัตราเงินเดือน: <span className="font-bold">฿{Number(data.salary).toLocaleString()}</span>
                          </p>
                          <p className="text-indigo-300">
                            จำนวนหลักสูตรอบรม: <span className="font-bold">{data.trainingCourses} หลักสูตร</span>
                          </p>
                          <p className="text-emerald-300">
                            ระยะเวลารวม: <span className="font-bold">{data.trainingDays} วัน</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar yAxisId="right" dataKey="trainingCourses" name="อบรม (หลักสูตร)" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={24} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="salary"
                name="อัตราเงินเดือน (บาท)"
                stroke="#D4AF37"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salaryGradientCombined)"
              />

              {/* Target Line for Goal Tracking on Right Y-Axis */}
              {showTargetLine && (
                <ReferenceLine
                  yAxisId="right"
                  y={targetTrainingDays}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                >
                  <Label
                    value={`🎯 เป้าหมาย: ${targetTrainingDays} วัน`}
                    position="top"
                    fill="#D97706"
                    fontSize={11}
                    fontWeight="bold"
                  />
                </ReferenceLine>
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

