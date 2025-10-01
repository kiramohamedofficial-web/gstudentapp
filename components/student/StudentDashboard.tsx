import React, { useState, useMemo } from 'react';
import { User, Theme, Grade } from '../../types';
import { getGradeById, getAllGrades } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import CourseView from './CourseView';
import Subscription from './Subscription';
import Profile from './Profile';
import HomeScreen from './HomeScreen';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type StudentView = 'home' | 'curriculum' | 'subscription' | 'profile';

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { user } = props;
  const [activeView, setActiveView] = useState<StudentView>('home');
  
  const studentGrade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(studentGrade);
  const allGrades = useMemo(() => getAllGrades(), []);

  const handleGradeSelect = (grade: Grade) => {
    setViewingGrade(grade);
    setActiveView('curriculum');
  };

  const handleNavClick = (view: StudentView) => {
    if (view === 'curriculum') {
      setViewingGrade(studentGrade);
    }
    setActiveView(view);
  };

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
        return <CourseView grade={viewingGrade} />;
      case 'subscription':
        return <Subscription user={user} />;
      case 'profile':
        return <Profile user={user} />;
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