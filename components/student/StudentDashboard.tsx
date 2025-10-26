import React, { useState, useMemo, useEffect } from 'react';
import { Unit, Lesson, StudentView, Theme } from '../../types';
import { getGradeById } from '../../services/storageService';
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
import { SparklesIcon, ArrowRightIcon } from '../common/Icons';
import ChatbotView from './ChatbotView';
import AskTheProfView from './AskTheProfView';
import AdhkarView from './AdhkarView';
import { useSession } from '../../hooks/useSession';

// --- NEW COMPONENT: CartoonMoviesView START ---
interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  tags: { text: string; color: string }[];
  embedSrc: string;
}

const movies: Movie[] = [
    { id: 1, title: 'مشاهدة فيلم Migration 2023', posterUrl: 'https://i.ibb.co/hZ2GzYp/migration-2023.jpg', tags: [{ text: 'BluRay', color: 'bg-blue-600' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: 'https://hglink.to/e/0bma2be18ao8' },
    { id: 2, title: 'فيلم الهجرة 2023 مدبلج', posterUrl: 'https://i.ibb.co/Dzd0pYL/migration-egypt.jpg', tags: [{ text: 'بالمصري', color: 'bg-red-700' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
    { id: 3, title: 'فيلم علاء الدين وملك اللصوص 3', posterUrl: 'https://i.ibb.co/bF9Fcfj/aladdin-3.jpg', tags: [{ text: 'مدبلج', color: 'bg-purple-600' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
    { id: 4, title: 'سلسلة افلام Aladdin مترجمة', posterUrl: 'https://i.ibb.co/51d6S9X/aladdin-1.jpg', tags: [{ text: '', color: '' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
    { id: 5, title: 'مشاهدة فيلم The Twits 2025 مترجم', posterUrl: 'https://i.ibb.co/71yPjkD/the-twits-1.jpg', tags: [{ text: 'WEB-DL', color: 'bg-green-600' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
    { id: 6, title: 'فيلم ال تويت مدبلج', posterUrl: 'https://i.ibb.co/Jqj8cSt/the-twits-2.jpg', tags: [{ text: 'مدبلج', color: 'bg-purple-600' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
    { id: 7, title: 'فيلم السنافر 2025 مدبلج بالمصري', posterUrl: 'https://i.ibb.co/QvLgX9j/smurfs.jpg', tags: [{ text: 'بالمصري', color: 'bg-red-700' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
    { id: 8, title: 'مشاهدة فيلم Thomas and Friends', posterUrl: 'https://i.ibb.co/P98qGzR/thomas.jpg', tags: [{ text: 'WEB-DL', color: 'bg-green-600' }, { text: 'افلام كرتون', color: 'bg-red-600' }], embedSrc: '' },
];

const MoviePlayerView: React.FC<{ movie: Movie; onBack: () => void }> = ({ movie, onBack }) => {
  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى قائمة الأفلام</span>
      </button>
      <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
      {movie.embedSrc ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-[var(--border-primary)]">
          <iframe 
            src={movie.embedSrc} 
            frameBorder="0" 
            marginWidth="0" 
            marginHeight="0" 
            scrolling="no" 
            width="100%" 
            height="100%" 
            allowFullScreen
            className="absolute top-0 left-0"
          ></iframe>
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-black flex items-center justify-center text-center text-gray-400">
          <p>عذرًا، محتوى الفيلم غير متوفر حاليًا.</p>
        </div>
      )}
    </div>
  );
};

const MovieCard: React.FC<{ movie: Movie; onClick: () => void; }> = ({ movie, onClick }) => (
  <button onClick={onClick} className="w-full bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden group flex flex-col text-right">
    <div className="relative">
      <img src={movie.posterUrl} alt={movie.title} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" />
      {movie.tags[0]?.text && (
         <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white rounded shadow-md ${movie.tags[0].color}`}>
            {movie.tags[0].text}
         </span>
      )}
    </div>
    <div className="p-3 text-center flex flex-col flex-grow justify-between">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex-grow">{movie.title}</h3>
      {movie.tags[1] && (
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-md mx-auto ${movie.tags[1].color}`}>
          {movie.tags[1].text}
        </span>
      )}
    </div>
  </button>
);

const CartoonMoviesView: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  if (selectedMovie) {
    return <MoviePlayerView movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;
  }
  
  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى الرئيسية</span>
      </button>
      <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">أفلام كرتون</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} onClick={() => setSelectedMovie(movie)} />
        ))}
      </div>
    </div>
  );
};
// --- NEW COMPONENT: CartoonMoviesView END ---

interface StudentDashboardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { theme, setTheme } = props;
  const { currentUser: user } = useSession();
  const [activeView, setActiveView] = useState<StudentView>('home');
  
  const studentGrade = useMemo(() => user ? getGradeById(user.grade) : null, [user]);
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
            return <CourseView grade={studentGrade!} unit={selectedUnit} onBack={() => { setSelectedUnit(null); setInitialLesson(null); }} onNavigate={handleNavClick} initialLesson={initialLesson} />;
        }
        return <SubjectSelectionScreen 
            user={user}
            grade={studentGrade!} 
            onSubjectSelect={handleSubjectSelect} 
            onBack={() => setActiveView('home')} 
        />;
      case 'cartoonMovies':
        return <CartoonMoviesView onBack={() => setActiveView('home')} />;
      case 'chatbot':
        return <ChatbotView onNavigate={setActiveView} />;
      case 'askTheProf':
        return <AskTheProfView />;
      case 'adhkar':
        return <AdhkarView />;
      case 'courses':
        return <CoursesStore />;
      case 'teachers':
        return <TeachersView />;
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
      {renderContent()}
    </StudentLayout>
  );
};

export default StudentDashboard;
