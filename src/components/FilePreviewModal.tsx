import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: File | null;
  targetName?: string;
  year?: string;
  onClose: () => void;
}

export function FilePreviewModal({ isOpen, file, targetName, year, onClose }: FilePreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  const cleanYear = year ? String(year).trim() : `${new Date().getFullYear() + 543}`;
  const ext = file.name.split('.').pop() || 'pdf';
  const cleanTargetName = (targetName || 'เอกสารแนบ').replace(/[/\\?%*:|"<>]/g, '-').trim();
  const autoFileName = `${cleanYear}_${cleanTargetName}.${ext}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg">
                <i className={`fa-solid ${isPdf ? 'fa-file-pdf text-rose-400' : 'fa-file-image text-emerald-400'}`}></i>
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  ตัวอย่างเอกสารแนบก่อนอัปโหลด
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {file.name} ({fileSizeMb} MB)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Auto File Naming Info Strip */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <i className="fa-solid fa-tags text-amber-600"></i>
              <span>ชื่อไฟล์ที่จะจัดเก็บใน Google Drive:</span>
            </div>
            <div className="font-mono font-bold text-indigo-900 bg-white px-3 py-1 rounded-lg border border-amber-200 text-xs shadow-2xs truncate">
              {autoFileName}
            </div>
          </div>

          {/* Main Preview Container */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-100/70 flex items-center justify-center min-h-[350px]">
            {objectUrl ? (
              isImage ? (
                <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 max-h-[55vh] flex items-center justify-center overflow-hidden">
                  <img
                    src={objectUrl}
                    alt="Document Preview"
                    className="max-h-[50vh] w-auto object-contain rounded-xl"
                  />
                </div>
              ) : isPdf ? (
                <div className="w-full h-[55vh] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <iframe
                    src={objectUrl}
                    title="PDF Preview"
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md">
                  <i className="fa-solid fa-file-arrow-up text-4xl text-slate-400"></i>
                  <p className="font-bold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ล่วงหน้าได้โดยตรง แต่ไฟล์จะถูกบันทึกขึ้น Drive อย่างถูกต้อง</p>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                <span>กำลังโหลดตัวอย่างไฟล์...</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-indigo-500"></i>
              <span>ตรวจสอบความถูกต้องของเอกสารก่อนกดบันทึกข้อมูล</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <i className="fa-solid fa-circle-check text-emerald-400"></i>
              <span>ตกลง ใช้ไฟล์นี้</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
