import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson, LessonType, Grade, User } from '../../types';
import { getAIExplanation } from '../../services/geminiService';
import Modal from '../common/Modal';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import QuizTaker from './QuizTaker';
import CustomYouTubePlayer from './CustomYouTubePlayer';

interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  grade: Grade;
  user: User;
  onLessonComplete: (lessonId: string) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, onBack, grade, user, onLessonComplete }) => {
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

    useEffect(() => {
        if (currentLesson.type === LessonType.SUMMARY) {
            onLessonComplete(currentLesson.id);
        }
    }, [currentLesson, onLessonComplete]);

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
                         <div className="flex justify-between items-center mt-4 px-2">
                            <button onClick={playPrev} disabled={currentPlaylistIndex <= 0} className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronRightIcon className="w-5 h-5"/>
                                <span>الدرس السابق</span>
                            </button>
                            <div className="text-center flex-1 min-w-0 px-4">
                                <p className="font-bold text-lg text-[var(--text-primary)] truncate">{currentLesson.title}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{`${currentPlaylistIndex + 1} / ${playlist.length}`}</p>
                            </div>
                            <button onClick={playNext} disabled={currentPlaylistIndex >= playlist.length - 1} className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <span>الدرس التالي</span>
                                <ChevronLeftIcon className="w-5 h-5"/>
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