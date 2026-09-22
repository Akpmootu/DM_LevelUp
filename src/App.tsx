import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { OfficialHistoryTab } from './components/OfficialHistoryTab';
import { TrainingHistoryTab } from './components/TrainingHistoryTab';
import { WorkExperienceTab } from './components/WorkExperienceTab';
import { DocumentsTab } from './components/DocumentsTab';
import { ProfileTab } from './components/ProfileTab';
import { LeaveHistoryTab } from './components/LeaveHistoryTab';
import { SmartSearchTab } from './components/SmartSearchTab';
import { SummaryReportTab } from './components/SummaryReportTab';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { LoginPage } from './components/LoginPage';
import { BackupModal } from './components/BackupModal';
import { useGoogleSheetsData } from './hooks/useGoogleSheetsData';
import { initAuth, googleSignIn } from './lib/googleAuth';
import { OfficialHistory, TrainingHistory, WorkExperience, LeaveLog, UserProfile } from './types';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  useEffect(() => {
    initAuth(
      () => {
        setNeedsAuth(false);
        setLoginError(null);
      },
      () => setNeedsAuth(true)
    );
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        setLoginError(null);
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับ ${result.user.displayName || result.user.email || ''}`,
          confirmButtonColor: '#0F172A',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const code = err?.code || '';
      let message = 'ไม่สามารถเข้าสู่ระบบผ่าน Google ได้';
      
      if (code === 'auth/popup-blocked') {
        message = 'เบราว์เซอร์บล็อกหน้าต่างป็อปอัป (Popup Blocked) กรุณาอนุญาตป็อปอัป หรือเปิดหน้าเว็บในแท็บใหม่';
      } else if (code === 'auth/popup-closed-by-user') {
        message = 'หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการเสร็จสิ้น';
      } else if (code === 'auth/cancelled-popup-request') {
        message = 'มีคำขอเข้าสู่ระบบซ้ำซ้อน กรุณาลองใหม่อีกครั้ง';
      } else if (code === 'auth/unauthorized-domain') {
        message = 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Console กรุณากดเปิดใช้งานในแท็บใหม่ หรือเลือกโหมดทดลองใช้งาน';
      } else if (err?.message) {
        message = err.message;
      }
      
      setLoginError(message);
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        html: `<p class="text-sm text-slate-600">${message}</p><p class="text-xs text-amber-700 mt-2 font-medium">💡 เคล็ดลับ: หากใช้งานผ่าน iFrame ในหน้าทดสอบ สามารถกดปุ่ม <b>"เปิดในแท็บใหม่"</b> หรือกด <b>"เข้าใช้งานโหมดออฟไลน์ / ทดลองใช้งาน"</b> ได้ทันทีครับ</p>`,
        confirmButtonColor: '#0F172A',
        confirmButtonText: 'เข้าใจแล้ว',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEnterGuestMode = () => {
    // Enable guest offline preview mode
    localStorage.setItem('google_access_token', 'demo_offline_token');
    localStorage.setItem('google_access_token_timestamp', Date.now().toString());
    setNeedsAuth(false);
    Swal.fire({
      icon: 'info',
      title: 'เข้าสู่โหมดออฟไลน์ / พรีวิว',
      text: 'คุณสามารถทดลองใช้งานและบันทึกข้อมูลออฟไลน์ได้ ข้อมูลจะถูกจัดเก็บในเครื่องและรอซิงค์เมื่อเชื่อมต่อออนไลน์',
      confirmButtonColor: '#0F172A',
      confirmButtonText: 'เริ่มใช้งาน',
    });
  };

  const profile = useGoogleSheetsData<{rowIdx: number, data: UserProfile}>('Profile', (row, index) => {
    let parsedData = {};
    try {
      parsedData = row[1] ? JSON.parse(row[1]) : {};
    } catch (e) {
      console.warn("Could not parse profile row as JSON", row[1]);
    }
    return {
      rowIdx: index,
      data: parsedData
    };
  }, [needsAuth]);
  
  const official = useGoogleSheetsData<OfficialHistory>('Official History', (row, index) => ({
    id: `off_${index}`, rowIdx: index, timestamp: 0, date: row[0] || '', movement: row[1] || '', positionAndDept: row[2] || '', salary: Number(row[3]) || 0, referenceDoc: row[4] || '', type: '', level: '', positionNumber: ''
  }), [needsAuth]);

  const training = useGoogleSheetsData<TrainingHistory>('Training History', (row, index) => ({
    id: `trn_${index}`, rowIdx: index, timestamp: 0, year: row[0] || '', startDate: row[1] || '', endDate: row[2] || '', courseName: row[3] || '', organizer: row[4] || '', durationDays: Number(row[5]) || 0, referenceDoc: row[6] || ''
  }), [needsAuth]);

  const experience = useGoogleSheetsData<WorkExperience>('Work Experience', (row, index) => ({
    id: `exp_${index}`, rowIdx: index, timestamp: 0, duration: row[0] || '', role: row[1] || '', department: row[2] || '', documentRef: row[3] || ''
  }), [needsAuth]);

  const leave = useGoogleSheetsData<LeaveLog>('Leave History', (row, index) => ({
    id: `lea_${index}`, rowIdx: index, timestamp: 0, fiscalYear: row[0] || '', leaveType: row[1] || '', startDate: row[2] || '', endDate: row[3] || '', totalDays: Number(row[4]) || 1, reason: row[5] || '', referenceDoc: row[6] || ''
  }), [needsAuth]);

  const loading = official.loading || training.loading || experience.loading || profile.loading || leave.loading;
  
  // Safe extraction of profile data
  const profileData = profile.data.length > 0 ? profile.data[0].data : null;
  const profileRowIndex = profile.data.length > 0 ? profile.data[0].rowIdx : -1;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab profileData={profileData} loading={profile.loading} onSaveSuccess={profile.refetch} spreadsheetRowIndex={profileRowIndex} />;
      case 'official':
        return <OfficialHistoryTab logs={official.data} loading={official.loading} onSaveSuccess={official.refetch} />;
      case 'training':
        return <TrainingHistoryTab logs={training.data} loading={training.loading} onSaveSuccess={training.refetch} />;
      case 'experience':
        return <WorkExperienceTab logs={experience.data} loading={experience.loading} onSaveSuccess={experience.refetch} />;
      case 'leave':
        return <LeaveHistoryTab logs={leave.data} loading={leave.loading} onSaveSuccess={leave.refetch} />;
      case 'summary-pdf':
        return (
          <SummaryReportTab 
            profileData={profileData} 
            officialLogs={official.data} 
            trainingLogs={training.data} 
            experienceLogs={experience.data} 
            leaveLogs={leave.data} 
            loading={loading} 
          />
        );
      case 'search':
        return <SmartSearchTab officialLogs={official.data} trainingLogs={training.data} experienceLogs={experience.data} leaveLogs={leave.data} loading={loading} />;
      case 'documents':
        return <DocumentsTab />;
      case 'dashboard':
      default:
        return <Dashboard 
          officialCount={official.data.length} 
          trainingCount={training.data.length} 
          experienceCount={experience.data.length} 
          loading={loading} 
          officialLogs={official.data}
          trainingLogs={training.data}
          leaveLogs={leave.data}
          profileData={profileData}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenSummaryPdf={() => setActiveTab('summary-pdf')}
        />;
    }
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'หน้าหลัก / แดชบอร์ด';
      case 'profile': return 'ประวัติส่วนตัว';
      case 'official': return 'ประวัติรับราชการ';
      case 'training': return 'ประวัติการฝึกอบรม';
      case 'experience': return 'ประสบการณ์ทำงาน';
      case 'leave': return 'ประวัติการลา';
      case 'summary-pdf': return 'แบบสรุปประวัติข้าราชการ (ก.พ. 7 ย่อ / PDF)';
      case 'search': return 'ค้นหา & ติดแท็ก';
      case 'documents': return 'เอกสาร/รูปภาพ';
      default: return 'กระดานข้อมูล';
    }
  };


  if (needsAuth) {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        isLoggingIn={isLoggingIn} 
        onEnterGuestMode={handleEnterGuestMode}
        loginError={loginError}
      />
    );
  }

  const userStats = {
    officialCount: official.data.length,
    trainingCount: training.data.length,
    experienceCount: experience.data.length,
    leaveCount: leave.data.length,
  };

  const userName = profileData?.firstName && profileData?.lastName
    ? `${profileData.prefix || ''}${profileData.firstName} ${profileData.lastName}`
    : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A]">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenBackupModal={() => setBackupModalOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          activeTabLabel={getTabLabel()}
          profileData={profileData}
          setActiveTab={setActiveTab}
          onOpenBackupModal={() => setBackupModalOpen(true)}
        />

        {/* PWA & Offline Sync & Telegram Status Banner */}
        <OfflineSyncBanner 
          onSyncSuccess={() => {
            official.refetch();
            training.refetch();
            experience.refetch();
            leave.refetch();
          }}
          userStats={userStats}
          userName={userName}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24 lg:pb-12 flex flex-col justify-between">
          <div>
            {renderContent()}
          </div>
          <footer className="mt-8 py-4 px-6 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
            <span>พัฒนาโดย IT SSJ Satun 2569</span>
            <i className="fa-solid fa-code text-amber-600" aria-label="code icon"></i>
          </footer>
        </main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        officialData={official.data}
        trainingData={training.data}
        experienceData={experience.data}
        profileData={profileData}
      />
    </div>
  );
}


