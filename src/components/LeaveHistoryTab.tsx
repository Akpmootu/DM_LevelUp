import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { LeaveLog } from '../types';
import { getOrCreateSpreadsheet, addSheet, appendRow, clearRow } from '../lib/googleSheets';
import { getOrCreateFolder, uploadFile } from '../lib/googleDrive';
import { FilePreviewModal } from './FilePreviewModal';
import { CameraScanModal } from './CameraScanModal';
import { validateSelectedFile } from '../lib/fileValidator';
import { addToOfflineQueue, fileToBase64 } from '../lib/offlineSync';

interface LeaveHistoryTabProps {
  logs: LeaveLog[];
  loading: boolean;
  onSaveSuccess: () => void;
}

// 13 Civil Servant Leave Categories from official regulations & user reference image
export const LEAVE_CATEGORIES = [
  { id: 'ลาป่วย', label: 'ลาป่วย', icon: 'fa-user-injured', color: 'text-blue-500', maxDays: 60, desc: 'ไม่เกิน 60 วันทำการ/ปีงบประมาณ' },
  { id: 'ลากิจ', label: 'ลากิจ', icon: 'fa-envelope', color: 'text-indigo-500', maxDays: 45, desc: 'ไม่เกิน 45 วันทำการ/ปีงบประมาณ' },
  { id: 'ลาพักผ่อน', label: 'ลาพักผ่อน', icon: 'fa-mug-hot', color: 'text-amber-600', maxDays: 10, desc: '10 วันทำการ/ปี (สะสมได้ตามระเบียบ)' },
  { id: 'ลาประกอบพิธีทางศาสนา', label: 'ลาประกอบพิธีทางศาสนา', icon: 'fa-bookmark', color: 'text-amber-500', maxDays: 120, desc: 'ลาอุปสมบท หรือพิธีฮัจย์ ไม่เกิน 120 วัน' },
  { id: 'ลาช่วยภริยาคลอด', label: 'ลาช่วยภริยาคลอด', icon: 'fa-baby-carriage', color: 'text-emerald-500', maxDays: 15, desc: 'ไม่เกิน 15 วันทำการ' },
  { id: 'ลาเกณฑ์ทหาร', label: 'ลาเกณฑ์ทหาร', icon: 'fa-people-group', color: 'text-sky-600', maxDays: 60, desc: 'ตามหมายเรียกพล/เข้ารับการตรวจเลือก' },
  { id: 'ลาศึกษา ฝึกอบรม', label: 'ลาศึกษา ฝึกอบรม', icon: 'fa-graduation-cap', color: 'text-purple-600', maxDays: 365, desc: 'ตามอนุมัติของผู้มีอำนาจ' },
  { id: 'ลาทำงานต่างประเทศ', label: 'ลาทำงานต่างประเทศ', icon: 'fa-plane', color: 'text-teal-600', maxDays: 180, desc: 'ตามระเบียบข้าราชการพลเรือน' },
  { id: 'ลาติดตามคู่สมรส', label: 'ลาติดตามคู่สมรส', icon: 'fa-venus-mars', color: 'text-rose-500', maxDays: 730, desc: 'ไม่เกิน 2 ปี (ไม่ได้รับเงินเดือน)' },
  { id: 'ลาฟื้นฟูอาชีพ', label: 'ลาฟื้นฟูอาชีพ', icon: 'fa-screwdriver-wrench', color: 'text-amber-600', maxDays: 120, desc: 'ฟื้นฟูสมรรถภาพทางกาย/อาชีพ' },
  { id: 'ลาออก', label: 'ลาออก', icon: 'fa-right-from-bracket', color: 'text-emerald-600', maxDays: 0, desc: 'ยื่นหนังสือขอลาออกจากราชการ' },
  { id: 'ลาป่วยตามกฎหมายฯ', label: 'ลาป่วยตามกฎหมายฯ', icon: 'fa-square-plus', color: 'text-orange-500', maxDays: 60, desc: 'ตามกฎหมายว่าด้วยการสงเคราะห์ผู้ประสบภัย' },
  { id: 'ลากิจเลี้ยงดูบุตร', label: 'ลากิจเลี้ยงดูบุตร', icon: 'fa-heart', color: 'text-rose-400', maxDays: 150, desc: 'ต่อเนื่องจากลาคลอดบุตร ไม่เกิน 150 วัน' },
];

