import React, { useState, useEffect } from 'react';
import { Lesson, LessonType, Question, Grade, ToastType, Unit, Semester } from '../../types';
import { getAIExplanation } from '../../services/geminiService';
import Modal from '../common/Modal';
import { SparklesIcon } from '../common/Icons';
import CosmicLoader from '../common/Loader';
import { useToast } from '../../useToast';
import CustomYouTubePlayer from './CustomYouTubePlayer';

interface LessonViewProps {
  lesson: Lesson;
  onBack: () => void;
  grade: Grade;
  onLessonComplete: (lessonId: string) => void;
}

const Quiz: React.FC<{ questions: Question[] }> = ({ questions }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

    const handleSelect = (questionId: string, option: string) => {
        if (answeredQuestions.has(questionId)) return;
        setAnswers(prev => ({ ...prev, [questionId]: option }));
        setAnsweredQuestions(prev => new Set(prev).add(questionId));
    };

    const getButtonClass = (q: Question, option: string) => {
        const isAnswered = answeredQuestions.has(q.id);
        const isSelected = answers[q.id] === option;
        const isCorrect = q.correctAnswer === option;

        if (isAnswered) {
            if (isCorrect) return 'bg-green-500/30 border-green-500 text-[var(--text-primary)]';
            if (isSelected && !isCorrect) return 'bg-red-500/30 border-red-500 text-[var(--text-primary)]';
            return 'bg-[var(--bg-secondary)] border-transparent text-[var(--text-secondary)]';
        }

        return 'bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)]';
    };

    return (
        <div>
            {questions.map((q, index) => (
                <div key={q.id} className="mb-6 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] fade-in" style={{animationDelay: `${index * 100}ms`}}>
                    <p className="font-semibold mb-3 text-lg text-[var(--text-primary)]">{q.text}</p>
                    <div className="space-y-2">
                        {q.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleSelect(q.id, opt)}
                                disabled={answeredQuestions.has(q.id)}
                                className={`w-full text-right p-3 rounded-lg transition-all duration-300 border ${getButtonClass(q, opt)} disabled:cursor-not-allowed`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const LessonView: React.FC<LessonViewProps> = ({ lesson, onBack, grade, onLessonComplete }) => {
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAskAI = async () => {
        if (!aiQuestion.trim()) return;
        setIsLoading(true);
        setAiResponse('');
        setDisplayedResponse('');
        const response = await getAIExplanation(lesson.title, aiQuestion, grade.name);
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

                return (
                    <CustomYouTubePlayer
                        key={lesson.id}
                        initialLesson={lesson}
                        playlist={unitWithLesson?.lessons.filter(l => l.type === LessonType.EXPLANATION) || []}
                        onLessonComplete={onLessonComplete}
                    />
                );
            case LessonType.HOMEWORK:
            case LessonType.EXAM:
                return <Quiz questions={lesson.questions || []} />;
            case LessonType.SUMMARY:
                return <div className="p-6 bg-[var(--bg-primary)] rounded-lg prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />;
            default:
                return <p>المحتوى غير متوفر.</p>;
        }
    };
    
    return (
        <div className="text-[var(--text-primary)]">
            <button onClick={onBack} className="mb-6 text-[var(--accent-primary)] hover:underline">
                العودة إلى المنهج &rarr;
            </button>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold">{lesson.title}</h1>
                <button
                    onClick={() => setHelpModalOpen(true)}
                    className="flex items-center justify-center w-full md:w-auto px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    <SparklesIcon className="w-5 h-5 ml-2" />
                    اسأل المساعد الذكي
                </button>
            </div>
            <p className="text-lg text-[var(--text-secondary)] mb-6">{lesson.type}</p>
            
            {renderContent()}
            
            <Modal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} title="مساعد دكتور أحمد صابر الذكي">
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">هل تواجه صعوبة في مفهوم ما؟ اطرح سؤالاً يتعلق بـ "{lesson.title}".</p>
                    <textarea
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="اكتب سؤالك هنا..."
                        className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                        rows={3}
                    />
                    <button onClick={handleAskAI} disabled={isLoading} className="px-5 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-slate-500">
                        {isLoading ? 'جاري التفكير...' : 'احصل على شرح'}
                    </button>
                    {isLoading && <div className="text-center p-4">جاري تحميل الإجابة...</div>}
                    {aiResponse && (
                        <div className="p-4 mt-4 bg-slate-900/50 rounded-md border border-slate-700 min-h-[100px]">
                            <h4 className="font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">إليك الشرح:</h4>
                            <p className="whitespace-pre-wrap text-slate-300">{displayedResponse}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default LessonView;