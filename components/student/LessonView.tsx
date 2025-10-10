import React, { useState, useEffect, useMemo } from 'react';
import { Lesson, LessonType, Grade, User } from '../../types';
import { getAIExplanation } from '../../services/geminiService';
import Modal from '../common/Modal';
import { SparklesIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import CustomYouTubePlayer from './CustomYouTubePlayer';
import QuizTaker from './QuizTaker';

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

    const subjectTitle = useMemo(() => {
        for (const semester of grade.semesters) {
            for (const unit of semester.units) {
                if (unit.lessons.some(l => l.id === lesson.id)) {
                    return unit.title;
                }
            }
        }
        return lesson.title; // Fallback to lesson title
    }, [grade, lesson]);


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
        switch (lesson.type) {
            case LessonType.EXPLANATION:
                const unitWithLesson = grade.semesters
                    .flatMap(s => s.units)
                    .find(u => u.lessons.some(l => l.id === lesson.id));
                
                if(!lesson.content) {
                    return <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-lg">المحتوى غير متوفر لهذا الدرس بعد.</div>
                }

                return (
                    <CustomYouTubePlayer
                        key={lesson.id}
                        initialLesson={lesson}
                        playlist={unitWithLesson?.lessons.filter(l => l.type === LessonType.EXPLANATION && l.content) || []}
                        onLessonComplete={onLessonComplete}
                    />
                );
            case LessonType.HOMEWORK:
            case LessonType.EXAM:
                return <QuizTaker lesson={lesson} user={user} onComplete={onLessonComplete} />;
            case LessonType.SUMMARY:
                return <div className="p-6 bg-[var(--bg-secondary)] rounded-lg prose" dangerouslySetInnerHTML={{ __html: lesson.content }} />;
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
                <h1 className="text-3xl md:text-4xl font-bold">{lesson.title}</h1>
                <button
                    onClick={() => setHelpModalOpen(true)}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    <SparklesIcon className="w-5 h-5 ml-2" />
                    اسأل المساعد الذكي
                </button>
            </div>
            <p className="text-lg text-[var(--text-secondary)] mb-6">{lesson.type} - {subjectTitle}</p>
            
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