import React, { useState, useMemo } from 'react';
import { User, Unit, Lesson, StudentView, Theme, Subscription } from '../../types';
import { getGradeById, getSubscriptionByUserId } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import CourseView from './CourseView';
import SubscriptionView from './Subscription';
import Profile from './Profile';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import StudentHomeScreen from './StudentHomeScreen';
import TeachersView from './TeachersView';
import CoursesStore from './CoursesStore';
import SingleSubjectSubscription from './SingleSubjectSubscription';
import ComprehensiveSubscription from './ComprehensiveSubscription';
import ResultsView from './ResultsView';
import { SparklesIcon } from '../common/Icons';
import ChatbotView from './ChatbotView';
import AskTheProfView from './AskTheProfView';
import AdhkarView from './AdhkarView';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { user, onLogout, theme, setTheme } = props;
  const [activeView, setActiveView] = useState<StudentView>('home');
  
  const studentGrade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [initialLesson, setInitialLesson] = useState<Lesson | null>(null);

  const handleNavClick = (view: StudentView) => {
    if (view === 'grades') {
      setSelectedUnit(null);
      setInitialLesson(null);
    }
    setActiveView(view);
  };
  
  const handleHomeNavigation = (view: StudentView, data?: { unit: Unit; lesson: Lesson }) => {
      if (view === 'grades' && data) {
          setSelectedUnit(data.unit);
          setInitialLesson(data.lesson);
          setActiveView('grades');
      } else {
          setActiveView(view);
      }
  };

  const handleSubjectSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setInitialLesson(null);
  }

  const renderContent = () => {
    if (activeView === 'grades' && !studentGrade) {
        return (
            <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                <p className="text-xl font-bold text-red-500">خطأ في عرض المنهج</p>
                <p className="text-[var(--text-secondary)] mt-2">لا يمكن العثور على بيانات الصف الدراسي الخاص بك. يرجى التواصل مع الدعم الفني.</p>
            </div>
        );
    }

    switch (activeView) {
      case 'home':
        return <StudentHomeScreen user={user} onNavigate={handleHomeNavigation} />;
      case 'grades':
        if (selectedUnit) {
            return <CourseView grade={studentGrade!} unit={selectedUnit} user={user} onBack={() => { setSelectedUnit(null); setInitialLesson(null); }} onNavigate={handleNavClick} initialLesson={initialLesson} />;
        }
        return <SubjectSelectionScreen 
            user={user}
            grade={studentGrade!} 
            onSubjectSelect={handleSubjectSelect} 
            onBack={() => setActiveView('home')} 
        />;
      case 'chatbot':
        return <ChatbotView user={user} subscription={subscription} onNavigate={setActiveView} />;
      case 'askTheProf':
        return <AskTheProfView user={user} />;
      case 'adhkar':
        return <AdhkarView />;
      case 'courses':
        return <CoursesStore />;
      case 'teachers':
        return <TeachersView />;
      case 'results':
        return <ResultsView user={user} />;
      case 'smartPlan':
        return (
            <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] flex flex-col items-center">
                <SparklesIcon className="w-16 h-16 text-purple-400 mb-4"/>
                <h2 className="text-2xl font-bold">الخطة الذكية.. قريبًا!</h2>
                <p className="text-[var(--text-secondary)] mt-2 max-w-md">نعمل على تطوير هذه الميزة لمساعدتك على تنظيم دراستك بفاعلية. ترقب التحديثات القادمة.</p>
            </div>
        );
      case 'subscription':
        return <SubscriptionView user={user} onNavigate={setActiveView} />;
      case 'singleSubjectSubscription':
        return <SingleSubjectSubscription user={user} onBack={() => setActiveView('subscription')} />;
      case 'comprehensiveSubscription':
        return <ComprehensiveSubscription user={user} onBack={() => setActiveView('subscription')} />;
      case 'profile':
        return <Profile user={user} onLogout={onLogout} theme={theme} setTheme={setTheme} />;
      default:
        return <StudentHomeScreen user={user} onNavigate={handleHomeNavigation} />;
    }
  };

  return (
    <StudentLayout 
        user={user}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
        activeView={activeView} 
        onNavClick={handleNavClick} 
        subscription={subscription}
        gradeName={studentGrade?.name}
    >
      {renderContent()}
    </StudentLayout>
  );
};

export default StudentDashboard;