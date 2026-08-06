import React, { useState } from 'react';
import { motion } from 'motion/react';
import { OfficialHistory, TrainingHistory, WorkExperience, LeaveLog } from '../types';

interface SmartSearchTabProps {
  officialLogs: OfficialHistory[];
  trainingLogs: TrainingHistory[];
  experienceLogs: WorkExperience[];
  leaveLogs: LeaveLog[];
  loading: boolean;
}

interface UnifiedItem {
  id: string;
  sourceType: 'official' | 'training' | 'experience' | 'leave';
  sourceLabel: string;
  title: string;
  subtitle: string;
  dateStr: string;
  yearBE: string;
  refDoc?: string;
  tags: string[];
  raw: any;
}

const POPULAR_TAGS = [
  '#คำสั่งแต่งตั้ง',
  '#เลื่อนเงินเดือน',
  '#วิทยากร',
  '#อบรมออนไลน์',
  '#สแกนด้วยกล้อง',
  '#คำสั่งย้าย',
  '#เกียรติบัตร',
  '#ใบลา',
  '#ลาป่วย',
  '#ลาพักผ่อน',
  '#มีไฟล์แนบ',
];

export function SmartSearchTab({
  officialLogs,
  trainingLogs,
  experienceLogs,
  leaveLogs,
  loading,
}: SmartSearchTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');

  // Convert all logs to Unified Items
  const items: UnifiedItem[] = [];

  // 1. Official
  officialLogs.forEach((o, i) => {
    const yearBE = o.date ? (o.date.includes('-') ? (parseInt(o.date.split('-')[0]) + (parseInt(o.date.split('-')[0]) < 2400 ? 543 : 0)).toString() : '2568') : '2568';
    const tags: string[] = ['#คำสั่งย้าย'];
    if (o.movement?.includes('แต่งตั้ง') || o.movement?.includes('บรรจุ')) tags.push('#คำสั่งแต่งตั้ง');
    if (o.movement?.includes('เลื่อน') || o.salary) tags.push('#เลื่อนเงินเดือน');
    if (o.referenceDoc) tags.push('#มีไฟล์แนบ');

    items.push({
      id: o.id || `off_${i}`,
      sourceType: 'official',
      sourceLabel: 'ประวัติรับราชการ',
      title: o.movement || 'คำสั่งรับราชการ',
      subtitle: `${o.positionAndDept || '-'} (เงินเดือน ${o.salary ? o.salary.toLocaleString() : '-'} บาท)`,
      dateStr: o.date || '-',
      yearBE,
      refDoc: o.referenceDoc,
      tags,
      raw: o,
    });
  });

  // 2. Training
  trainingLogs.forEach((t, i) => {
    const tags: string[] = ['#เกียรติบัตร'];
    if (t.courseName?.includes('ออนไลน์')) tags.push('#อบรมออนไลน์');
    if (t.organizer?.includes('วิทยากร') || t.courseName?.includes('วิทยากร')) tags.push('#วิทยากร');
    if (t.referenceDoc) tags.push('#มีไฟล์แนบ');

    items.push({
      id: t.id || `trn_${i}`,
      sourceType: 'training',
      sourceLabel: 'ประวัติการฝึกอบรม',
      title: t.courseName || 'หลักสูตรอบรม',
      subtitle: `หน่วยงานจัด: ${t.organizer || '-'} (${t.durationDays || 1} วัน)`,
      dateStr: `${t.startDate || ''} ถึง ${t.endDate || ''}`,
      yearBE: t.year || '2568',
      refDoc: t.referenceDoc,
      tags,
      raw: t,
    });
  });

  // 3. Experience
  experienceLogs.forEach((e, i) => {
    const tags: string[] = ['#คณะทำงาน'];
    if (e.role?.includes('วิทยากร')) tags.push('#วิทยากร');
    if (e.documentRef) tags.push('#มีไฟล์แนบ');

    items.push({
      id: e.id || `exp_${i}`,
      sourceType: 'experience',
      sourceLabel: 'ประสบการณ์ทำงาน',
      title: e.role || 'ตำแหน่ง/บทบาท',
      subtitle: `หน่วยงาน/คณะทำงาน: ${e.department || '-'} (ระยะเวลา: ${e.duration || '-'})`,
      dateStr: e.duration || '-',
      yearBE: '2568',
      refDoc: e.documentRef,
      tags,
      raw: e,
    });
  });

  // 4. Leave
  leaveLogs.forEach((l, i) => {
    const tags: string[] = ['#ใบลา'];
    if (l.leaveType === 'ลาป่วย') tags.push('#ลาป่วย');
    if (l.leaveType === 'ลาพักผ่อน') tags.push('#ลาพักผ่อน');
    if (l.referenceDoc) tags.push('#มีไฟล์แนบ');

    items.push({
      id: l.id || `lea_${i}`,
      sourceType: 'leave',
      sourceLabel: 'ประวัติการลา',
      title: `ลา: ${l.leaveType}`,
      subtitle: `เหตุผล: ${l.reason || 'ไม่ระบุ'} (${l.totalDays} วัน)`,
      dateStr: `${l.startDate} ถึง ${l.endDate}`,
      yearBE: l.fiscalYear || '2568',
      refDoc: l.referenceDoc,
      tags,
      raw: l,
    });
  });

  // Filtering Logic
  const filteredItems = items.filter((item) => {
    // Source filter
    if (selectedSourceType !== 'all' && item.sourceType !== selectedSourceType) return false;

    // Year filter
    if (selectedYear !== 'all' && item.yearBE !== selectedYear) return false;

    // Tag filter
    if (selectedTag && !item.tags.includes(selectedTag)) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle.toLowerCase().includes(q);
      const matchSource = item.sourceLabel.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSubtitle && !matchSource && !matchTags) return false;
    }

    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2">
          <i className="fa-solid fa-magnifying-glass text-indigo-600"></i> Smart Search & Tagging Engine
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
          ระบบค้นหาและติดแท็ก <span className="text-indigo-600 font-light italic">เอกสารขั้นสูง</span> 🔍
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          ค้นหาคำสั่งย้าย เกียรติบัตร ผลงาน และใบลา ย้อนหลังด้วยคีย์เวิร์ด แท็ก หรือช่วงปี พ.ศ.
        </p>
      </div>

      {/* Search Bar & Primary Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Free Text Input */}
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              placeholder="พิมพ์คำค้นหา เช่น เลขที่คำสั่ง, ชื่อหลักสูตรอบรม, #คำสั่งแต่งตั้ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Module Selector */}
          <select
            value={selectedSourceType}
            onChange={(e) => setSelectedSourceType(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">ทุกหมวดหมู่ (ทั้งหมด)</option>
            <option value="official">ประวัติรับราชการ</option>
            <option value="training">ประวัติการฝึกอบรม</option>
            <option value="experience">ประสบการณ์ทำงาน</option>
            <option value="leave">ประวัติการลา</option>
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">ทุกปี พ.ศ.</option>
            {['2570', '2569', '2568', '2567', '2566', '2565'].map((y) => (
              <option key={y} value={y}>
                ปี พ.ศ. {y}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Chips Line */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <i className="fa-solid fa-tags text-indigo-500"></i> แท็กยอดนิยม:
          </span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-3 py-1 bg-rose-100 text-rose-700 font-bold text-[11px] rounded-full flex items-center gap-1 transition"
            >
              <span>ล้างแท็ก</span>
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
          {POPULAR_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                }`}
              >
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <span>
          พบผลลัพธ์ทั้งหมด <b className="text-indigo-600 font-extrabold">{filteredItems.length}</b> รายการ
        </span>
        {(searchQuery || selectedTag || selectedYear !== 'all' || selectedSourceType !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
              setSelectedYear('all');
              setSelectedSourceType('all');
            }}
            className="text-indigo-600 hover:underline font-semibold"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      {/* Results Grid / List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-500 mb-2"></i>
          <p className="text-sm">กำลังค้นหาและประมวลผลข้อมูลเอกสาร...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <i className="fa-solid fa-file-circle-xmark text-5xl text-slate-300 mb-3"></i>
          <p className="text-base font-bold text-slate-600">ไม่พบเอกสารตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่แท็กอื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-200/60">
                      {item.sourceLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      พ.ศ. {item.yearBE}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.subtitle}</p>
                </div>

                {item.refDoc ? (
                  <a
                    href={item.refDoc}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 text-sm shadow-md transition"
                    title="เปิดไฟล์หลักฐานใน Google Drive"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-300 flex items-center justify-center shrink-0 text-sm">
                    <i className="fa-solid fa-file-circle-minus"></i>
                  </div>
                )}
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      onClick={() => setSelectedTag(t)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-md font-semibold cursor-pointer transition"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">{item.dateStr}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
