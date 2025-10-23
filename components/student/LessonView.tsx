import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson, LessonType, Grade, User, StudentView } from '../../types';
import { getAIExplanation } from '../../services/geminiService';
import Modal from '../common/Modal';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, ArrowLeftIcon, LockClosedIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import QuizTaker from './QuizTaker';
import CustomYouTubePlayer from './CustomYouTubePlayer';
import { getSubscriptionByUserId } from '../../services/storageService';

interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  grade: Grade;
  user: User;
  onLessonComplete: (lessonId: string) => void;
  onNavigate: (view: StudentView) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, onBack, grade, user, onLessonComplete, onNavigate }) => {
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Manage current lesson state for playlist navigation
    const [currentLesson, setCurrentLesson] = useState(lesson);
    
    // Update current lesson if the initial lesson prop changes
    useEffect(() => {
        setCurrentLesson(lesson);
    }, [lesson]);

    const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);

    const hasActiveSubscription = useMemo(() => {
        if (!subscription || subscription.status !== 'Active') return false;
        return new Date(subscription.endDate) >= new Date();
    }, [subscription]);

    const subjectTitle = useMemo(() => {
        for (const semester of grade.semesters) {
            for (const unit of semester.units) {
                if (unit.lessons.some(l => l.id === currentLesson.id)) {
                    return unit.title;
                }
            }
        }
        return currentLesson.title; // Fallback to lesson title
    }, [grade, currentLesson]);

    const playlist = useMemo(() => {
        const unitWithLesson = grade.semesters
            .flatMap(s => s.units)
            .find(u => u.lessons.some(l => l.id === lesson.id));
        return unitWithLesson?.lessons.filter(l => l.type === LessonType.EXPLANATION && l.content) || [];
    }, [grade, lesson.id]);
    
    const currentPlaylistIndex = useMemo(() => playlist.findIndex(l => l.id === currentLesson.id), [playlist, currentLesson]);

    const playNext = useCallback(() => {
        if (currentPlaylistIndex < playlist.length - 1) {
            setCurrentLesson(playlist[currentPlaylistIndex + 1]);
        }
    }, [currentPlaylistIndex, playlist]);

    const playPrev = () => {
        if (currentPlaylistIndex > 0) {
            setCurrentLesson(playlist[currentPlaylistIndex - 1]);
        }
    };

    const handleAskAI = async () => {
        if (!aiQuestion.trim()) return;
        setIsLoading(true);
        setAiResponse('');
        setDisplayedResponse('');
        const response = await getAIExplanation(subjectTitle, aiQuestion, grade.name);
        setAiResponse(response);
        setIsLoading(false);
    };

    useEffect(() => {
      if (aiResponse && displayedResponse.length < aiResponse.length) {
          const timeoutId = setTimeout(() => {
              setDisplayedResponse(aiResponse.slice(0, displayedResponse.length + 1));
          }, 25);
          return () => clearTimeout(timeoutId);
      }
    }, [aiResponse, displayedResponse]);

    const renderContent = () => {
        if (currentLesson.type === LessonType.EXPLANATION && !hasActiveSubscription) {
            return (
                <div className="relative w-full max-w-4xl mx-auto aspect-video bg-gradient-to-br from-[rgba(var(--bg-secondary-rgb),0.5)] to-[rgba(var(--bg-primary-rgb),0.5)] rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col items-center justify-center p-8 text-center overflow-hidden backdrop-blur-lg">
                    {/* Glows */}
                    <div className="absolute -top-1/4 -right-1/4 w-72 h-72 bg-purple-600/30 rounded-full filter blur-3xl animate-blob"></div>
                    <div className="absolute -bottom-1/4 -left-1/4 w-72 h-72 bg-sky-600/30 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="p-4 bg-gray-700/50 rounded-full mb-6 border-2 border-gray-600 inline-block">
                            <LockClosedIcon className="w-12 h-12 text-purple-400" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white mb-3">محتوى حصري للمشتركين</h2>
                        <p className="text-gray-300 mb-8 max-w-lg mx-auto">
                            للوصول إلى هذا الدرس وجميع مميزات المنصة، يرجى تفعيل اشتراكك. استثمر في مستقبلك اليوم!
                        </p>
                        <button 
                            onClick={() => onNavigate('subscription')}
                            className="inline-flex items-center justify-center group px-8 py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg 
                                       hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50
                                       transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/40"
                        >
                            <span>الذهاب إلى صفحة الاشتراك</span>
                            <ArrowLeftIcon className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:-translate-x-1" />
                        </button>
                    </div>
                </div>
            );
        }

        switch (currentLesson.type) {
            case LessonType.EXPLANATION:
                if(!currentLesson.content) {
                    return <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-lg">المحتوى غير متوفر لهذا الدرس بعد.</div>
                }

                return (
                   <div className="max-w-4xl mx-auto">
                        <CustomYouTubePlayer
                            key={currentLesson.id}
                            videoId={currentLesson.content}
                            onLessonComplete={() => onLessonComplete(currentLesson.id)}
                            onAutoPlayNext={playNext}
                        />
                         <div className="flex justify-between items-center mt-4 px-1 md:px-2">
                            <button onClick={playPrev} disabled={currentPlaylistIndex <= 0} className="flex items-center space-x-1 md:space-x-2 space-x-reverse px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5"/>
                                <span className="hidden sm:inline">الدرس السابق</span>
                                <span className="sm:hidden">السابق</span>
                            </button>
                            <div className="text-center flex-1 min-w-0 px-2 md:px-4">
                                <p className="font-bold text-base md:text-lg text-[var(--text-primary)] truncate">{currentLesson.title}</p>
                                <p className="text-xs md:text-sm text-[var(--text-secondary)]">{`${currentPlaylistIndex + 1} / ${playlist.length}`}</p>
                            </div>
                            <button onClick={playNext} disabled={currentPlaylistIndex >= playlist.length - 1} className="flex items-center space-x-1 md:space-x-2 space-x-reverse px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <span className="hidden sm:inline">الدرس التالي</span>
                                 <span className="sm:hidden">التالي</span>
                                <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5"/>
                            </button>
                        </div>
                   </div>
                );
            case LessonType.HOMEWORK:
            case LessonType.EXAM:
                return <QuizTaker lesson={currentLesson} user={user} onComplete={onLessonComplete} />;
            case LessonType.SUMMARY:
                return <div className="p-6 bg-[var(--bg-secondary)] rounded-lg prose" dangerouslySetInnerHTML={{ __html: currentLesson.content }} />;
            default:
                return <p>المحتوى غير متوفر.</p>;
        }
    };
    
    return (
        <div className="text-[var(--text-primary)] max-w-7xl mx-auto">
            <button onClick={onBack} className="mb-6 text-[var(--accent-primary)] hover:underline">
                &rarr; العودة إلى المنهج
            </button>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold">{currentLesson.title}</h1>
                <button
                    onClick={() => setHelpModalOpen(true)}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    <SparklesIcon className="w-5 h-5 ml-2" />
                    اسأل المساعد الذكي
                </button>
            </div>
            <p className="text-lg text-[var(--text-secondary)] mb-6">{currentLesson.type} - {subjectTitle}</p>
            
            {renderContent()}
            
            <Modal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} title="المساعد الذكي">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)]">هل تواجه صعوبة في مفهوم ما؟ اطرح سؤالاً يتعلق بمادة "{subjectTitle}".</p>
                    <textarea
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="اكتب سؤالك هنا..."
                        className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                    />
                    <button onClick={handleAskAI} disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                        {isLoading ? 'جاري التفكير...' : 'احصل على شرح'}
                    </button>
                    {isLoading && <div className="text-center p-4">جاري تحميل الإجابة...</div>}
                    {aiResponse && (
                        <div className="p-4 mt-4 bg-[var(--bg-primary)] rounded-md border border-[var(--border-primary)] min-h-[100px]">
                            <h4 className="font-semibold mb-2 text-blue-600">إليك الشرح:</h4>
                            <p className="whitespace-pre-wrap text-[var(--text-primary)]">{displayedResponse}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default LessonView;