export function LeaveHistoryTab({ logs, loading, onSaveSuccess }: LeaveHistoryTabProps) {
  const currentFiscalYearStr = (new Date().getFullYear() + 543).toString();
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(currentFiscalYearStr);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LeaveLog>>({
    fiscalYear: currentFiscalYearStr,
    leaveType: 'ลาป่วย',
    totalDays: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (validateSelectedFile(file)) {
        setSelectedFile(file);
      } else {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      setSelectedFile(null);
    }
  };

  // Filter logs by Fiscal Year and Category
  const filteredLogs = logs.filter((log) => {
    const matchYear = !selectedFiscalYear || log.fiscalYear === selectedFiscalYear;
    const matchCat = selectedCategoryFilter === 'all' || log.leaveType === selectedCategoryFilter;
    const matchSearch =
      !searchQuery ||
      log.leaveType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchYear && matchCat && matchSearch;
  });

  // Calculate summary metrics for current selected fiscal year
  const yearLogs = logs.filter((log) => log.fiscalYear === selectedFiscalYear);
  const totalLeaveCount = yearLogs.length;
  const totalDaysUsed = yearLogs.reduce((acc, curr) => acc + (Number(curr.totalDays) || 0), 0);

  // Particular leave totals
  const sickLeaveDays = yearLogs
    .filter((l) => l.leaveType === 'ลาป่วย')
    .reduce((a, b) => a + (Number(b.totalDays) || 0), 0);
  const personalLeaveDays = yearLogs
    .filter((l) => l.leaveType === 'ลากิจ')
    .reduce((a, b) => a + (Number(b.totalDays) || 0), 0);
  const vacationLeaveDays = yearLogs
    .filter((l) => l.leaveType === 'ลาพักผ่อน')
    .reduce((a, b) => a + (Number(b.totalDays) || 0), 0);

  const handleOpenAdd = (defaultType = 'ลาป่วย') => {
    setFormData({
      fiscalYear: selectedFiscalYear,
      leaveType: defaultType,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalDays: 1,
      reason: '',
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDateRangeChange = (startStr?: string, endStr?: string) => {
    if (startStr && endStr) {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData((prev) => ({ ...prev, startDate: startStr, endDate: endStr, totalDays: diffDays }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, startDate: startStr, endDate: endStr }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.startDate || !formData.endDate) {
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบถ้วน', text: 'โปรดระบุประเภทการลาและวันที่เริ่มต้น-สิ้นสุด' });
      return;
    }

    try {
      setSubmitting(true);
      const values = [
        formData.fiscalYear || selectedFiscalYear,
        formData.leaveType,
        formData.startDate,
        formData.endDate,
        formData.totalDays || 1,
        formData.reason || '',
        formData.referenceDoc || '',
      ];

      // Offline mode check
      if (!navigator.onLine) {
        let fileDataObj = undefined;
        if (selectedFile) {
          const b64 = await fileToBase64(selectedFile);
          fileDataObj = {
            name: selectedFile.name,
            type: selectedFile.type,
            base64: b64,
          };
        }

        addToOfflineQueue({
          type: 'leave',
          sheetName: 'Leave History',
          title: `ใบลา ${formData.leaveType} (${formData.startDate} - ${formData.endDate})`,
          values: values,
          fileData: fileDataObj,
        });

        Swal.fire({
          icon: 'info',
          title: 'บันทึกแบบออฟไลน์สำเร็จ! 📦',
          html: `<p class="text-sm text-slate-600">เนื่องจากไม่มีสัญญาณอินเทอร์เน็ต ข้อมูลการลาและไฟล์แนบถูกจัดเก็บในเครื่องอย่างปลอดภัย และจะซิงค์ให้อัตโนมัติเมื่อออนไลน์</p>`,
          confirmButtonColor: '#0f172a',
        });

        setIsModalOpen(false);
        return;
      }

      let fileUrl = formData.referenceDoc || '';
      if (selectedFile) {
        const folderId = await getOrCreateFolder();
        fileUrl = await uploadFile(selectedFile, folderId);
      }

      values[6] = fileUrl;

      const spreadsheetId = await getOrCreateSpreadsheet();
      await addSheet(spreadsheetId, 'Leave History');
      await appendRow(spreadsheetId, 'Leave History', values);

      // Send Telegram notification
      try {
        await axios.post('/api/notify', {
          message: `🏖️ <b>บันทึกการลาใหม่ประจำปีงบประมาณ ${formData.fiscalYear}</b>\n\n📌 <b>ประเภท:</b> ${formData.leaveType}\n📅 <b>ช่วงวันลา:</b> ${formData.startDate} ถึง ${formData.endDate} (${formData.totalDays} วัน)\n📝 <b>เหตุผล:</b> ${formData.reason || 'ไม่ระบุ'}\n📎 <b>เอกสารแนบ:</b> ${fileUrl ? 'มีไฟล์ประกอบ' : 'ไม่มี'}`,
          platform: 'telegram',
        });
      } catch (err) {
        console.warn('Telegram notification failed', err);
      }

      Swal.fire({
        icon: 'success',
        title: 'บันทึกประวัติการลาสำเร็จ! 🏖️',
        timer: 1500,
        showConfirmButton: false,
      });

      setIsModalOpen(false);
      onSaveSuccess();
    } catch (err) {
      console.error('Save failed:', err);
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (log: LeaveLog) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบประวัติการลานี้?',
      text: `ประเภท ${log.leaveType} (${log.startDate} ถึง ${log.endDate})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#e11d48',
    });

    if (result.isConfirmed && log.rowIdx !== undefined) {
      try {
        const spreadsheetId = await getOrCreateSpreadsheet();
        await clearRow(spreadsheetId, 'Leave History', log.rowIdx + 1);
        Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1200, showConfirmButton: false });
        onSaveSuccess();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ' });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">
            <i className="fa-solid fa-umbrella-beach text-amber-600"></i> Fiscal Year Leave Tracker
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            ระบบบันทึกประวัติการลา <span className="text-amber-600 font-light italic">ประจำปีงบประมาณ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            บันทึกวันลาป่วย ลากิจ ลาพักผ่อน และติดตามสถิติการลาจำแนกตามประเภท
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Fiscal Year Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">ปีงบประมาณ:</span>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
            >
              {['2570', '2569', '2568', '2567', '2566'].map((y) => (
                <option key={y} value={y}>
                  พ.ศ. {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-2"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            <span>บันทึกการลาใหม่</span>
          </button>
        </div>
      </div>

      {/* Fiscal Year Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">จำนวนครั้งที่ลาทั้งหมด</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{totalLeaveCount} <span className="text-xs font-semibold text-slate-500">ครั้ง</span></h3>
            <p className="text-[11px] text-slate-500 mt-0.5">ประจำปีงบประมาณ {selectedFiscalYear}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
            <i className="fa-solid fa-list-check"></i>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">จำนวนวันที่ลาป่วย</span>
            <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{sickLeaveDays} <span className="text-xs font-semibold text-slate-500">วัน</span></h3>
            <p className="text-[11px] text-slate-500 mt-0.5">จากโควตาไม่เกิน 60 วัน</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl">
            <i className="fa-solid fa-user-injured"></i>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">จำนวนวันที่ลากิจ</span>
            <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">{personalLeaveDays} <span className="text-xs font-semibold text-slate-500">วัน</span></h3>
            <p className="text-[11px] text-slate-500 mt-0.5">จากโควตาไม่เกิน 45 วัน</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl">
            <i className="fa-solid fa-envelope"></i>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">จำนวนวันที่ลาพักผ่อน</span>
            <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{vacationLeaveDays} <span className="text-xs font-semibold text-slate-500">วัน</span></h3>
            <p className="text-[11px] text-slate-500 mt-0.5">รวมใช้วันพักผ่อนแล้ว</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
            <i className="fa-solid fa-mug-hot"></i>
          </div>
        </div>
      </div>

      {/* 13 Civil Servant Leave Type Cards (User Image Replica) */}
      <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-grid-2 text-amber-600"></i> หมวดหมู่การลาข้าราชการ (13 ประเภท)
            </h3>
            <p className="text-xs text-slate-500">คลิกที่การ์ดหมวดหมู่เพื่อลงบันทึกการลาชนิดนั้นๆ ได้ทันที</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {LEAVE_CATEGORIES.map((cat) => {
            const catDays = yearLogs
              .filter((l) => l.leaveType === cat.id)
              .reduce((a, b) => a + (Number(b.totalDays) || 0), 0);
            const catCount = yearLogs.filter((l) => l.leaveType === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => handleOpenAdd(cat.id)}
                className="group relative bg-white hover:bg-slate-900 hover:text-white p-4 rounded-2xl border border-slate-200/90 hover:border-slate-800 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 min-h-[110px]"
              >
                <div className={`w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-800 flex items-center justify-center text-lg transition ${cat.color} group-hover:text-amber-400`}>
                  <i className={`fa-solid ${cat.icon}`}></i>
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-white line-clamp-1">
                  {cat.label}
                </span>

                {catCount > 0 ? (
                  <span className="text-[10px] font-bold text-amber-700 group-hover:text-amber-300 bg-amber-50 group-hover:bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    ลาแล้ว {catDays} วัน ({catCount} ครั้ง)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-400">
                    ยังไม่มีประวัติ
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Table Log Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-amber-600"></i> ประวัติการลาปีงบประมาณ {selectedFiscalYear}
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="ค้นหาประวัติการลา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-amber-500 mb-2"></i>
            <p>กำลังโหลดข้อมูลประวัติการลา...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <i className="fa-solid fa-umbrella-beach text-4xl text-slate-300 mb-2"></i>
            <p className="text-sm font-semibold text-slate-600">ไม่พบประวัติการลาในปีงบประมาณ {selectedFiscalYear}</p>
            <p className="text-xs text-slate-400 mt-1">กดปุ่ม "บันทึกการลาใหม่" เพื่อเพิ่มข้อมูลการลาเข้าระบบ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">ประเภทการลา</th>
                  <th className="py-3 px-4">วันที่เริ่มต้น - สิ้นสุด</th>
                  <th className="py-3 px-4 text-center">จำนวนวัน</th>
                  <th className="py-3 px-4">เหตุผล / รายละเอียด</th>
                  <th className="py-3 px-4 text-center">หลักฐานประกอบ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-amber-50/30 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>{log.leaveType}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {log.startDate} ถึง {log.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                      {log.totalDays} วัน
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {log.reason || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {log.referenceDoc ? (
                        <a
                          href={log.referenceDoc}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                        >
                          <i className="fa-solid fa-paperclip text-xs"></i> ดูไฟล์
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(log)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition"
                        title="ลบรายการ"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Leave Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg">
                    <i className="fa-solid fa-umbrella-beach"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">บันทึกประวัติการลาใหม่ 🏖️</h3>
                    <p className="text-xs text-slate-500">ปีงบประมาณ พ.ศ. {formData.fiscalYear}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fiscal Year */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      ปีงบประมาณ พ.ศ.
                    </label>
                    <input
                      type="text"
                      value={formData.fiscalYear || ''}
                      onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Leave Type */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      ประเภทการลา
                    </label>
                    <select
                      value={formData.leaveType || 'ลาป่วย'}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      {LEAVE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({c.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      วันที่เริ่มต้น
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => handleDateRangeChange(e.target.value, formData.endDate)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => handleDateRangeChange(formData.startDate, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      จำนวนวันลา
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalDays || 1}
                      onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    เหตุผล / สถานที่ติดต่อระหว่างลา
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น ลาป่วยเนื่องจากไข้หวัดใหญ่ หรือ ลาพักผ่อนไปต่างจังหวัด..."
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* File Attachment */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-paperclip text-amber-500"></i> แนบไฟล์ใบลา/ใบรับรองแพทย์ (PDF หรือรูปภาพ)
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      สูงสุด 10MB
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i> เลือกไฟล์ใหม่
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-2xs"
                    >
                      <i className="fa-solid fa-camera"></i> สแกนด้วยกล้อง
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                        <span className="text-xs font-bold text-amber-800 truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs"
                        >
                          <i className="fa-solid fa-eye text-xs"></i> ดูตัวอย่าง
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-slate-400 hover:text-red-500 transition px-1"
                          title="ยกเลิกไฟล์นี้"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <FilePreviewModal
                  isOpen={previewOpen}
                  file={selectedFile}
                  targetName={`ใบลา_${formData.leaveType}`}
                  year={formData.fiscalYear || ''}
                  onClose={() => setPreviewOpen(false)}
                />

                <CameraScanModal
                  isOpen={cameraOpen}
                  onClose={() => setCameraOpen(false)}
                  onCapture={(file) => handleFileChange(file)}
                  documentTitle={`ใบลา_${formData.leaveType}`}
                />

                {/* Submit Actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting && <i className="fa-solid fa-spinner fa-spin"></i>}
                    <span>บันทึกประวัติการลา</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
