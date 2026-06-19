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
import { useGoogleSheetsData } from './hooks/useGoogleSheetsData';
import { initAuth, googleSignIn, getAccessToken } from './lib/googleAuth';
import { OfficialHistory, TrainingHistory, WorkExperience, UserProfile } from './types';
import { motion } from 'motion/react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
  
  const official = useGoogleSheetsData<OfficialHistory>('Official History', row => ({
    id: row[0], timestamp: 0, date: row[0], movement: row[1], positionAndDept: row[2], salary: Number(row[3]), referenceDoc: row[4], type: '', level: '', positionNumber: ''
  }), [needsAuth]);
  const training = useGoogleSheetsData<TrainingHistory>('Training History', row => ({
    id: row[0], timestamp: 0, year: row[0], startDate: row[1], endDate: row[2], courseName: row[3], organizer: row[4], durationDays: Number(row[5])
  }), [needsAuth]);
  const experience = useGoogleSheetsData<WorkExperience>('Work Experience', row => ({
    id: row[0], timestamp: 0, duration: row[0], role: row[1], department: row[2]
  }), [needsAuth]);

  const loading = official.loading || training.loading || experience.loading || profile.loading;
  
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
      case 'documents':
        return <DocumentsTab />;
      case 'dashboard':
      default:
        return <Dashboard 
          officialCount={official.data.length} 
          trainingCount={training.data.length} 
          experienceCount={experience.data.length} 
          loading={loading} 
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
      case 'documents': return 'เอกสาร/รูปภาพ';
      default: return 'กระดานข้อมูล';
    }
  };

  if (needsAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA] font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center max-w-sm w-full mx-4">
           <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-6">
              <i className="fa-solid fa-address-card text-3xl text-[#D4AF37]"></i>
           </div>
           <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">mootu LevelUp!</h1>
           <p className="text-sm text-slate-500 mb-8 text-center px-4">เข้าสู่ระบบเพื่อเชื่อมต่อกับ Google Sheets และบันทึกข้อมูลของคุณ</p>
           
           <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button hover:bg-slate-50 transition w-full max-w-[240px] flex items-center bg-white border border-slate-300 rounded overflow-hidden shadow">
              <div className="p-3 bg-white">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="flex-1 text-center font-medium font-sans text-slate-600 text-[14px]">
                 {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}
              </span>
           </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] text-[#1A1A1A] font-sans selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A]">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          activeTabLabel={getTabLabel()}
          profileData={profileData}
          setActiveTab={setActiveTab}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24 lg:pb-0">
          {renderContent()}
        </main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}


