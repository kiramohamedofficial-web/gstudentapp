import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson, User, QuizAttempt } from '../../types';
import { getLatestQuizAttemptForLesson, addQuizAttempt } from '../../services/storageService';
import { ClockIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';

interface QuizTakerProps {
  lesson: Lesson;
  onComplete: (lessonId: string) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ lesson, onComplete }) => {
    const { currentUser: user } = useSession();
    const [view, setView] = useState<'start' | 'taking' | 'result'>('start');
    const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
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
        const correctAnswers = lesson.correctAnswers || [];
        if (correctAnswers.length === 0) return;

        const correctCount = studentAnswers.filter(ans => 
            correctAnswers.some(correctAns => correctAns.trim().toLowerCase() === ans.trim().toLowerCase())
        ).length;

        const score = Math.round((correctCount / correctAnswers.length) * 100);
        const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
        const passingScore = lesson.passingScore ?? 50;

        const attempt: Omit<QuizAttempt, 'id'> = {
            userId: user.id,
            lessonId: lesson.id,
            submittedAt: new Date().toISOString(),
            score,
            submittedAnswers: studentAnswers,
            timeTaken,
            isPass: score >= passingScore,
        };
        
        await addQuizAttempt(attempt);
        if (attempt.isPass) {
            onComplete(lesson.id);
        }

        const newAttemptData = await getLatestQuizAttemptForLesson(user.id, lesson.id);
        if(newAttemptData) setCurrentAttempt(newAttemptData);
        
        setView('result');
    }, [studentAnswers, lesson, user, startTime, onComplete]);

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
        setStudentAnswers([]);
        setTimeLeft(lesson.timeLimit ? lesson.timeLimit * 60 : 0);
        setView('start');
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!lesson.imageUrl) {
         return (
            <div className="bg-[var(--bg-secondary)] p-8 rounded-xl shadow-md border border-[var(--border-primary)] text-center flex flex-col items-center">
                <DocumentTextIcon className="w-16 h-16 text-[var(--text-secondary)] opacity-50 mb-4" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">المحتوى غير متوفر</h2>
                <p className="text-[var(--text-secondary)]">لم يقم المسؤول برفع صورة لهذا الواجب أو الامتحان بعد.</p>
            </div>
        );
    }
    
    if (currentAttempt === undefined) {
        return <div className="text-center p-8">جاري تحميل بيانات الاختبار...</div>;
    }

    // Start Screen
    if (view === 'start') {
        return (
            <div className="bg-[var(--bg-secondary)] p-8 rounded-xl shadow-md border border-[var(--border-primary)] text-center flex flex-col items-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">أنت على وشك البدء</h2>
                <p className="text-lg font-bold text-[var(--accent-primary)] mb-4">{lesson.title}</p>
                <div className="text-[var(--text-secondary)] space-y-2 mb-8">
                    <p>عدد الإجابات المطلوبة: {lesson.correctAnswers?.length || 0}</p>
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
        const { score, isPass, submittedAnswers = [], timeTaken } = currentAttempt;
        const correctAnswers = lesson.correctAnswers || [];
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
                
                 <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">الصورة</h3>
                        <img src={lesson.imageUrl} alt="Quiz content" className="rounded-lg border border-[var(--border-primary)] max-w-full h-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                            <h4 className="font-semibold mb-3 text-[var(--text-primary)]">إجاباتك</h4>
                            <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                                {submittedAnswers.map((ans, i) => <li key={i}>{ans || "-"}</li>)}
                            </ul>
                        </div>
                         <div className="p-4 rounded-lg bg-green-50">
                            <h4 className="font-semibold mb-3 text-green-800">الإجابات الصحيحة</h4>
                            <ul className="list-disc list-inside space-y-1 text-green-700">
                                {correctAnswers.map((ans, i) => <li key={i}>{ans}</li>)}
                            </ul>
                        </div>
                    </div>
                 </div>

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
                    <div className="flex items-center space-x-2 space-x-reverse px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-lg">
                        <ClockIcon className="w-5 h-5"/>
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>
            
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
                        onChange={(e) => setStudentAnswers(e.target.value.split('\n'))}
                    />
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[var(--border-primary)] text-center">
                 <button onClick={handleSubmit} className="px-10 py-3 font-bold text-white bg-blue-600 rounded-lg transition-transform transform hover:scale-105">
                    تسليم الإجابات
                </button>
            </div>
        </div>
    );
};

export default QuizTaker;
