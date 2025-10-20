import React, { useState, useMemo } from 'react';
import { User, Unit, StudentView } from '../../types';
import { getGradeById } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import CourseView from './CourseView';
import Subscription from './Subscription';
import Profile from './Profile';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import StudentHomeScreen from './StudentHomeScreen';
import AskTheProfView from './AskTheProfView';
import ResultsView from './ResultsView';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { user, onLogout } = props;
  const [activeView, setActiveView] = useState<StudentView>('home');
  
  const studentGrade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const handleNavClick = (view: StudentView) => {
    if (view === 'grades') {
      setSelectedUnit(null);
    }
    setActiveView(view);
  };
  
  const handleSubjectSelect = (unit: Unit) => {
    setSelectedUnit(unit);
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
        return <StudentHomeScreen user={user} onNavigate={setActiveView} />;
      case 'grades':
        if (selectedUnit) {
            return <CourseView grade={studentGrade!} unit={selectedUnit} user={user} onBack={() => setSelectedUnit(null)} />;
        }
        return <SubjectSelectionScreen 
            user={user}
            grade={studentGrade!} 
            onSubjectSelect={handleSubjectSelect} 
            onBack={() => setActiveView('home')} 
        />
      case 'results':
        return <ResultsView user={user} />;
      case 'ask':
        return <AskTheProfView user={user} />;
      case 'subscription':
        return <Subscription user={user} />;
      case 'profile':
        return <Profile user={user} onLogout={onLogout} />;
      default:
        return <StudentHomeScreen user={user} onNavigate={setActiveView} />;
    }
  };

  return (
    <StudentLayout {...props} activeView={activeView} onNavClick={handleNavClick}>
      {renderContent()}
    </StudentLayout>
  );
};

export default StudentDashboard;