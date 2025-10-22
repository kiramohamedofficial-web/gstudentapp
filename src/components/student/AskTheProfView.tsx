import React, { useState, useMemo } from 'react';
import { User, StudentQuestion, ToastType } from '../../types';
import { getStudentQuestionsByUserId, addStudentQuestion } from '../../services/storageService';
import { useToast } from '../../hooks/useToast';
import { ClockIcon, CheckCircleIcon, ChevronDownIcon } from '../common/Icons';

const QuestionCard: React.FC<{ question: StudentQuestion }> = ({ question }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isAnswered = question.status === 'Answered';

    return (
        <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-primary)]">
            <div className="flex justify-between items-start">
                <p className="text-[var(--text-primary)] leading-relaxed flex-1 pr-4">{question.questionText}</p>
                <div className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-1 space-x-reverse ${isAnswered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isAnswered ? <CheckCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />}
                    <span>{isAnswered ? 'تم الرد' : 'بانتظار الرد'}</span>
                </div>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">
                {new Date(question.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {isAnswered && (
                <div className="mt-3">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center text-sm text-[var(--accent-primary)] hover:underline">
                        <span>عرض إجابة البروف</span>
                        <ChevronDownIcon className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                        <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-primary)] text-[var(--text-secondary)] whitespace-pre-wrap">
                            {question.answerText}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const AskTheProfView: React.FC<{ user: User }> = ({ user }) => {
    const [dataVersion, setDataVersion] = useState(0);
    const [newQuestion, setNewQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const questions = useMemo(() => getStudentQuestionsByUserId(user.id), [user.id, dataVersion]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            addStudentQuestion(user.id, user.name, newQuestion.trim());
            addToast('تم إرسال سؤالك بنجاح!', ToastType.SUCCESS);
            setNewQuestion('');
            setDataVersion(v => v + 1); // Refresh questions list
        } catch (error) {
            addToast('حدث خطأ أثناء إرسال سؤالك.', ToastType.ERROR);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">اسأل البروف</h1>
            
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] mb-8">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">اطرح سؤالاً جديداً</h2>
                <p className="text-[var(--text-secondary)] mb-4">هل لديك سؤال في المنهج؟ اكتبه هنا وسيقوم البروف بالرد عليك في أقرب وقت.</p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="اكتب سؤالك هنا بوضوح..."
                        className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all placeholder-[var(--text-secondary)]"
                        rows={4}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newQuestion.trim()}
                        className="mt-4 px-6 py-3 font-bold text-white bg-blue-600 rounded-lg 
                                   hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                                   transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'جاري الإرسال...' : 'أرسل السؤال'}
                    </button>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">أسئلتي السابقة</h2>
                {questions.length > 0 ? (
                    <div className="space-y-4">
                        {questions.map(q => <QuestionCard key={q.id} question={q} />)}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-primary)]">
                        <p className="text-[var(--text-secondary)]">لم تقم بطرح أي أسئلة بعد.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AskTheProfView;
