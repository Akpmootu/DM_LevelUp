import React, { useState } from 'react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import { copyFileBackup, getOrCreateFolder } from '../lib/googleDrive';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId?: string | null;
  officialData?: any[];
  trainingData?: any[];
  experienceData?: any[];
  profileData?: any;
}

export function BackupModal({
  isOpen,
  onClose,
  spreadsheetId,
  officialData = [],
  trainingData = [],
  experienceData = [],
  profileData,
}: BackupModalProps) {
  const [creatingCopy, setCreatingCopy] = useState(false);

  if (!isOpen) return null;

  const currentYearBson = new Date().getFullYear() + 543;
  const sheetId = spreadsheetId || localStorage.getItem('spreadsheetId') || '1ktkgcHMhD0MEQjCzmfvdms5ln6c0hvJ3e1kkoZ8gH5A';

  const handleCreateDriveBackup = async () => {
    setCreatingCopy(true);
    try {
      const nowStr = new Date().toISOString().slice(0, 10);
      const backupTitle = `[สำรองข้อมูล] mootu_LevelUp_DB_${nowStr}_${Date.now()}`;
      await copyFileBackup(sheetId, backupTitle);

      Swal.fire({
        icon: 'success',
        title: 'สร้างไฟล์สำรองสำเร็จ! 📁',
        text: `ระบบสร้างไฟล์คัดลอก "${backupTitle}" ไว้ใน Google Drive เรียบร้อยแล้ว`,
        confirmButtonColor: '#059669',
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการสร้างไฟล์สำรอง',
        text: 'กรุณาตรวจสอบสิทธิ์การเข้าถึง Google Drive',
      });
    } finally {
      setCreatingCopy(false);
    }
  };

  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      profile: profileData,
      officialHistory: officialData,
      trainingHistory: trainingData,
      workExperience: experienceData,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mootu_levelup_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'ส่งออกข้อมูลเรียบร้อย ✅',
      text: 'ดาวน์โหลดไฟล์ JSON สำรองไว้ในเครื่องของคุณแล้ว',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleOpenFolder = async () => {
    try {
      const folderId = await getOrCreateFolder();
      window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
    } catch (e) {
      window.open('https://drive.google.com/', '_blank');
    }
  };

  const handleOpenSheetsHistory = () => {
    window.open(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden space-y-6"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">สำรองข้อมูล & จัดหมวดหมู่ไฟล์ Drive</h2>
            <p className="text-xs text-slate-500 mt-0.5">ระบบจัดการความปลอดภัยข้อมูลและโครงสร้างโฟลเดอร์แยกตามปี พ.ศ.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Drive Folder by Year & File Naming Rule */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-1">
                <i className="fa-solid fa-folder-tree text-base"></i>
                <span>จัดหมวดหมู่ & ตั้งชื่อไฟล์อัตโนมัติ</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">
                ระบบจัดเก็บไฟล์ใน Google Drive โดยแยกตามโฟลเดอร์ปี พ.ศ. (<span className="font-semibold text-indigo-600">พ.ศ. {currentYearBson}</span>) พร้อมตั้งชื่อไฟล์ในรูปแบบมาตรฐานอัตโนมัติ:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-indigo-900 font-semibold flex items-center gap-2">
                <i className="fa-solid fa-file-pdf text-rose-500"></i>
                <span>[ปีพ.ศ.]_[ชื่อคำสั่ง/คอร์สอบรม].pdf</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">ตัวอย่าง: <code className="bg-slate-200/70 px-1 rounded">2568_คำสั่งย้าย.pdf</code></p>
            </div>
            <button
              onClick={handleOpenFolder}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-2"
            >
              <i className="fa-brands fa-google-drive"></i> เปิด Google Drive
            </button>
          </div>

          {/* Card 2: Version History in Google Sheets */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                <i className="fa-solid fa-clock-rotate-left text-base"></i>
                <span>ตั้งชื่อประวัติเวอร์ชัน (Version History)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">
                เมื่อปรับปรุงประวัติครั้งใหญ่ แนะนำให้ตั้งชื่อเวอร์ชันใน Google Sheets เพื่อย้อนกลับข้อมูลได้ง่าย:
              </p>
              <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <i className="fa-solid fa-circle-check text-emerald-600"></i>
                  <span>ขั้นตอนการตั้งชื่อเวอร์ชัน:</span>
                </div>
                <p className="pl-4">1. ไปที่ <span className="font-bold">ไฟล์ (File)</span></p>
                <p className="pl-4">2. เลือก <span className="font-bold">ประวัติเวอร์ชัน (Version history)</span></p>
                <p className="pl-4">3. คลิก <span className="font-bold">ตั้งชื่อเวอร์ชันปัจจุบัน (Name current version)</span></p>
              </div>
            </div>
            <button
              onClick={handleOpenSheetsHistory}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-2"
            >
              <i className="fa-solid fa-file-spreadsheet"></i> เปิด Google Sheets เพื่อตั้งชื่อเวอร์ชัน
            </button>
          </div>
        </div>

        {/* Card 3: Instant Drive Copy Snapshot & Offline JSON */}
        <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-4">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-database text-amber-600 text-lg mt-0.5"></i>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">การสำรองข้อมูลด่วน (Manual Backup Options)</h4>
              <p className="text-xs text-slate-600 mt-1">
                คุณสามารถกดคัดลอกฐานข้อมูลเก็บไว้ใน Google Drive เป็นฉบับสำรอง หรือส่งออกเป็นไฟล์ JSON ลงเครื่อง
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleCreateDriveBackup}
              disabled={creatingCopy}
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creatingCopy ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> กำลังสร้างไฟล์สำรอง...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-copy"></i> สำรองสำเนาลง Google Drive
                </>
              )}
            </button>

            <button
              onClick={handleExportJSON}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-download"></i> ดาวน์โหลดสำรอง (JSON)
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </motion.div>
    </div>
  );
}
