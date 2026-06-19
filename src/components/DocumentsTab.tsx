import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import { getOrCreateFolder, uploadFile, listFiles } from '../lib/googleDrive';
import { clsx } from 'clsx';

export function DocumentsTab() {
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const folderId = await getOrCreateFolder();
      const filesList = await listFiles(folderId);
      setFiles(filesList);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      Swal.fire({ icon: 'error', title: 'ดึงข้อมูลไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        setUploading(true);
        const folderId = await getOrCreateFolder();
        await uploadFile(file, folderId);
        Swal.fire({ icon: 'success', title: 'อัพโหลดสำเร็จ 🥳' });
        await fetchFiles();
      } catch (error) {
        console.error('Upload failed:', error);
        Swal.fire({ icon: 'error', title: 'อัพโหลดไม่สำเร็จ ❌' });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">📂 เอกสารและรูปภาพ</h2>
          <p className="text-slate-500 mt-1">อัพโหลดและจัดการไฟล์ใน Google Drive ของคุณ</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="ค้นหาเอกสาร..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={handleUploadClick}
            disabled={uploading}
            className={clsx(
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap",
              uploading && "opacity-70 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <i className="fa-solid fa-spinner fa-spin text-xl"></i>
            ) : (
              <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
            )}
            {uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์'}
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*,.pdf"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] p-6 lg:p-8">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
            <p>กำลังโหลดไฟล์...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <i className="fa-regular fa-folder-open text-6xl text-slate-300 mb-4"></i>
            <p className="text-lg font-medium text-slate-500">
               {searchQuery ? 'ไม่พบเอกสารที่ค้นหา' : 'ไม่มีไฟล์ในโฟลเดอร์'}
            </p>
            <p className="text-sm">{searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'กดปุ่มอัพโหลดเพื่อเพิ่มไฟล์ใหม่'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFiles.map((file) => (
              <a 
                key={file.id} 
                href={file.webViewLink} 
                target="_blank" 
                rel="noreferrer"
                className="group flex flex-col bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center relative overflow-hidden"
              >
                <div className="h-32 mb-4 rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <i className={clsx("fa-solid text-5xl", file.mimeType.includes('pdf') ? "fa-file-pdf text-red-500" : "fa-file text-slate-400")}></i>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight" title={file.name}>
                  {file.name}
                </p>
                
                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                   <div className="bg-white text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <i className="fa-solid fa-external-link-alt"></i>
                   </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
