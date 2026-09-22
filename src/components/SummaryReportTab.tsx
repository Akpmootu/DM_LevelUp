import React, { useRef, useState } from 'react';
import { OfficialHistory, TrainingHistory, WorkExperience, LeaveLog, UserProfile } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

interface SummaryReportTabProps {
  profileData?: UserProfile | null;
  officialLogs: OfficialHistory[];
  trainingLogs: TrainingHistory[];
  experienceLogs: WorkExperience[];
  leaveLogs: LeaveLog[];
  loading?: boolean;
}

export const SummaryReportTab: React.FC<SummaryReportTabProps> = ({
  profileData,
  officialLogs = [],
  trainingLogs = [],
  experienceLogs = [],
  leaveLogs = [],
  loading = false,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterYear, setFilterYear] = useState<string>('all');

  // Extract years from training & leave
  const availableYears = Array.from(
    new Set([
      ...trainingLogs.map(t => t.year).filter(Boolean),
      ...leaveLogs.map(l => l.fiscalYear).filter(Boolean)
    ])
  ).sort().reverse();

  const filteredTraining = filterYear === 'all' 
    ? trainingLogs 
    : trainingLogs.filter(t => t.year === filterYear);

  const filteredLeave = filterYear === 'all'
    ? leaveLogs
    : leaveLogs.filter(l => l.fiscalYear === filterYear);

  // Leave calculations
  const totalSickLeave = filteredLeave
    .filter(l => l.leaveType?.includes('ป่วย'))
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

  const totalPersonalLeave = filteredLeave
    .filter(l => l.leaveType?.includes('กิจ'))
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

  const totalVacationLeave = filteredLeave
    .filter(l => l.leaveType?.includes('พักผ่อน'))
    .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

  const totalLeaveDays = totalSickLeave + totalPersonalLeave + totalVacationLeave;

  // Total training days & hours
  const totalTrainingDays = filteredTraining.reduce((sum, t) => sum + (Number(t.durationDays) || 0), 0);

  // Full Name calculation
  const fullName = profileData?.firstName && profileData?.lastName
    ? `${profileData.prefix || ''}${profileData.firstName} ${profileData.lastName}`
    : 'ข้าราชการ/เจ้าหน้าที่ผู้รับการประเมิน';

  const positionTitle = profileData?.position || 'ตำแหน่ง - ไม่ระบุ';
  const departmentName = profileData?.department || 'สำนักงานสาธารณสุขจังหวัดสตูล';

  // Calculate Service Years if startDate exists
  let serviceYearsStr = '-';
  if (profileData?.startDate) {
    const start = new Date(profileData.startDate);
    const now = new Date();
    if (!isNaN(start.getTime())) {
      const diffMs = now.getTime() - start.getTime();
      const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
      const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
      serviceYearsStr = `${years} ปี ${months} เดือน`;
    }
  }

  // Print using native browser print dialog with custom print CSS
  const handlePrint = () => {
    window.print();
  };

  // Export as PDF file using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    Swal.fire({
      title: 'กำลังสร้างไฟล์ PDF...',
      text: 'กรุณารอสักครู่ ระบบกำลังจัดหน้าเอกสาร ก.พ. 7',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`แบบสรุปประวัติ_กพ7_${profileData?.firstName || 'ข้าราชการ'}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'ดาวน์โหลดสำเร็จ! 📄',
        text: 'ระบบได้บันทึกไฟล์ PDF เรียบร้อยแล้ว',
        confirmButtonColor: '#0f172a',
        timer: 2000
      });
    } catch (err: any) {
      console.error('PDF generation error', err);
      Swal.fire({
        icon: 'error',
        title: 'สร้าง PDF ไม่สำเร็จ',
        text: err.message || 'เกิดข้อผิดพลาดในการประมวลผล',
        confirmButtonColor: '#0f172a'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Plaintext Summary
  const handleCopyText = () => {
    const text = `แบบสรุปประวัติข้าราชการ (ก.พ. 7 ย่อ)
ชื่อ-สกุล: ${fullName}
ตำแหน่ง: ${positionTitle}
สังกัด: ${departmentName}
อายุราชการ: ${serviceYearsStr}
วุฒิการศึกษา: ${profileData?.education || '-'}
ประวัติรับราชการ: ${officialLogs.length} รายการ
ประวัติอบรม: ${trainingLogs.length} หลักสูตร (รวม ${totalTrainingDays} วัน)
ประสบการณ์/คณะทำงาน: ${experienceLogs.length} รายการ
สถิติการลา: ลาป่วย ${totalSickLeave} วัน, ลากิจ ${totalPersonalLeave} วัน, ลาพักผ่อน ${totalVacationLeave} วัน (รวม ${totalLeaveDays} วัน)
วันที่ออกเอกสาร: ${new Date().toLocaleDateString('th-TH')}`;

    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'คัดลอกข้อความแล้ว 📋',
      text: 'สามารถนำไปวางในรายงานหรือเอกสารประกอบการประเมินได้ทันที',
      confirmButtonColor: '#0f172a',
      timer: 2000
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 font-sans">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-amber-600"></i>
        <p className="text-sm font-medium">กำลังเตรียมเอกสารสรุปประวัติ...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-file-invoice text-amber-600"></i>
            สรุปประวัติย่อแบบทางการ (แบบ ก.พ. 7 ย่อ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เอกสารมาตรฐานราชการ จัดหน้ารองรับการพิมพ์ A4 และดาวน์โหลดเป็น PDF สำหรับประกอบการประเมิน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter */}
          {availableYears.length > 0 && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">แสดงทุกปีงบประมาณ</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>ปีงบประมาณ {yr}</option>
              ))}
            </select>
          )}

          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
            title="คัดลอกข้อความสรุปประวัติ"
          >
            <i className="fa-regular fa-copy"></i>
            <span className="hidden sm:inline">คัดลอก</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
          >
            <i className={`fa-solid fa-file-pdf ${isExporting ? 'animate-spin' : ''}`}></i>
            <span>ดาวน์โหลด PDF</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
          >
            <i className="fa-solid fa-print"></i>
            <span>พิมพ์เอกสาร (A4)</span>
          </button>
        </div>
      </div>

      {/* Official Government Printable Document Box */}
      <div 
        ref={printAreaRef}
        id="official-kp7-document"
        className="bg-white rounded-2xl border border-slate-300 p-8 sm:p-12 shadow-md text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:m-0"
      >
        {/* Document Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-2">
          {/* Emblem Stamp */}
          <div className="w-16 h-16 mx-auto mb-2 text-slate-900 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-16 h-16 fill-current">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M50 15 L58 35 L80 38 L63 53 L68 75 L50 63 L32 75 L37 53 L20 38 L42 35 Z" fill="currentColor"/>
              <circle cx="50" cy="50" r="8" fill="#ffffff"/>
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-serif">
            แบบสรุปประวัติและผลงานการรับราชการ (แบบ ก.พ. 7 ย่อ)
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            หน่วยงาน: {departmentName}
          </p>
          <div className="flex justify-center items-center gap-4 text-[11px] text-slate-600 pt-1">
            <span>วันที่ออกรายงาน: {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span>สถานะข้อมูล: รับรองความถูกต้อง</span>
          </div>
        </div>

        {/* Section 1: ข้อมูลทั่วไปของผู้ขอรับการประเมิน */}
        <div className="mt-6 space-y-3">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-slate-900 font-bold text-xs uppercase tracking-wider text-slate-900">
            ๑. ข้อมูลส่วนบุคคลและตำแหน่งปัจจุบัน
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-800 leading-relaxed pt-1">
            <div>
              <span className="font-semibold text-slate-900">ชื่อ - สกุล:</span> {fullName}
            </div>
            <div>
              <span className="font-semibold text-slate-900">ตำแหน่งปัจจุบัน:</span> {positionTitle}
            </div>
            <div>
              <span className="font-semibold text-slate-900">สังกัด:</span> {departmentName}
            </div>
            <div>
              <span className="font-semibold text-slate-900">วุฒิการศึกษาสูงสุด:</span> {profileData?.education || 'ตามเอกสารแนบ'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">วันบรรจุรับราชการ:</span> {profileData?.startDate ? new Date(profileData.startDate).toLocaleDateString('th-TH') : '-'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">ระยะเวลารับราชการรวม:</span> {serviceYearsStr}
            </div>
            <div>
              <span className="font-semibold text-slate-900">เบอร์โทรศัพท์ติดต่อ:</span> {profileData?.phone || '-'}
            </div>
            <div>
              <span className="font-semibold text-slate-900">อีเมลติดต่อ:</span> {profileData?.email || '-'}
            </div>
          </div>
        </div>

        {/* Section 2: ประวัติรับราชการและการเลื่อนขั้นเงินเดือน */}
        <div className="mt-8 space-y-3">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-slate-900 font-bold text-xs uppercase tracking-wider text-slate-900 flex justify-between items-center">
            <span>๒. ประวัติการดำรงตำแหน่งและการเลื่อนขั้นเงินเดือน</span>
            <span className="text-[10px] font-normal text-slate-600">รวม {officialLogs.length} รายการ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-300 px-3 py-2 w-12 text-center">ลำดับ</th>
                  <th className="border border-slate-300 px-3 py-2 w-28 text-center">วัน เดือน ปี</th>
                  <th className="border border-slate-300 px-3 py-2">ตำแหน่ง / ส่วนราชการ</th>
                  <th className="border border-slate-300 px-3 py-2">การเคลื่อนไหว / คำสั่ง</th>
                  <th className="border border-slate-300 px-3 py-2 w-24 text-right">อัตราเงินเดือน</th>
                  <th className="border border-slate-300 px-3 py-2 w-28 text-center">เลขที่คำสั่ง</th>
                </tr>
              </thead>
              <tbody>
                {officialLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-300 px-3 py-4 text-center text-slate-400 italic">
                      ไม่พบข้อมูลประวัติรับราชการ
                    </td>
                  </tr>
                ) : (
                  officialLogs.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-mono text-[11px]">{item.date || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5">{item.positionAndDept || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5">{item.movement || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono text-[11px]">
                        {item.salary ? Number(item.salary).toLocaleString() : '-'}
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center text-[10px] text-slate-600">
                        {item.referenceDoc ? 'มีเอกสารแนบ' : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: ประวัติการฝึกอบรมและพัฒนาตนเอง */}
        <div className="mt-8 space-y-3">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-slate-900 font-bold text-xs uppercase tracking-wider text-slate-900 flex justify-between items-center">
            <span>๓. ประวัติการฝึกอบรม สัมมนา และพัฒนาตนเอง</span>
            <span className="text-[10px] font-normal text-slate-600">รวม {filteredTraining.length} หลักสูตร ({totalTrainingDays} วัน)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-300 px-3 py-2 w-12 text-center">ลำดับ</th>
                  <th className="border border-slate-300 px-3 py-2 w-20 text-center">ปีงบประมาณ</th>
                  <th className="border border-slate-300 px-3 py-2">ชื่อหลักสูตร / โครงการฝึกอบรม</th>
                  <th className="border border-slate-300 px-3 py-2">หน่วยงานที่จัด</th>
                  <th className="border border-slate-300 px-3 py-2 w-20 text-center">จำนวนวัน</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraining.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 px-3 py-4 text-center text-slate-400 italic">
                      ไม่พบข้อมูลประวัติการฝึกอบรม
                    </td>
                  </tr>
                ) : (
                  filteredTraining.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-mono text-[11px]">{item.year || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">{item.courseName || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-slate-700">{item.organizer || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-mono text-[11px]">{item.durationDays || 1}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: ประสบการณ์และผลงานพิเศษ */}
        {experienceLogs.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-slate-900 font-bold text-xs uppercase tracking-wider text-slate-900 flex justify-between items-center">
              <span>๔. ประสบการณ์ทำงาน บทบาทหน้าที่พิเศษ และคณะทำงาน</span>
              <span className="text-[10px] font-normal text-slate-600">รวม {experienceLogs.length} รายการ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    <th className="border border-slate-300 px-3 py-2 w-12 text-center">ลำดับ</th>
                    <th className="border border-slate-300 px-3 py-2 w-28 text-center">ช่วงระยะเวลา</th>
                    <th className="border border-slate-300 px-3 py-2">บทบาทหน้าที่ / ภารกิจ</th>
                    <th className="border border-slate-300 px-3 py-2">หน่วยงาน / โครงการ</th>
                  </tr>
                </thead>
                <tbody>
                  {experienceLogs.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-mono text-[11px]">{item.duration || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">{item.role || '-'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-slate-700">{item.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 5: สถิติวันลา */}
        <div className="mt-8 space-y-3">
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-slate-900 font-bold text-xs uppercase tracking-wider text-slate-900">
            ๕. สถิติการลาในรอบการประเมิน
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
              <span className="block text-slate-600 text-[11px]">ลาป่วย</span>
              <span className="text-base font-bold text-slate-900 font-mono">{totalSickLeave}</span> วัน
            </div>
            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
              <span className="block text-slate-600 text-[11px]">ลากิจส่วนตัว</span>
              <span className="text-base font-bold text-slate-900 font-mono">{totalPersonalLeave}</span> วัน
            </div>
            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">
              <span className="block text-slate-600 text-[11px]">ลาพักผ่อน</span>
              <span className="text-base font-bold text-slate-900 font-mono">{totalVacationLeave}</span> วัน
            </div>
            <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-100">
              <span className="block text-slate-800 font-semibold text-[11px]">รวมวันลาทั้งสิ้น</span>
              <span className="text-base font-extrabold text-amber-700 font-mono">{totalLeaveDays}</span> วัน
            </div>
          </div>
        </div>

        {/* Official Certification Signature Block */}
        <div className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-center text-slate-800 break-inside-avoid">
          {/* User Certification */}
          <div className="space-y-4">
            <p className="italic text-slate-700">
              "ขอรับรองว่าประวัติและข้อมูลผลงานข้างต้นนี้เป็นความจริงและถูกต้องทุกประการ"
            </p>
            <div className="pt-6">
              <div className="border-b border-dotted border-slate-400 w-48 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-900">({fullName})</p>
              <p className="text-slate-600 text-[11px]">ผู้ขอรับการประเมิน</p>
              <p className="text-slate-500 text-[10px] mt-1">วันที่ ...... / .................... / พ.ศ. ............</p>
            </div>
          </div>

          {/* Supervisor / Head of Agency Certification */}
          <div className="space-y-4">
            <p className="text-slate-700">
              "ได้ตรวจสอบข้อมูลแล้ว ขอรับรองว่าถูกต้องตรงตามทะเบียนประวัติของทางราชการ"
            </p>
            <div className="pt-6">
              <div className="border-b border-dotted border-slate-400 w-48 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-900">(........................................................)</p>
              <p className="text-slate-600 text-[11px]">ผู้บังคับบัญชา / หัวหน้าหน่วยงาน</p>
              <p className="text-slate-500 text-[10px] mt-1">วันที่ ...... / .................... / พ.ศ. ............</p>
            </div>
          </div>
        </div>

      </div>

      {/* Print Specific CSS Styles injected */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header, aside, nav, footer, .print\\:hidden {
            display: none !important;
          }
          #official-kp7-document {
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
