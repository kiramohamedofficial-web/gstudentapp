
import React, { useState, useMemo } from 'react';
import { User, Theme, Grade, Unit } from '../../types';
import { getGradeById, getAllGrades } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import CourseView from './CourseView';
import Subscription from './Subscription';
import Profile from './Profile';
import HomeScreen from './HomeScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type StudentView = 'home' | 'curriculum' | 'subscription' | 'profile';

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { user, theme, setTheme, onLogout } = props;
  const [activeView, setActiveView] = useState<StudentView>('home');
  
  const studentGrade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const allGrades = useMemo(() => getAllGrades(), []);

  const handleGradeSelect = (grade: Grade) => {
    setViewingGrade(grade);
    setSelectedUnit(null);
    setActiveView('curriculum');
  };

  const handleNavClick = (view: StudentView) => {
    if (view === 'curriculum') {
      setViewingGrade(studentGrade);
      setSelectedUnit(null); // Reset unit when navigating to curriculum section
    }
    setActiveView(view);
  };
  
  const handleSubjectSelect = (unit: Unit) => {
    setSelectedUnit(unit);
  }

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeScreen grades={allGrades} onSelectGrade={handleGradeSelect} />;
      case 'curriculum':
        if (!viewingGrade) {
          return (
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">لم يتم تحديد المنهج</h2>
              <p className="text-[var(--text-secondary)]">يرجى اختيار صف دراسي من الصفحة الرئيسية لعرض المنهج.</p>
            </div>
          );
        }
        if (!selectedUnit) {
            return (
                <SubjectSelectionScreen 
                    grade={viewingGrade} 
                    onSubjectSelect={handleSubjectSelect} 
                    onBack={() => {
                        setViewingGrade(null);
                        setActiveView('home');
                    }} 
                />
            );
        }
        return <CourseView grade={viewingGrade} unit={selectedUnit} onBack={() => setSelectedUnit(null)} />;
      case 'subscription':
        return <Subscription user={user} />;
      case 'profile':
        return <Profile user={user} onLogout={onLogout} theme={theme} setTheme={setTheme} />;
      default:
        return null;
    }
  };

  return (
    <StudentLayout {...props} activeView={activeView} onNavClick={handleNavClick}>
      {renderContent()}
    </StudentLayout>
  );
};

export default StudentDashboard;
