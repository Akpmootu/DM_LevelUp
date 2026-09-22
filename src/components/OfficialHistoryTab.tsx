import React, { useState, useEffect, useRef } from 'react';
import { OfficialHistory } from '../types';
import { appendRow, updateRow, clearRow } from '../lib/googleSheets';
import { getOrCreateFolder, getOrCreateYearFolder, uploadFile } from '../lib/googleDrive';
import Swal from 'sweetalert2';
import axios from 'axios';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { FilePreviewModal } from './FilePreviewModal';
import { CameraScanModal } from './CameraScanModal';
import { validateSelectedFile } from '../lib/fileValidator';
import { addToOfflineQueue, fileToBase64 } from '../lib/offlineSync';

interface OfficialHistoryTabProps {
  logs: OfficialHistory[];
  loading: boolean;
  onSaveSuccess?: () => void;
}

export function OfficialHistoryTab({ logs, loading, onSaveSuccess }: OfficialHistoryTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<OfficialHistory | null>(null);
  const [selectedItem, setSelectedItem] = useState<OfficialHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOpenForm = (e: any) => {
      if (e.detail?.type === 'official') {
        setEditingItem(null);
        setIsAdding(true);
      }
    };
    window.addEventListener('open-add-form', handleOpenForm);
    return () => window.removeEventListener('open-add-form', handleOpenForm);
  }, []);

  const handleStartAdd = () => {
    setEditingItem(null);
    setIsAdding(true);
  };

  const handleStartEdit = (item: OfficialHistory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedItem(null);
    setEditingItem(item);
    setIsAdding(true);
  };

  const handleDelete = async (item: OfficialHistory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      text: `คุณต้องการลบรายการ "${item.movement || 'ประวัติรับราชการ'}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const spreadsheetId = localStorage.getItem('spreadsheetId');
        if (spreadsheetId && item.rowIdx) {
          await clearRow(spreadsheetId, 'Official History', item.rowIdx);
        }
        Swal.fire({
          icon: 'success',
          title: 'ลบข้อมูลสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setSelectedItem(null);
        onSaveSuccess?.();
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาดในการลบข้อมูล',
        });
      }
    }
  };

  if (isAdding) {
    return (
      <OfficialHistoryForm
        initialData={editingItem}
        onBack={() => {
          setIsAdding(false);
          setEditingItem(null);
        }}
        logs={logs}
        onSaveSuccess={onSaveSuccess}
      />
    );
  }

  const filteredLogs = logs.filter(
    (log) =>
      (log.movement || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.positionAndDept || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-file-invoice text-indigo-600"></i>
            ประวัติรับราชการ
          </h2>
          <p className="text-sm text-slate-500 mt-1">ข้อมูลการเลื่อนขั้น เงินเดือน และตำแหน่งงานในระบบ</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="ค้นหาความเคลื่อนไหว / ตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleStartAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 whitespace-nowrap rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> เพิ่มประวัติใหม่
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">วัน เดือน ปี</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">ความเคลื่อนไหว</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">ตำแหน่ง/ส่วนราชการ</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs text-right">เงินเดือน</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">เอกสารอ้างอิง</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id || log.rowIdx} onClick={() => setSelectedItem(log)} className="hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{log.date}</td>
                  <td className="px-6 py-4 text-indigo-600 font-semibold">{log.movement}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900 font-medium">{log.positionAndDept}</p>
                    {log.positionNumber && <p className="text-slate-400 text-xs mt-0.5">เลขที่ {log.positionNumber}</p>}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">฿{log.salary?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                    {log.referenceDoc ? (
                      log.referenceDoc.startsWith('http') ? (
                        <a
                          href={log.referenceDoc}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <i className="fa-solid fa-link"></i> เปิดแนบ
                        </a>
                      ) : (
                        log.referenceDoc
                      )
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => handleStartEdit(log, e)}
                        title="แก้ไขข้อมูล"
                        className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 flex items-center justify-center transition"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button
                        onClick={(e) => handleDelete(log, e)}
                        title="ลบรายการ"
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 flex items-center justify-center transition"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    ไม่พบข้อมูลประวัติราชการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden space-y-6"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-medal"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedItem.movement}</h3>
                <p className="text-indigo-600 font-medium text-xs mt-0.5">วันที่มีผล: {selectedItem.date}</p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">ตำแหน่ง / หน่วยงาน</p>
                <p className="text-slate-900 font-medium">{selectedItem.positionAndDept}</p>
                {selectedItem.positionNumber && <p className="text-slate-500 text-xs mt-1">เลขที่ตำแหน่ง: {selectedItem.positionNumber}</p>}
              </div>
              <div className="pt-3 border-t border-slate-200/60">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">อัตราเงินเดือน</p>
                <p className="text-indigo-700 text-2xl font-serif font-bold">฿{selectedItem.salary?.toLocaleString()}</p>
              </div>
              {selectedItem.referenceDoc && (
                <div className="pt-3 border-t border-slate-200/60">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">เอกสารอ้างอิง</p>
                  {selectedItem.referenceDoc.startsWith('http') ? (
                    <a
                      href={selectedItem.referenceDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline text-xs flex items-center gap-1.5 font-bold"
                    >
                      <i className="fa-solid fa-file-pdf"></i> เปิดดูไฟล์แนบเอกสาร
                    </a>
                  ) : (
                    <p className="text-slate-700 text-xs">{selectedItem.referenceDoc}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleStartEdit(selectedItem)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <i className="fa-solid fa-pen-to-square"></i> แก้ไข
              </button>
              <button
                onClick={() => handleDelete(selectedItem)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <i className="fa-solid fa-trash-can"></i> ลบรายการ
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function OfficialHistoryForm({
  initialData,
  onBack,
  logs,
  onSaveSuccess,
}: {
  initialData?: OfficialHistory | null;
  onBack: () => void;
  logs: OfficialHistory[];
  onSaveSuccess?: () => void;
}) {
  const [formData, setFormData] = useState<Partial<OfficialHistory>>({});
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || '',
        movement: initialData.movement || '',
        positionAndDept: initialData.positionAndDept || '',
        salary: initialData.salary || 0,
        positionNumber: initialData.positionNumber || '',
        type: initialData.type || '',
        level: initialData.level || '',
        referenceDoc: initialData.referenceDoc || '',
      });
    }
  }, [initialData]);

  const uniqueMovements = Array.from(new Set(logs.map((l) => l.movement).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(logs.map((l) => l.type).filter(Boolean)));
  const uniqueLevels = Array.from(new Set(logs.map((l) => l.level).filter(Boolean)));

  const formatDateToThai = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${parseInt(year, 10) + 543}`;
  };

  const extractYear = (dateStr?: string) => {
    if (!dateStr) return `${new Date().getFullYear() + 543}`;
    const match = dateStr.match(/\b(25\d{2}|20\d{2})\b/);
    if (match) {
      let yr = parseInt(match[1], 10);
      if (yr < 2400) yr += 543;
      return `${yr}`;
    }
    return `${new Date().getFullYear() + 543}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formattedDate = formData.date?.includes('-') ? formatDateToThai(formData.date) : formData.date;
      const payload = {
        ...formData,
        date: formattedDate || '',
        salary: Number(formData.salary) || 0,
        referenceDoc: formData.referenceDoc || '',
        timestamp: Date.now(),
      };

      const valuesArray = [
        payload.date,
        payload.movement || '',
        payload.positionAndDept || '',
        payload.salary,
        payload.referenceDoc || '',
        new Date().toISOString(),
      ];

      // Check if user is offline or online
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
          type: 'official',
          sheetName: 'Official History',
          title: payload.movement || 'ประวัติรับราชการ',
          values: valuesArray,
          fileData: fileDataObj,
        });

        Swal.fire({
          icon: 'info',
          title: 'บันทึกแบบออฟไลน์สำเร็จ! 📦',
          html: `<p class="text-sm text-slate-600">ขณะนี้ไม่มีสัญญาณอินเทอร์เน็ต ข้อมูลและไฟล์แนบถูกจัดเก็บในเครื่องอย่างปลอดภัย และจะทยอยซิงค์ขึ้น Google Drive/Sheets ให้อัตโนมัติเมื่อออนไลน์</p>`,
          confirmButtonColor: '#0f172a',
        });

        onBack();
        return;
      }

      let fileLink = formData.referenceDoc || '';
      if (selectedFile) {
        const year = extractYear(formData.date);
        const yearFolderId = await getOrCreateYearFolder(year);
        const ext = selectedFile.name.split('.').pop() || 'pdf';
        const cleanName = (formData.movement || 'คำสั่งรับราชการ').replace(/[/\\?%*:|"<>]/g, '-').trim();
        const customFileName = `${year}_${cleanName}.${ext}`;
        const uploaded = await uploadFile(selectedFile, yearFolderId, customFileName);
        fileLink = uploaded.webViewLink || fileLink;
      }

      valuesArray[4] = fileLink;

      const spreadsheetId = localStorage.getItem('spreadsheetId');
      if (!spreadsheetId) throw new Error('No spreadsheet found');

      if (initialData?.rowIdx) {
        // Edit mode -> Update existing row
        await updateRow(spreadsheetId, 'Official History', initialData.rowIdx, valuesArray);
        Swal.fire({ icon: 'success', title: 'แก้ไขข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        // Create mode -> Append row
        await appendRow(spreadsheetId, 'Official History', valuesArray);
        Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
      }

      // Telegram notification
      axios
        .post('/api/notify', {
          message: `📢 ${initialData ? 'แก้ไข' : 'บันทึกใหม่'} ประวัติรับราชการ\nวันที่มีผล: ${payload.date}\nความเคลื่อนไหว: ${payload.movement}\nตำแหน่ง/ส่วนราชการ: ${payload.positionAndDept}\nเงินเดือน: ${payload.salary.toLocaleString()} บาท`,
        })
        .catch(console.warn);

      onSaveSuccess?.();
      onBack();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <i className={`fa-solid ${initialData ? 'fa-pen-to-square text-amber-500' : 'fa-plus text-indigo-600'}`}></i>
            {initialData ? 'แก้ไขประวัติรับราชการ' : 'เพิ่มประวัติรับราชการ'}
          </h2>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">วัน เดือน ปี (มีผล)</label>
              <input
                type="text"
                placeholder="เช่น 1/10/2568 หรือ วว/ดด/ปปปป"
                value={formData.date || ''}
                required
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">อัตราเงินเดือน (บาท)</label>
              <input
                type="number"
                step="0.01"
                placeholder="ยอดเงินเดือน"
                value={formData.salary || ''}
                required
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-indigo-700 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ความเคลื่อนไหว / คำสั่ง</label>
            <input
              type="text"
              list="movement-list"
              placeholder="เช่น เลื่อนขั้นเงินเดือนข้าราชการรอบเมษายน"
              value={formData.movement || ''}
              required
              onChange={(e) => setFormData({ ...formData, movement: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <datalist id="movement-list">
              {uniqueMovements.map((v, i) => (
                <option key={i} value={v} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ตำแหน่ง / ส่วนราชการ</label>
            <textarea
              rows={2}
              placeholder="เช่น นักวิชาการคอมพิวเตอร์ ชำนาญการ กลุ่มงานบริหารทั่วไป สำนักงานสาธารณสุขจังหวัดสตูล"
              value={formData.positionAndDept || ''}
              required
              onChange={(e) => setFormData({ ...formData, positionAndDept: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">เอกสารอ้างอิง (เลขที่คำสั่ง / ลิงก์แนบ)</label>
            <input
              type="text"
              placeholder="เช่น คำสั่ง สสจ.สตูล ที่ 123/2568 หรือ URL เอกสาร"
              value={formData.referenceDoc || ''}
              onChange={(e) => setFormData({ ...formData, referenceDoc: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-paperclip text-indigo-500"></i> แนบไฟล์หลักฐานประกอบ (PDF หรือรูปภาพ)
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
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-bold text-indigo-700 truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</span>
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
            targetName={formData.movement}
            year={extractYear(formData.date)}
            onClose={() => setPreviewOpen(false)}
          />

          <CameraScanModal
            isOpen={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onCapture={(file) => handleFileChange(file)}
            documentTitle={formData.movement || 'คำสั่งรับราชการ'}
          />

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center min-w-[140px]"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...
                </>
              ) : (
                'บันทึกข้อมูล'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
