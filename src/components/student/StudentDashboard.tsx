


import React, { useState, useMemo, useEffect } from 'react';
import { User, Unit, StudentView } from '../../types';
import { getGradeById, generateSubscriptionNotifications } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import CourseView from './CourseView';
import Subscription from './Subscription';
import Profile from './Profile';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import StudentHomeScreen from './StudentHomeScreen';
import ResultsView from './ResultsView';
import StudyPlanView from './StudyPlanView';
import TeachersView from './TeachersView';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { user, onLogout } = props;
  const [activeView, setActiveView] = useState<StudentView>('home');
  const [subscriptionTarget, setSubscriptionTarget] = useState<Unit | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  const studentGrade = useMemo(() => getGradeById(user.grade), [user.grade]);

  // Generate notifications on initial load
  useEffect(() => {
    generateSubscriptionNotifications(user.id);
  }, [user.id]);

  const handleNavClick = (view: StudentView) => {
    setSelectedUnit(null);
    setSubscriptionTarget(null); // Clear target when navigating manually
    setSelectedTeacherId(null);
    setActiveView(view);
  };
  
  const handleSubjectSelect = (unit: Unit) => {
    setSelectedUnit(unit);
  }

  const handleSubscriptionNeeded = (unit: Unit) => {
    setSubscriptionTarget(unit);
    setActiveView('subscription');
  };

  const handleBackToSubjects = () => {
    setSubscriptionTarget(null);
    setActiveView('grades');
  };

  const handleSelectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setActiveView('grades');
  };

  const handleClearTeacherFilter = () => {
    setSelectedTeacherId(null);
  };


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
            return <CourseView grade={studentGrade!} unit={selectedUnit} user={user} onBack={() => setSelectedUnit(null)} onSubscriptionNeeded={handleSubscriptionNeeded} />;
        }
        return <SubjectSelectionScreen 
            user={user}
            grade={studentGrade!} 
            onSubjectSelect={handleSubjectSelect} 
            onBack={() => setActiveView('home')} 
            teacherId={selectedTeacherId}
            onClearTeacherFilter={handleClearTeacherFilter}
        />
      case 'teachers':
        return <TeachersView onSelectTeacher={handleSelectTeacher} />;
      case 'results':
        return <ResultsView user={user} />;
      case 'studyPlan':
        return <StudyPlanView user={user} />;
      case 'subscription':
        return <Subscription user={user} targetUnit={subscriptionTarget} onBackToSubjects={handleBackToSubjects} />;
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
