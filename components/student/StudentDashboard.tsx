
import React, { useState, useMemo } from 'react';
import { User, Theme, Grade, Unit, StudentView } from '../../types';
import { getGradeById, getAllGrades } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import CourseView from './CourseView';
import Subscription from './Subscription';
import Profile from './Profile';
import HomeScreen from './HomeScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import StudentHomeScreen from './StudentHomeScreen';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

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
    // This now implicitly transitions to the curriculum view logic
    setActiveView('grades'); // Keep activeView consistent with the nav, logic inside will handle showing subject selection
  };

  const handleNavClick = (view: StudentView) => {
    if (view === 'grades') {
      // Reset curriculum selection when going to the grade list
      setViewingGrade(null);
      setSelectedUnit(null);
    }
    setActiveView(view);
  };
  
  const handleSubjectSelect = (unit: Unit) => {
    setSelectedUnit(unit);
  }

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <StudentHomeScreen onNavigateToGrades={() => setActiveView('grades')} />;
      case 'grades':
        if (viewingGrade) {
            if(selectedUnit) {
                return <CourseView grade={viewingGrade} unit={selectedUnit} onBack={() => setSelectedUnit(null)} />;
            }
            return <SubjectSelectionScreen 
                grade={viewingGrade} 
                onSubjectSelect={handleSubjectSelect} 
                onBack={() => {
                    setViewingGrade(null);
                }} 
            />
        }
        return <HomeScreen grades={allGrades} onSelectGrade={handleGradeSelect} />;
      case 'subscription':
        return <Subscription user={user} />;
      case 'profile':
        return <Profile user={user} onLogout={onLogout} theme={theme} setTheme={setTheme} />;
      default:
        // Fallback to home screen if view is unknown
        return <StudentHomeScreen onNavigateToGrades={() => setActiveView('grades')} />;
    }
  };

  return (
    <StudentLayout {...props} activeView={activeView} onNavClick={handleNavClick}>
      {renderContent()}
    </StudentLayout>
  );
};

export default StudentDashboard;