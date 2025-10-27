import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Unit, Lesson, StudentView, Theme, Teacher, Course } from '../../types';
import { getGradeById } from '../../services/storageService';
import StudentLayout from '../layout/StudentLayout';
import { SparklesIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import Loader from '../common/Loader';

// Lazy load all view components for performance optimization
const CourseView = lazy(() => import('./CourseView'));
const SubscriptionView = lazy(() => import('./Subscription'));
const Profile = lazy(() => import('./Profile'));
const SubjectSelectionScreen = lazy(() => import('./SubjectSelectionScreen'));
const StudentHomeScreen = lazy(() => import('./StudentHomeScreen'));
const TeachersView = lazy(() => import('./TeachersView'));
const TeacherProfileView = lazy(() => import('./TeacherProfileView'));
const CoursesStore = lazy(() => import('./CoursesStore'));
const SingleSubjectSubscription = lazy(() => import('./SingleSubjectSubscription'));
const ComprehensiveSubscription = lazy(() => import('./ComprehensiveSubscription'));
const ResultsView = lazy(() => import('./ResultsView'));
const ChatbotView = lazy(() => import('./ChatbotView'));
const AskTheProfView = lazy(() => import('./AskTheProfView'));
const AdhkarView = lazy(() => import('./AdhkarView'));
const CartoonMoviesView = lazy(() => import('./CartoonMoviesView'));
const CourseDetailView = lazy(() => import('./CourseDetailView'));


interface StudentDashboardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SuspenseLoader: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center">
        <Loader />
    </div>
);

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { theme, setTheme } = props;
  const { currentUser: user } = useSession();
  const [activeView, setActiveView] = useState<StudentView>('home');
  
  const studentGrade = useMemo(() => user ? getGradeById(user.grade) : null, [user]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [initialLesson, setInitialLesson] = useState<Lesson | null>(null);

  const handleNavClick = (view: StudentView) => {
    setSelectedUnit(null);
    setInitialLesson(null);
    setSelectedTeacher(null);
    setSelectedCourse(null);
    setActiveView(view);
  };
  
  const handleHomeNavigation = (view: StudentView, data?: { unit?: Unit; lesson?: Lesson; teacher?: Teacher; course?: Course; }) => {
      if (view === 'grades' && data?.unit) {
          setSelectedUnit(data.unit);
          setInitialLesson(data.lesson);
          setActiveView('grades');
      } else if (view === 'teacherProfile' && data?.teacher) {
        setSelectedTeacher(data.teacher);
        setActiveView('teacherProfile');
      } else if (view === 'courseDetail' && data?.course) {
        setSelectedCourse(data.course);
        setActiveView('courseDetail');
      } else {
          setActiveView(view);
      }
  };

  const handleSubjectSelect = (unit: Unit) => {
    setSelectedUnit(unit);
    setInitialLesson(null);
  }

  const handleCourseSelectFromTeacher = (unit: Unit) => {
    setSelectedUnit(unit);
    setInitialLesson(null);
    setActiveView('grades');
  };
  
  if (!user) {
    // This should technically not happen if App routing is correct, but it's a good safeguard.
    return <div>Loading user...</div>;
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
      case 'teacherProfile':
        return selectedTeacher ? (
            <TeacherProfileView
                teacher={selectedTeacher}
                user={user}
                onBack={() => {
                    setSelectedTeacher(null);
                    setActiveView('teachers');
                }}
                onNavigateToCourse={handleCourseSelectFromTeacher}
            />
        ) : (
            <div className="text-center p-8">لم يتم اختيار مدرس. الرجاء العودة واختيار مدرس.</div>
        );
      case 'courseDetail':
        return selectedCourse ? (
            <CourseDetailView
                course={selectedCourse}
                onBack={() => {
                    setSelectedCourse(null);
                    setActiveView('courses');
                }}
            />
        ) : (
            <div className="text-center p-8">لم يتم اختيار كورس. الرجاء العودة واختيار كورس.</div>
        );
      case 'cartoonMovies':
        return <CartoonMoviesView onBack={() => setActiveView('home')} />;
      case 'chatbot':
        return <ChatbotView onNavigate={setActiveView} />;
      case 'askTheProf':
        return <AskTheProfView />;
      case 'adhkar':
        return <AdhkarView />;
      case 'courses':
        return <CoursesStore onNavigate={handleHomeNavigation} />;
      case 'teachers':
        return <TeachersView onSelectTeacher={(teacher) => handleHomeNavigation('teacherProfile', { teacher })} />;
      case 'results':
        return <ResultsView />;
      case 'smartPlan':
        return (
            <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] flex flex-col items-center">
                <SparklesIcon className="w-16 h-16 text-purple-400 mb-4"/>
                <h2 className="text-2xl font-bold">الخطة الذكية.. قريبًا!</h2>
                <p className="text-[var(--text-secondary)] mt-2 max-w-md">نعمل على تطوير هذه الميزة لمساعدتك على تنظيم دراستك بفاعلية. ترقب التحديثات القادمة.</p>
            </div>
        );
      case 'subscription':
        return <SubscriptionView onNavigate={setActiveView} />;
      case 'singleSubjectSubscription':
        return <SingleSubjectSubscription onBack={() => setActiveView('subscription')} />;
      case 'comprehensiveSubscription':
        return <ComprehensiveSubscription onBack={() => setActiveView('subscription')} />;
      case 'profile':
        return <Profile theme={theme} setTheme={setTheme} />;
      default:
        return <StudentHomeScreen user={user} onNavigate={handleHomeNavigation} />;
    }
  };

  return (
    <StudentLayout 
        theme={theme}
        setTheme={setTheme}
        activeView={activeView} 
        onNavClick={handleNavClick} 
        gradeName={studentGrade?.name}
    >
      <Suspense fallback={<SuspenseLoader />}>
        {renderContent()}
      </Suspense>
    </StudentLayout>
  );
};

export default StudentDashboard;