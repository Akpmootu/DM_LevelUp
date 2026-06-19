import React, { useState, useEffect, useRef } from 'react';
import { WorkExperience } from '../types';
import { appendRow } from '../lib/googleSheets';
import { getOrCreateFolder, uploadFile } from '../lib/googleDrive';
import Swal from 'sweetalert2';
import axios from 'axios';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

export function WorkExperienceTab({ logs, loading, onSaveSuccess }: { logs: WorkExperience[], loading: boolean, onSaveSuccess?: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkExperience | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOpenForm = (e: any) => {
      if (e.detail?.type === 'experience') setIsAdding(true);
    };
    window.addEventListener('open-add-form', handleOpenForm);
    return () => window.removeEventListener('open-add-form', handleOpenForm);
  }, []);

  if (isAdding) {
    return <ExperienceForm onBack={() => setIsAdding(false)} logs={logs} onSaveSuccess={onSaveSuccess} />;
  }

  const filteredLogs = logs.filter(log => 
    (log.role || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (log.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.duration || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ประสบการณ์การปฏิบัติงาน</h2>
          <p className="text-sm text-slate-500 mt-1">คณะกรรมการ / คณะทำงาน / หน้าที่พิเศษ</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="ค้นหาหน้าที่/หน่วยงาน..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none w-full sm:w-64"
            />
          </div>
          <button onClick={() => setIsAdding(true)} className="bg-amber-600 text-white px-5 py-2 whitespace-nowrap rounded-lg text-sm font-bold shadow-md hover:bg-amber-700 transition">
            <i className="fa-solid fa-plus mr-2"></i> บันทึกข้อมูล
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs w-16">ลำดับ</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">หน้าที่</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">หน่วยงาน</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">ระยะเวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, i) => (
                <tr key={log.id} onClick={() => setSelectedItem(log)} className="hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-6 py-4 text-slate-400 font-mono">{i + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{log.role}</td>
                  <td className="px-6 py-4 text-slate-600">{log.department}</td>
                  <td className="px-6 py-4 text-right font-medium text-amber-600">{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Interactive Popup Modal for Work Experience */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 10 }} 
             animate={{ opacity: 1, scale: 1, y: 0 }} 
             className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
             <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform">
               <i className="fa-solid fa-times text-2xl"></i>
             </button>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-2xl shrink-0">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900 leading-tight">{selectedItem.role}</h3>
                   <p className="text-amber-600 font-medium text-sm mt-1">เวลา: {selectedItem.duration}</p>
                </div>
             </div>
             
             <div className="space-y-4 bg-slate-50 p-6 rounded-2xl">
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">สังกัด / หน่วยงาน</p>
                   <p className="text-slate-900 font-medium">{selectedItem.department}</p>
                </div>
                {selectedItem.documentRef && (
                   <div className="pt-4 border-t border-slate-200">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">เอกสารอ้างอิง</p>
                     {selectedItem.documentRef.startsWith('http') ? (
                       <a href={selectedItem.documentRef} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-800 underline inline-flex items-center gap-1">
                          <i className="fa-solid fa-link"></i> เปิดไฟล์แนบ
                       </a>
                     ) : (
                       <p className="text-slate-600">{selectedItem.documentRef}</p>
                     )}
                   </div>
                )}
             </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ExperienceForm({ onBack, logs, onSaveSuccess }: { onBack: () => void, logs: WorkExperience[], onSaveSuccess?: () => void }) {
  const [formData, setFormData] = useState<Partial<WorkExperience> & { startDate?: string, endDate?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete memory
  const uniqueRoles = Array.from(new Set(logs.map(l => l.role).filter(Boolean)));
  const uniqueDepts = Array.from(new Set(logs.map(l => l.department).filter(Boolean)));

  const formatDateToThai = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${parseInt(year, 10) + 543}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let fileLink = '';
      if (selectedFile) {
        const folderId = await getOrCreateFolder();
        const uploaded = await uploadFile(selectedFile, folderId);
        fileLink = uploaded.webViewLink || fileLink;
      }

      let durationLabel = '';
      if (formData.startDate) {
        const formattedStart = formatDateToThai(formData.startDate);
        const formattedEnd = formData.endDate ? formatDateToThai(formData.endDate) : 'ปัจจุบัน';
        durationLabel = `ตั้งแต่ ${formattedStart} ถึง ${formattedEnd}`;
      } else {
        durationLabel = formData.duration || '';
      }

      const payload = { ...formData, duration: durationLabel, documentRef: fileLink, timestamp: Date.now() };

      const spreadsheetId = localStorage.getItem('spreadsheetId');
      if (!spreadsheetId) throw new Error('No spreadsheet found');
      
      await appendRow(spreadsheetId, 'Work Experience', [
        payload.duration || '',
        payload.role || '',
        payload.department || '',
        payload.documentRef || '',
        new Date().toISOString()
      ]);

      axios.post('/api/notify', { message: `📢 เพิ่มประสบการณ์: ${payload.role}` }).catch(console.warn);
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ' });
      onSaveSuccess?.();
      onBack();
    } catch(err) {
       Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">เพิ่มประสบการณ์ทำงาน</h2>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-times text-xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">เริ่มตั้งแต่วันที่</label>
              <input type="date" required onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ถึงวันที่ (เว้นว่างได้ถ้าถึงปัจจุบัน)</label>
              <input type="date" onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">หน้าที่ / บทบาท</label>
            <input list="role-list" required onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
            <datalist id="role-list">
              {uniqueRoles.map((v, i) => <option key={i} value={v} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">หน่วยงาน</label>
            <input type="text" list="dept-list" required onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" />
            <datalist id="dept-list">
              {uniqueDepts.map((v, i) => <option key={i} value={v} />)}
            </datalist>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-paperclip"></i> แนบไฟล์หลักฐาน (PDF หรือรูปภาพ)
             </label>
             <div className="flex items-center gap-4">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i> เลือกไฟล์
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden" 
                  accept="image/*,.pdf"
                />
                {selectedFile && (
                  <div className="flex flex-col gap-4 mt-2 w-full">
                     <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                        <i className={clsx("fa-solid text-3xl", selectedFile.type.startsWith('image/') ? 'fa-image text-amber-500' : 'fa-file-pdf text-red-500')}></i>
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="font-bold text-slate-800 truncate">{selectedFile.name}</span>
                          <span className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button type="button" onClick={() => setSelectedFile(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0">
                           <i className="fa-solid fa-times text-lg"></i>
                        </button>
                     </div>
                     <div className="w-full h-[300px] md:h-[400px] border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm">
                        {selectedFile.type.startsWith('image/') ? (
                           <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-full h-full object-contain" />
                        ) : (
                           <iframe src={URL.createObjectURL(selectedFile)} title="PDF Preview" className="w-full h-full" />
                        )}
                     </div>
                  </div>
                )}
             </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={onBack} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">ยกเลิก</button>
             <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-md flex items-center justify-center min-w-[140px]">
               {submitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...</> : "บันทึกข้อมูล"}
             </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
