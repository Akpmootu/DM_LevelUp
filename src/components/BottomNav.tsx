import React from 'react';
import { clsx } from 'clsx';
import Swal from 'sweetalert2';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const handleQuickAdd = async () => {
    const { value: selectedType } = await Swal.fire({
      title: 'เลือกลายการที่ต้องการบันทึก',
      input: 'select',
      inputOptions: {
        'official': 'ประวัติรับราชการ',
        'training': 'ประวัติการฝึกอบรม',
        'experience': 'ประสบการณ์ทำงาน',
        'leave': 'ประวัติการลา'
      },
      inputPlaceholder: 'เลือกรายการ...',
      showCancelButton: true,
      confirmButtonText: 'บันทึก <i class="fa-solid fa-arrow-right ml-1"></i>',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#4f46e5',
      customClass: {
        confirmButton: 'rounded-xl px-6 py-2 shadow-lg shadow-indigo-500/30',
        cancelButton: 'rounded-xl px-6 py-2',
        input: 'rounded-xl border-slate-200 mt-4'
      }
    });

    if (selectedType) {
      setActiveTab(selectedType);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-add-form', { detail: { type: selectedType } }));
      }, 300);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-5 left-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-2xl shadow-slate-900/10 rounded-2xl z-40 flex items-center justify-around h-16 px-2">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          activeTab === 'dashboard' ? "text-indigo-600" : "text-slate-400"
        )}
      >
        <i className="fa-solid fa-chart-pie text-xl"></i>
      </button>

      <button 
        onClick={() => setActiveTab('official')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          activeTab === 'official' ? "text-indigo-600" : "text-slate-400"
        )}
      >
        <i className="fa-solid fa-user-tie text-xl"></i>
      </button>

      {/* Floating Add Button */}
      <div className="relative -top-5">
        <button 
          onClick={handleQuickAdd}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all outline-none"
          aria-label="Add New Record"
        >
          <i className="fa-solid fa-plus text-2xl"></i>
        </button>
      </div>

      <button 
        onClick={() => setActiveTab('training')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          activeTab === 'training' ? "text-indigo-600" : "text-slate-400"
        )}
      >
        <i className="fa-solid fa-chalkboard-user text-xl"></i>
      </button>

      <button 
        onClick={() => setActiveTab('summary-pdf')}
        className={clsx(
          "flex flex-col items-center justify-center w-16 h-full transition-colors",
          activeTab === 'summary-pdf' ? "text-amber-600 font-bold" : "text-slate-400"
        )}
        title="สรุปประวัติ ก.พ. 7 ย่อ (PDF)"
      >
        <i className="fa-solid fa-file-invoice text-xl"></i>
      </button>
    </nav>
  );
}
