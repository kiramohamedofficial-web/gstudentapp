import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson, User, QuizAttempt, QuizType, QuizQuestion } from '../../types';
import { getLatestQuizAttemptForLesson, saveQuizAttempt } from '../../services/storageService';
import { ClockIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon, BookOpenIcon, PencilIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';

interface QuizTakerProps {
  lesson: Lesson;
  onComplete: (lessonId: string) => Promise<void>;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ lesson, onComplete }) => {
    const { currentUser: user } = useSession();
    const [view, setView] = useState<'start' | 'taking' | 'result'>('start');
    const [imageAnswers, setImageAnswers] = useState<string[]>([]);
    const [mcqAnswers, setMcqAnswers] = useState<{ [key: number]: number }>({});
    const [timeLeft, setTimeLeft] = useState(lesson.timeLimit ? lesson.timeLimit * 60 : 0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null | undefined>(undefined);
    
    useEffect(() => {
        if (!user) return;
        const fetchPreviousAttempt = async () => {
            const attempt = await getLatestQuizAttemptForLesson(user.id, lesson.id);
            setCurrentAttempt(attempt);
            if (attempt) {
                setView('result');
            }
        };
        fetchPreviousAttempt();
    }, [user, lesson.id]);

    const handleSubmit = useCallback(async () => {
        if (!user) return;
        
        let score = 0;
        let submittedAnswers: QuizAttempt['submittedAnswers'] = {};
        const passingScore = lesson.passingScore ?? 50;
        
        if (lesson.quizType === QuizType.MCQ && lesson.questions) {
            submittedAnswers = mcqAnswers;
            const correctCount = lesson.questions.reduce((count, question, index) => {
                return count + (question.correctAnswerIndex === mcqAnswers[index] ? 1 : 0);
            }, 0);
            score = lesson.questions.length > 0 ? Math.round((correctCount / lesson.questions.length) * 100) : 100;

        } else { // Image-based quiz
             submittedAnswers = imageAnswers;
             const correctAnswers = lesson.correctAnswers || [];
             if (correctAnswers.length === 0) return;
             const correctCount = imageAnswers.filter(ans => 
                 correctAnswers.some(correctAns => correctAns.trim().toLowerCase() === ans.trim().toLowerCase())
             ).length;
             score = Math.round((correctCount / correctAnswers.length) * 100);
        }

        const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
        const isPass = score >= passingScore;

        await saveQuizAttempt(user.id, lesson.id, score, submittedAnswers, timeTaken);
        
        if (isPass) {
            await onComplete(lesson.id);
        }

        const newAttemptData = await getLatestQuizAttemptForLesson(user.id, lesson.id);
        if(newAttemptData) setCurrentAttempt(newAttemptData);
        
        setView('result');
    }, [imageAnswers, mcqAnswers, lesson, user, startTime, onComplete]);

    useEffect(() => {
        if (view !== 'taking' || !lesson.timeLimit) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [view, lesson.timeLimit, handleSubmit]);
    
    if (!user) return null;

    const startQuiz = () => {
        setView('taking');
        setStartTime(Date.now());
    };
    
    const retakeQuiz = () => {
        setCurrentAttempt(null);
        setImageAnswers([]);
        setMcqAnswers({});
        setTimeLeft(lesson.timeLimit ? lesson.timeLimit * 60 : 0);
        setView('start');
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    const isMcq = lesson.quizType === QuizType.MCQ && lesson.questions && lesson.questions.length > 0;
    const isImageQuiz = lesson.quizType === QuizType.IMAGE && lesson.imageUrl;

    if (!isMcq && !isImageQuiz) {
         return (
            <div className="bg-[var(--bg-secondary)] p-8 rounded-xl shadow-md border border-[var(--border-primary)] text-center flex flex-col items-center">
                <DocumentTextIcon className="w-16 h-16 text-[var(--text-secondary)] opacity-50 mb-4" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">المحتوى غير متوفر</h2>
                <p className="text-[var(--text-secondary)]">لم يقم المسؤول برفع محتوى لهذا الواجب أو الامتحان بعد.</p>
            </div>
        );
    }
    
    if (currentAttempt === undefined) {
        return <div className="text-center p-8">جاري تحميل بيانات الاختبار...</div>;
    }

    // Start Screen
    if (view === 'start') {
        const numQuestions = isMcq ? lesson.questions?.length : lesson.correctAnswers?.length;
        return (
            <div className="bg-[var(--bg-secondary)] p-8 rounded-xl shadow-md border border-[var(--border-primary)] text-center flex flex-col items-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">أنت على وشك البدء</h2>
                <p className="text-lg font-bold text-[var(--accent-primary)] mb-4">{lesson.title}</p>
                <div className="text-[var(--text-secondary)] space-y-2 mb-8">
                    <p>عدد الأسئلة: {numQuestions || 0}</p>
                    {lesson.timeLimit && <p>الوقت المحدد: {lesson.timeLimit} دقيقة</p>}
                    {lesson.passingScore && <p>درجة النجاح: {lesson.passingScore}%</p>}
                </div>
                <button onClick={startQuiz} className="px-8 py-3 font-bold text-white bg-blue-600 rounded-lg transition-transform transform hover:scale-105">
                    ابدأ الآن
                </button>
            </div>
        );
    }
    
    // Result Screen
    if (view === 'result' && currentAttempt) {
        const { score, isPass, submittedAnswers = {}, timeTaken } = currentAttempt;
        return (
             <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <div className="text-center mb-6 pb-6 border-b border-[var(--border-primary)]">
                    <h2 className="text-3xl font-bold mb-2">النتيجة</h2>
                    <p className={`text-5xl font-extrabold ${isPass ? 'text-green-500' : 'text-red-500'}`}>{score}%</p>
                    <p className={`mt-2 font-semibold text-lg ${isPass ? 'text-green-500' : 'text-red-500'}`}>
                        {isPass ? 'أحسنت! لقد نجحت.' : 'حظ أفضل في المرة القادمة.'}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">الوقت المستغرق: {formatTime(timeTaken)}</p>
                </div>

                {isMcq && lesson.questions && (
                    <div className="space-y-6">
                        {lesson.questions.map((q, qIndex) => {
                            const studentAnswerIndex = (submittedAnswers as { [key: number]: number })[qIndex];
                            const isCorrect = q.correctAnswerIndex === studentAnswerIndex;
                            return (
                                <div key={qIndex} className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                                    <p className="font-semibold mb-3">{qIndex + 1}. {q.questionText}</p>
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIndex) => {
                                            const isSelected = studentAnswerIndex === optIndex;
                                            const isCorrectAnswer = q.correctAnswerIndex === optIndex;
                                            let stateStyle = 'border-transparent';
                                            if (isSelected && !isCorrect) stateStyle = 'border-red-500 bg-red-500/10 text-red-300';
                                            if (isCorrectAnswer) stateStyle = 'border-green-500 bg-green-500/10 text-green-300';
                                            return (
                                                <div key={optIndex} className={`flex items-center p-2 rounded-md border-2 ${stateStyle}`}>
                                                    {isCorrectAnswer ? <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2"/> : isSelected ? <XCircleIcon className="w-5 h-5 text-red-500 mr-2"/> : <div className="w-5 h-5 mr-2"/>}
                                                    <span>{opt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isImageQuiz && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">الصورة</h3>
                            <img src={lesson.imageUrl} alt="Quiz content" className="rounded-lg border border-[var(--border-primary)] max-w-full h-auto" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                                <h4 className="font-semibold mb-3 text-[var(--text-primary)]">إجاباتك</h4>
                                <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                                    {(submittedAnswers as string[]).map((ans, i) => <li key={i}>{ans || "-"}</li>)}
                                </ul>
                            </div>
                            <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                                <h4 className="font-semibold mb-3 text-green-400">الإجابات الصحيحة</h4>
                                <ul className="list-disc list-inside space-y-1 text-green-300">
                                    {(lesson.correctAnswers || []).map((ans, i) => <li key={i}>{ans}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                 <div className="text-center mt-8">
                     <button onClick={retakeQuiz} className="px-6 py-2 font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg transition-colors">
                        إعادة المحاولة
                    </button>
                 </div>
            </div>
        );
    }

    // Taking Quiz Screen
    return (
        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{lesson.title}</h2>
                {lesson.timeLimit && (
                    <div className="flex items-center space-x-2 space-x-reverse px-3 py-1 bg-red-500/10 text-red-400 font-bold rounded-full text-lg">
                        <ClockIcon className="w-5 h-5"/>
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>
            
            {isMcq && lesson.questions && (
                <div className="space-y-6">
                    {lesson.questions.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                            <p className="font-semibold mb-4 text-lg">{qIndex + 1}. {q.questionText}</p>
                            <div className="space-y-3">
                                {q.options.map((opt, optIndex) => (
                                    <label key={optIndex} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border-2 ${mcqAnswers[qIndex] === optIndex ? 'border-purple-500 bg-purple-500/10' : 'border-transparent hover:bg-white/5'}`}>
                                        <input type="radio" name={`q_${qIndex}`} value={optIndex} checked={mcqAnswers[qIndex] === optIndex} onChange={() => setMcqAnswers(prev => ({ ...prev, [qIndex]: optIndex }))} className="w-5 h-5 text-purple-600 focus:ring-purple-500" />
                                        <span className="mr-3">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {isImageQuiz && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">اقرأ الأسئلة من الصورة ثم أجب:</h3>
                        <img src={lesson.imageUrl} alt="Quiz content" className="rounded-lg border border-[var(--border-primary)] max-w-full h-auto" />
                    </div>
                    <div>
                        <label htmlFor="student-answers" className="block font-semibold text-[var(--text-secondary)] mb-2">اكتب إجاباتك هنا:</label>
                        <textarea
                            id="student-answers"
                            className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]"
                            rows={5}
                            placeholder="اكتب كل إجابة في سطر منفصل..."
                            onChange={(e) => setImageAnswers(e.target.value.split('\n'))}
                        />
                    </div>
                </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-[var(--border-primary)] text-center">
                 <button onClick={handleSubmit} className="px-10 py-3 font-bold text-white bg-blue-600 rounded-lg transition-transform transform hover:scale-105">
                    تسليم الإجابات
                </button>
            </div>
        </div>
    );
};

export default QuizTaker;