import React, { useState, useEffect } from 'react';
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
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  useEffect(() => {
    initAuth(
      () => setNeedsAuth(false),
      () => setNeedsAuth(true)
    );
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
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
          profileData={profileData}
          onOpenProfile={() => setActiveTab('profile')}
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
      case 'search': return 'ค้นหา & ติดแท็ก';
      case 'documents': return 'เอกสาร/รูปภาพ';
      default: return 'กระดานข้อมูล';
    }
  };


  if (needsAuth) {
    return <LoginPage onLogin={handleLogin} isLoggingIn={isLoggingIn} />;
  }

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


