import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { getOrCreateFolder, uploadFile } from '../lib/googleDrive';
import { getSheetData, appendRow, updateRow } from '../lib/googleSheets';
import Swal from 'sweetalert2';
import axios from 'axios';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface ProfileTabProps {
  profileData: UserProfile | null;
  loading: boolean;
  onSaveSuccess: () => void;
  spreadsheetRowIndex: number;
}

export function ProfileTab({ profileData, loading, onSaveSuccess, spreadsheetRowIndex }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><span className="text-slate-400">กำลังโหลด...</span></div>;
  }

  if (isEditing) {
    return <ProfileForm profileData={profileData} onBack={() => setIsEditing(false)} onSaveSuccess={onSaveSuccess} rowIndex={spreadsheetRowIndex} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
       {/* Profile Display */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">รายละเอียดข้อมูลบุคคล</h2>
            <button onClick={() => setIsEditing(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
               <i className="fa-solid fa-edit"></i> แก้ไขข้อมูล
            </button>
         </div>

         <div className="p-6">
            <h3 className="text-md font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">ข้อมูลส่วนตัว</h3>
            <div className="flex flex-col md:flex-row gap-8">
               <div className="w-48 h-60 shrink-0 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                  {profileData?.avatarUrl ? (
                     <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                     <i className="fa-solid fa-user text-6xl text-slate-300"></i>
                  )}
               </div>
               <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Username</span><span className="font-medium text-slate-900">{profileData?.username || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">คำนำหน้า</span><span className="font-medium text-slate-900">{profileData?.prefix || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ชื่อ</span><span className="font-medium text-slate-900">{profileData?.firstName || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">นามสกุล</span><span className="font-medium text-slate-900">{profileData?.lastName || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ชื่อภาษาอังกฤษ</span><span className="font-medium text-slate-900">{profileData?.englishName || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ชื่อเล่น</span><span className="font-medium text-slate-900">{profileData?.nickname || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">วันเกิด</span><span className="font-medium text-slate-900">{profileData?.birthDate || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เลขประจำตัวประชาชน</span><span className="font-medium text-slate-900">{profileData?.idCard || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">สถานะสมรส</span><span className="font-medium text-slate-900">{profileData?.maritalStatus || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ศาสนา</span><span className="font-medium text-slate-900">{profileData?.religion || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เชื้อชาติ</span><span className="font-medium text-slate-900">{profileData?.ethnicity || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">สัญชาติ</span><span className="font-medium text-slate-900">{profileData?.nationality || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เพศ</span><span className="font-medium text-slate-900">{profileData?.gender || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">กรุ๊ปเลือด</span><span className="font-medium text-slate-900">{profileData?.bloodType || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ส่วนสูง/น้ำหนัก</span><span className="font-medium text-slate-900">{profileData?.height || '-'} ซม. / {profileData?.weight || '-'} กก.</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เบอร์โทร</span><span className="font-medium text-slate-900">{profileData?.phone || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">อีเมล</span><span className="font-medium text-slate-900">{profileData?.email || '-'}</span></div>
                  <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Facebook</span><span className="font-medium text-slate-900">{profileData?.facebook || '-'}</span></div>
               </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 mt-10 mb-6 border-b border-slate-100 pb-2">ข้อมูลอาชีพ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 text-sm">
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">กลุ่มภารกิจ</span><span className="font-medium text-slate-900">{profileData?.jobGroup || '-'}</span></div>
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">องค์กร/ส่วนราชการ</span><span className="font-medium text-slate-900">{profileData?.department || '-'}</span></div>
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">วันที่บรรจุ</span><span className="font-medium text-slate-900">{profileData?.appointDate || '-'}</span></div>
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ตำแหน่ง</span><span className="font-medium text-slate-900">{profileData?.position || '-'}</span></div>
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เลขตำแหน่ง</span><span className="font-medium text-slate-900">{profileData?.positionNumber || '-'}</span></div>
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ระดับ</span><span className="font-medium text-slate-900">{profileData?.level || '-'}</span></div>
               <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เงินเดือน</span><span className="font-medium text-slate-900">{profileData?.salary ? '***** ฿' : '-'}</span></div>
            </div>

            <h3 className="text-md font-bold text-slate-800 mt-10 mb-6 border-b border-slate-100 pb-2">ข้อมูลที่อยู่อาศัย</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
               <div>
                 <h4 className="font-bold text-slate-700 mb-4">ที่อยู่ปัจจุบัน</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">บ้านเลขที่</span><span className="font-medium text-slate-900">{profileData?.c_houseNumber || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">หมู่ที่</span><span className="font-medium text-slate-900">{profileData?.c_village || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ถนน</span><span className="font-medium text-slate-900">{profileData?.c_road || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ตำบล</span><span className="font-medium text-slate-900">{profileData?.c_subdistrict || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">อำเภอ</span><span className="font-medium text-slate-900">{profileData?.c_district || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">จังหวัด</span><span className="font-medium text-slate-900">{profileData?.c_province || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">รหัสไปรษณีย์</span><span className="font-medium text-slate-900">{profileData?.c_zip || '-'}</span></div>
                 </div>
               </div>
               <div>
                 <h4 className="font-bold text-slate-700 mb-4">ที่อยู่ตามทะเบียนบ้าน</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">บ้านเลขที่</span><span className="font-medium text-slate-900">{profileData?.r_houseNumber || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">หมู่ที่</span><span className="font-medium text-slate-900">{profileData?.r_village || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ถนน</span><span className="font-medium text-slate-900">{profileData?.r_road || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ตำบล</span><span className="font-medium text-slate-900">{profileData?.r_subdistrict || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">อำเภอ</span><span className="font-medium text-slate-900">{profileData?.r_district || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">จังหวัด</span><span className="font-medium text-slate-900">{profileData?.r_province || '-'}</span></div>
                   <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">รหัสไปรษณีย์</span><span className="font-medium text-slate-900">{profileData?.r_zip || '-'}</span></div>
                 </div>
               </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 mt-10 mb-6 border-b border-slate-100 pb-2">ข้อมูลบัญชีธนาคาร</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
               <div className="space-y-4">
                 <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ธนาคาร (รับเงินเดือน)</span><span className="font-medium text-slate-900">{profileData?.salaryBankName || '-'}</span></div>
                 <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เลขบัญชี</span><span className="font-medium text-slate-900">{profileData?.salaryBankAccount || '-'}</span></div>
               </div>
               <div className="space-y-4">
                 <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ธนาคาร (รับค่าตอบแทน/OT)</span><span className="font-medium text-slate-900">{profileData?.otBankName || '-'}</span></div>
                 <div className="flex flex-col"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">เลขบัญชี</span><span className="font-medium text-slate-900">{profileData?.otBankAccount || '-'}</span></div>
               </div>
            </div>
         </div>
       </div>
    </motion.div>
  );
}

function ProfileForm({ profileData, onBack, onSaveSuccess, rowIndex }: { profileData: UserProfile | null, onBack: () => void, onSaveSuccess: () => void, rowIndex: number }) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(profileData || {});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setProgress(10);
    try {
      let fileLink = formData.avatarUrl || '';
      if (selectedFile) {
        setProgress(30);
        const folderId = await getOrCreateFolder();
        setProgress(50);
        const uploaded = await uploadFile(selectedFile, folderId);
        fileLink = uploaded.webViewLink || fileLink;
      }
      
      setProgress(70);
      const payload = { ...formData, avatarUrl: fileLink };
      const spreadsheetId = localStorage.getItem('spreadsheetId');
      if (!spreadsheetId) throw new Error('No spreadsheet found');
      
       // Write to Profile sheet row using JSON payload mapping
       const rowData = [
          'user_id', // Placeholder id
          JSON.stringify(payload)
       ];

       if (rowIndex >= 0) {
         await updateRow(spreadsheetId, 'Profile', rowIndex + 2, rowData); 
       } else {
         await appendRow(spreadsheetId, 'Profile', rowData);
       }
       
       setProgress(90);
       axios.post('/api/notify', { message: `✅ อัปเดตประวัติส่วนตัวสำเร็จ` }).catch(console.warn);
       setProgress(100);
       
       Swal.fire({ icon: 'success', title: 'บันทึกแก้ไขข้อมูลสำเร็จ' });
       onSaveSuccess();
       onBack();
    } catch(err) {
       Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
    setSubmitting(false);
    setTimeout(() => setProgress(0), 1000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
       
       {progress > 0 && (
         <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4">
           <div className="bg-indigo-600 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
         </div>
       )}

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
         <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">แก้ไขรายละเอียดข้อมูลบุคคล</h2>
            <button onClick={onBack} disabled={submitting} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-times text-xl"></i></button>
         </div>

         <form onSubmit={handleSubmit} className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
               <div className="w-48 shrink-0 flex flex-col gap-3">
                  <div className="w-48 h-60 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center relative">
                     {selectedFile ? (
                       <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-full h-full object-cover" />
                     ) : formData.avatarUrl ? (
                       <img src={formData.avatarUrl} alt="preview" className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-slate-400 font-bold mb-8">รูปประจำตัว</span>
                     )}
                  </div>
                  <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
               </div>

               <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-slate-600">Username <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-colors peer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">คำนำหน้า <span className="text-red-500">*</span></label>
                    <select required value={formData.prefix || ''} onChange={e => setFormData({...formData, prefix: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm">
                       <option value="">เลือก</option>
                       <option value="นาย">นาย</option>
                       <option value="นาง">นาง</option>
                       <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อ <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">นามสกุล <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่ออังกฤษ</label>
                    <input type="text" value={formData.englishName || ''} onChange={e => setFormData({...formData, englishName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ชื่อเล่น</label>
                    <input type="text" value={formData.nickname || ''} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">วันเกิด</label>
                    <input type="date" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เลข ปชช.</label>
                    <input type="text" maxLength={13} value={formData.idCard || ''} onChange={e => setFormData({...formData, idCard: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">สถานะสมรส</label>
                    <select value={formData.maritalStatus || ''} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm">
                       <option value="">เลือก</option>
                       <option value="โสด">โสด</option>
                       <option value="สมรส">สมรส</option>
                       <option value="หย่าร้าง">หย่าร้าง</option>
                       <option value="หม้าย">หม้าย</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ศาสนา</label>
                    <input type="text" value={formData.religion || ''} onChange={e => setFormData({...formData, religion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เชื้อชาติ / สัญชาติ</label>
                    <div className="flex gap-2">
                       <input type="text" placeholder="เชื้อชาติ" value={formData.ethnicity || ''} onChange={e => setFormData({...formData, ethnicity: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                       <input type="text" placeholder="สัญชาติ" value={formData.nationality || ''} onChange={e => setFormData({...formData, nationality: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เพศ / กรุ๊ปเลือด</label>
                    <div className="flex gap-2">
                       <select value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm">
                          <option value="">เลือกเพศ</option>
                          <option value="ชาย">ชาย</option>
                          <option value="หญิง">หญิง</option>
                       </select>
                       <select value={formData.bloodType || ''} onChange={e => setFormData({...formData, bloodType: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm">
                          <option value="">กรุ๊ปเลือด</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                       </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">ส่วนสูง (ซม.) / น้ำหนัก (กก.)</label>
                    <div className="flex gap-2">
                       <input type="number" placeholder="ส่วนสูง" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                       <input type="number" placeholder="น้ำหนัก" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">เบอร์โทร</label>
                    <input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">อีเมล</label>
                    <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Facebook</label>
                    <input type="text" value={formData.facebook || ''} onChange={e => setFormData({...formData, facebook: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
               </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 mt-10 mb-6 border-b border-slate-100 pb-2">ข้อมูลอาชีพ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">กลุ่มภารกิจ</label>
                 <input type="text" value={formData.jobGroup || ''} onChange={e => setFormData({...formData, jobGroup: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">องค์กร/ส่วนราชการ</label>
                 <input type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">วันที่บรรจุ</label>
                 <input type="date" value={formData.appointDate || ''} onChange={e => setFormData({...formData, appointDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">ตำแหน่ง</label>
                 <input type="text" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">เลขตำแหน่ง</label>
                 <input type="text" value={formData.positionNumber || ''} onChange={e => setFormData({...formData, positionNumber: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">ระดับ</label>
                 <input type="text" value={formData.level || ''} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-600">เงินเดือน</label>
                 <input type="number" value={formData.salary || ''} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
               </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 mt-10 mb-6 border-b border-slate-100 pb-2">ข้อมูลที่อยู่อาศัย</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm">ที่อยู่ปัจจุบัน</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">บ้านเลขที่</label>
                       <input type="text" value={formData.c_houseNumber || ''} onChange={e => setFormData({...formData, c_houseNumber: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">หมู่ที่</label>
                       <input type="text" value={formData.c_village || ''} onChange={e => setFormData({...formData, c_village: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1 col-span-2">
                       <label className="text-xs font-bold text-slate-600">ถนน</label>
                       <input type="text" value={formData.c_road || ''} onChange={e => setFormData({...formData, c_road: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">ตำบล</label>
                       <input type="text" value={formData.c_subdistrict || ''} onChange={e => setFormData({...formData, c_subdistrict: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">อำเภอ</label>
                       <input type="text" value={formData.c_district || ''} onChange={e => setFormData({...formData, c_district: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">จังหวัด</label>
                       <input type="text" value={formData.c_province || ''} onChange={e => setFormData({...formData, c_province: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">รหัสไปรษณีย์</label>
                       <input type="text" value={formData.c_zip || ''} onChange={e => setFormData({...formData, c_zip: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                  </div>
               </div>
               <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm">ที่อยู่ตามทะเบียนบ้าน</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">บ้านเลขที่</label>
                       <input type="text" value={formData.r_houseNumber || ''} onChange={e => setFormData({...formData, r_houseNumber: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">หมู่ที่</label>
                       <input type="text" value={formData.r_village || ''} onChange={e => setFormData({...formData, r_village: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1 col-span-2">
                       <label className="text-xs font-bold text-slate-600">ถนน</label>
                       <input type="text" value={formData.r_road || ''} onChange={e => setFormData({...formData, r_road: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">ตำบล</label>
                       <input type="text" value={formData.r_subdistrict || ''} onChange={e => setFormData({...formData, r_subdistrict: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">อำเภอ</label>
                       <input type="text" value={formData.r_district || ''} onChange={e => setFormData({...formData, r_district: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">จังหวัด</label>
                       <input type="text" value={formData.r_province || ''} onChange={e => setFormData({...formData, r_province: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-600">รหัสไปรษณีย์</label>
                       <input type="text" value={formData.r_zip || ''} onChange={e => setFormData({...formData, r_zip: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                     </div>
                  </div>
               </div>
            </div>

            <h3 className="text-md font-bold text-slate-800 mt-10 mb-6 border-b border-slate-100 pb-2">ข้อมูลบัญชีธนาคาร</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-600">ธนาคาร (รับเงินเดือน)</label>
                   <input type="text" value={formData.salaryBankName || ''} onChange={e => setFormData({...formData, salaryBankName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-600">เลขบัญชี</label>
                   <input type="text" value={formData.salaryBankAccount || ''} onChange={e => setFormData({...formData, salaryBankAccount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                 </div>
               </div>
               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-600">ธนาคาร (รับค่าตอบแทน/OT)</label>
                   <input type="text" value={formData.otBankName || ''} onChange={e => setFormData({...formData, otBankName: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-600">เลขบัญชี</label>
                   <input type="text" value={formData.otBankAccount || ''} onChange={e => setFormData({...formData, otBankAccount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm" />
                 </div>
               </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
               <button type="submit" disabled={submitting} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-2">
                 {submitting ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</> : <><i className="fa-solid fa-save"></i> บันทึกแก้ไขข้อมูล</>}
               </button>
               <button type="button" onClick={onBack} disabled={submitting} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition">
                 <i className="fa-solid fa-times mr-1"></i> ยกเลิก
               </button>
            </div>
         </form>
       </div>
    </motion.div>
  );
}
