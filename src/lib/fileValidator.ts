import Swal from 'sweetalert2';

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateSelectedFile = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
    Swal.fire({
      icon: 'warning',
      title: 'ขนาดไฟล์เกินกำหนด! ⚠️',
      html: `
        <div class="text-left space-y-2 text-xs text-slate-600">
          <p class="font-medium text-slate-800">ไฟล์ <b>"${file.name}"</b> มีขนาด <b>${fileSizeMb} MB</b></p>
          <p>ระบบกำหนดขนาดไฟล์แนบสูงสุดไม่เกิน <b class="text-rose-600">${MAX_FILE_SIZE_MB} MB</b> เพื่อประหยัดพื้นที่ Google Drive และให้การแนบไฟล์ทำงานรวดเร็ว</p>
          <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
            💡 <b>คำแนะนำ:</b> ย่อขนาดไฟล์ PDF หรือใช้ฟังก์ชัน <b>"สแกนด้วยกล้องมือถือ"</b> เพื่อให้ได้ไฟล์ภาพขนาดเหมาะสม
          </div>
        </div>
      `,
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#f59e0b',
    });
    return false;
  }
  return true;
};
