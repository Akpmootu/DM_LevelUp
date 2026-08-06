import React, { useState, useEffect, useRef } from 'react';
import { WorkExperience } from '../types';
import { appendRow, updateRow, clearRow } from '../lib/googleSheets';
import { getOrCreateFolder, getOrCreateYearFolder, uploadFile } from '../lib/googleDrive';
import Swal from 'sweetalert2';
import axios from 'axios';
import { motion } from 'motion/react';
import { FilePreviewModal } from './FilePreviewModal';
import { CameraScanModal } from './CameraScanModal';
import { validateSelectedFile } from '../lib/fileValidator';

interface WorkExperienceTabProps {
  logs: WorkExperience[];
  loading: boolean;
  onSaveSuccess?: () => void;
}

export function WorkExperienceTab({ logs, loading, onSaveSuccess }: WorkExperienceTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkExperience | null>(null);
  const [selectedItem, setSelectedItem] = useState<WorkExperience | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOpenForm = (e: any) => {
      if (e.detail?.type === 'experience') {
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

  const handleStartEdit = (item: WorkExperience, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedItem(null);
    setEditingItem(item);
    setIsAdding(true);
  };

  const handleDelete = async (item: WorkExperience, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = await Swal.fire({
      title: 'ยืนยันการลบข้อมูล?',
      text: `คุณต้องการลบประสบการณ์ "${item.role || 'ประสบการณ์ทำงาน'}" ใช่หรือไม่?`,
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
          await clearRow(spreadsheetId, 'Work Experience', item.rowIdx);
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
      <ExperienceForm
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
      (log.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.duration || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-briefcase text-amber-600"></i>
            ประสบการณ์การปฏิบัติงาน
          </h2>
          <p className="text-sm text-slate-500 mt-1">คณะกรรมการ / คณะทำงาน / หน้าที่พิเศษ และผลงานสำคัญ</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="ค้นหาหน้าที่ / หน่วยงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleStartAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 whitespace-nowrap rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> บันทึกข้อมูล
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs w-16">ลำดับ</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">หน้าที่ / บทบาท</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">หน่วยงาน / สังกัด</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">ระยะเวลา</th>
                <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, i) => (
                <tr key={log.id || log.rowIdx} onClick={() => setSelectedItem(log)} className="hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{log.role}</td>
                  <td className="px-6 py-4 text-slate-600">{log.department}</td>
                  <td className="px-6 py-4 font-medium text-amber-600">{log.duration}</td>
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    ไม่พบข้อมูลประสบการณ์ทำงาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden space-y-6"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-briefcase"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">{selectedItem.role}</h3>
                <p className="text-amber-600 font-medium text-xs mt-1">ระยะเวลา: {selectedItem.duration}</p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">สังกัด / หน่วยงาน</p>
                <p className="text-slate-900 font-medium">{selectedItem.department}</p>
              </div>
              {selectedItem.documentRef && (
                <div className="pt-3 border-t border-slate-200/60">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">เอกสารอ้างอิง</p>
                  {selectedItem.documentRef.startsWith('http') ? (
                    <a
                      href={selectedItem.documentRef}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 hover:underline text-xs flex items-center gap-1.5 font-bold"
                    >
                      <i className="fa-solid fa-file-pdf"></i> เปิดดูไฟล์แนบเอกสาร
                    </a>
                  ) : (
                    <p className="text-slate-700 text-xs">{selectedItem.documentRef}</p>
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

function ExperienceForm({
  initialData,
  onBack,
  logs,
  onSaveSuccess,
}: {
  initialData?: WorkExperience | null;
  onBack: () => void;
  logs: WorkExperience[];
  onSaveSuccess?: () => void;
}) {
  const [formData, setFormData] = useState<Partial<WorkExperience>>({});
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
        duration: initialData.duration || '',
        role: initialData.role || '',
        department: initialData.department || '',
        documentRef: initialData.documentRef || '',
      });
    }
  }, [initialData]);

  const uniqueRoles = Array.from(new Set(logs.map((l) => l.role).filter(Boolean)));
  const uniqueDepts = Array.from(new Set(logs.map((l) => l.department).filter(Boolean)));

  const extractYear = (str?: string) => {
    if (!str) return `${new Date().getFullYear() + 543}`;
    const match = str.match(/\b(25\d{2}|20\d{2})\b/);
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
      let fileLink = formData.documentRef || '';
      if (selectedFile) {
        const year = extractYear(formData.duration);
        const yearFolderId = await getOrCreateYearFolder(year);
        const ext = selectedFile.name.split('.').pop() || 'pdf';
        const cleanName = (formData.role || 'เอกสารประสบการณ์ทำงาน').replace(/[/\\?%*:|"<>]/g, '-').trim();
        const customFileName = `${year}_${cleanName}.${ext}`;
        const uploaded = await uploadFile(selectedFile, yearFolderId, customFileName);
        fileLink = uploaded.webViewLink || fileLink;
      }

      const payload = {
        ...formData,
        duration: formData.duration || '',
        role: formData.role || '',
        department: formData.department || '',
        documentRef: fileLink,
        timestamp: Date.now(),
      };

      const spreadsheetId = localStorage.getItem('spreadsheetId');
      if (!spreadsheetId) throw new Error('No spreadsheet found');

      const valuesArray = [
        payload.duration,
        payload.role,
        payload.department,
        payload.documentRef,
        new Date().toISOString(),
      ];

      if (initialData?.rowIdx) {
        // Edit mode
        await updateRow(spreadsheetId, 'Work Experience', initialData.rowIdx, valuesArray);
        Swal.fire({ icon: 'success', title: 'แก้ไขข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
      } else {
        // Create mode
        await appendRow(spreadsheetId, 'Work Experience', valuesArray);
        Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
      }

      axios
        .post('/api/notify', {
          message: `📢 ${initialData ? 'แก้ไข' : 'บันทึกใหม่'} ประวัติประสบการณ์ทำงาน\nหน้าที่: ${payload.role}\nหน่วยงาน: ${payload.department}\nระยะเวลา: ${payload.duration}`,
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
            <i className={`fa-solid ${initialData ? 'fa-pen-to-square text-amber-500' : 'fa-plus text-amber-600'}`}></i>
            {initialData ? 'แก้ไขประสบการณ์การทำงาน' : 'เพิ่มประสบการณ์การทำงาน'}
          </h2>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ระยะเวลาการปฏิบัติงาน</label>
            <input
              type="text"
              placeholder="เช่น พ.ศ. 2565 - ปัจจุบัน หรือ ตั้งแต่ 1 ต.ค. 2566 ถึง 30 ก.ย. 2567"
              value={formData.duration || ''}
              required
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">หน้าที่ / บทบาท / คณะทำงาน</label>
            <input
              type="text"
              list="role-list"
              placeholder="เช่น คณะทำงานพัฒนาระบบสารสนเทศสุขภาพ"
              value={formData.role || ''}
              required
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <datalist id="role-list">
              {uniqueRoles.map((v, i) => (
                <option key={i} value={v} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">หน่วยงาน / สังกัด</label>
            <input
              type="text"
              list="dept-list"
              placeholder="เช่น สำนักงานสาธารณสุขจังหวัดสตูล"
              value={formData.department || ''}
              required
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <datalist id="dept-list">
              {uniqueDepts.map((v, i) => (
                <option key={i} value={v} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-paperclip text-amber-500"></i> แนบไฟล์หลักฐานประกอบ (PDF หรือรูปภาพ)
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
            targetName={formData.role}
            year={extractYear(formData.duration)}
            onClose={() => setPreviewOpen(false)}
          />

          <CameraScanModal
            isOpen={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onCapture={(file) => handleFileChange(file)}
            documentTitle={formData.role || 'เอกสารประสบการณ์ทำงาน'}
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
              className="px-8 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center justify-center min-w-[140px]"
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
