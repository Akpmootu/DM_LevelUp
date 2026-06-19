import React, { useState, useEffect, useRef } from 'react';
import { OfficialHistory } from '../types';
import { appendRow } from '../lib/googleSheets';
import { getOrCreateFolder, uploadFile } from '../lib/googleDrive';
import Swal from 'sweetalert2';
import axios from 'axios';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface OfficialHistoryTabProps {
  logs: OfficialHistory[];
  loading: boolean;
  onSaveSuccess?: () => void;
}

export function OfficialHistoryTab({ logs, loading, onSaveSuccess }: OfficialHistoryTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OfficialHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOpenForm = (e: any) => {
      if (e.detail?.type === 'official') setIsAdding(true);
    };
    window.addEventListener('open-add-form', handleOpenForm);
    return () => window.removeEventListener('open-add-form', handleOpenForm);
  }, []);

  if (isAdding) {
    return <OfficialHistoryForm onBack={() => setIsAdding(false)} logs={logs} onSaveSuccess={onSaveSuccess} />;
  }

  const filteredLogs = logs.filter(log => 
    (log.movement || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (log.positionAndDept || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ประวัติรับราชการ</h2>
          <p className="text-sm text-slate-500 mt-1">ข้อมูลการเลื่อนขั้น เงินเดือน และตำแหน่ง</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="ค้นหา..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-5 py-2 whitespace-nowrap rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition"
          >
            <i className="fa-solid fa-plus mr-2"></i> บันทึกข้อมูล
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">วัน เดือน ปี</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">ความเคลื่อนไหว</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">ตำแหน่ง/ส่วนราชการ</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">เงินเดือน</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">อ้างอิง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} onClick={() => setSelectedItem(log)} className="hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{log.date}</td>
                  <td className="px-6 py-4 text-indigo-600 font-semibold">{log.movement}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900 font-medium">{log.type} ระดับ{log.level}</p>
                    <p className="text-slate-500 text-xs mt-1">{log.positionAndDept}</p>
                    {log.positionNumber && <p className="text-slate-400 text-xs mt-0.5">เลขที่ {log.positionNumber}</p>}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium">{log.salary.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{log.referenceDoc}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400">ยังไม่มีข้อมูลประวัติราชการ</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Interactive Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 10 }} 
             animate={{ opacity: 1, scale: 1, y: 0 }} 
             className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
          >
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
             <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform">
               <i className="fa-solid fa-times text-2xl"></i>
             </button>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl shrink-0">
                  <i className="fa-solid fa-medal"></i>
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900">{selectedItem.movement}</h3>
                   <p className="text-indigo-600 font-medium">วันที่มีผล: {selectedItem.date}</p>
                </div>
             </div>
             
             <div className="space-y-4 bg-slate-50 p-6 rounded-2xl">
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ตำแหน่ง</p>
                   <p className="text-slate-900 font-medium">{selectedItem.type} ระดับ{selectedItem.level} <br className="hidden" /> {selectedItem.positionAndDept}</p>
                   {selectedItem.positionNumber && <p className="text-slate-500 text-sm mt-1">เลขที่ตำแหน่ง: {selectedItem.positionNumber}</p>}
                </div>
                <div className="pt-4 border-t border-slate-200">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">เงินเดือน</p>
                   <p className="text-slate-900 text-xl font-bold font-mono text-indigo-700">{selectedItem.salary.toLocaleString()} <span className="text-sm font-medium text-slate-500">บาท</span></p>
                </div>
                {selectedItem.referenceDoc && (
                  <div className="pt-4 border-t border-slate-200">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">เอกสารอ้างอิง</p>
                     {selectedItem.referenceDoc.startsWith('http') ? (
                       <a href={selectedItem.referenceDoc} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1">
                          <i className="fa-solid fa-link"></i> เปิดไฟล์แนบ
                       </a>
                     ) : (
                       <p className="text-slate-600">{selectedItem.referenceDoc}</p>
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

function OfficialHistoryForm({ onBack, logs, onSaveSuccess }: { onBack: () => void, logs: OfficialHistory[], onSaveSuccess?: () => void }) {
  const [formData, setFormData] = useState<Partial<OfficialHistory>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique values for autocomplete memory
  const uniqueMovements = Array.from(new Set(logs.map(l => l.movement).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(logs.map(l => l.type).filter(Boolean)));
  const uniqueLevels = Array.from(new Set(logs.map(l => l.level).filter(Boolean)));

  const formatDateToThai = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${parseInt(year, 10) + 543}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      
      let fileLink = formData.referenceDoc || '';
      if (selectedFile) {
        const folderId = await getOrCreateFolder();
        const uploaded = await uploadFile(selectedFile, folderId);
        fileLink = uploaded.webViewLink || fileLink;
      }

      const formattedDate = formData.date?.includes('-') ? formatDateToThai(formData.date) : formData.date;

      const payload = {
        ...formData,
        date: formattedDate,
        salary: Number(formData.salary) || 0,
        referenceDoc: fileLink,
        timestamp: Date.now()
      };
      
      const spreadsheetId = localStorage.getItem('spreadsheetId');
      if (!spreadsheetId) throw new Error('No spreadsheet found');
      
      await appendRow(spreadsheetId, 'Official History', [
        payload.date || '',
        payload.movement || '',
        `${payload.type || ''} ระดับ${payload.level || ''} ${payload.positionAndDept || ''} ${payload.positionNumber || ''}`,
        payload.salary,
        payload.referenceDoc || '',
        new Date().toISOString()
      ]);
      
      // Notify
      await axios.post('/api/notify', {
        message: `📢 อัปเดตประวัติราชการ\nวันที่มีผล: ${payload.date}\nสถานะ: ${payload.movement}\nตำแหน่ง: ${payload.positionAndDept}\nเงินเดือน: ${payload.salary.toLocaleString()} บาท`
      }).catch(console.warn);

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
          <h2 className="text-2xl font-bold text-slate-900">เพิ่มประวัติรับราชการ</h2>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-times text-xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">วัน เดือน ปี</label>
              <input type="date" required onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">เงินเดือน (บาท)</label>
              <input type="number" step="0.01" placeholder="ยอดเงิน" required onChange={e => setFormData({...formData, salary: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-indigo-700 font-bold" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ความเคลื่อนไหว</label>
            <input type="text" list="movement-list" placeholder="เช่น การเลื่อนเงินเดือนข้าราชการ" required onChange={e => setFormData({...formData, movement: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            <datalist id="movement-list">
              {uniqueMovements.map((v, i) => <option key={i} value={v} />)}
            </datalist>
          </div>
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ตำแหน่ง/ส่วนราชการ</label>
             <textarea rows={2} placeholder="เช่น ตำแหน่งนักวิชาการคอมพิวเตอร์..." required onChange={e => setFormData({...formData, positionAndDept: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ตำแหน่งเลขที่</label>
              <input type="text" onChange={e => setFormData({...formData, positionNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ประเภท</label>
              <input type="text" list="type-list" placeholder="เช่น วิชาการ" onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              <datalist id="type-list">
                {uniqueTypes.map((v, i) => <option key={i} value={v} />)}
              </datalist>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ระดับ</label>
               <input type="text" list="level-list" placeholder="เช่น ปฏิบัติการ" onChange={e => setFormData({...formData, level: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
               <datalist id="level-list">
                {uniqueLevels.map((v, i) => <option key={i} value={v} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">เอกสารอ้างอิง (เลขที่ / ชื่อเอกสาร)</label>
            <input type="text" onChange={e => setFormData({...formData, referenceDoc: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
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
                        <i className={clsx("fa-solid text-3xl", selectedFile.type.startsWith('image/') ? 'fa-image text-indigo-500' : 'fa-file-pdf text-red-500')}></i>
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
             <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center min-w-[140px]">
               {submitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...</> : "บันทึกข้อมูล"}
             </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
