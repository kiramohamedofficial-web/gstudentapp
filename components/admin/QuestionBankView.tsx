

import React, { useState, useMemo, useCallback } from 'react';
import { StudentQuestion, ToastType } from '../../types';
import { getAllStudentQuestions, answerStudentQuestion } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';

const AnswerModal: React.FC<{ isOpen: boolean; onClose: () => void; question: StudentQuestion | null; onSave: (questionId: string, answer: string) => void; }> = ({ isOpen, onClose, question, onSave }) => {
    const [answer, setAnswer] = useState('');

    React.useEffect(() => {
        if (isOpen && question) {
            setAnswer(question.answerText || '');
        }
    }, [isOpen, question]);
    
    if (!question) return null;

    const handleSubmit = () => {
        if (answer.trim()) {
            onSave(question.id, answer.trim());
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="الرد على سؤال الطالب">
            <div className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">سؤال من: <span className="font-semibold text-gray-800">{question.userName}</span></p>
                    <p className="text-gray-700 whitespace-pre-wrap">{question.questionText}</p>
                </div>
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                    rows={6}
                    required
                />
                <div className="flex justify-end">
                    <button onClick={handleSubmit} className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                        {question.status === 'Answered' ? 'تحديث الإجابة' : 'إرسال الإجابة'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const QuestionBankView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Answered'>('Pending');
    const [selectedQuestion, setSelectedQuestion] = useState<StudentQuestion | null>(null);
    const { addToast } = useToast();

    const allQuestions = useMemo(() => getAllStudentQuestions(), [dataVersion]);
    
    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

    const filteredQuestions = useMemo(() => allQuestions.filter(q => q.status === activeTab), [allQuestions, activeTab]);
    
    const handleSaveAnswer = (questionId: string, answer: string) => {
        answerStudentQuestion(questionId, answer);
        addToast('تم حفظ الإجابة بنجاح!', ToastType.SUCCESS);
        setSelectedQuestion(null);
        refreshData();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">الأسئلة والاستفسارات</h1>
            <p className="mb-8 text-[var(--text-secondary)]">مراجعة أسئلة الطلاب والرد عليها.</p>

            <div className="mb-6 border-b border-[var(--border-primary)] flex space-x-4 space-x-reverse">
                {(['Pending', 'Answered'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-purple-500 text-purple-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {tab === 'Pending' ? 'أسئلة جديدة' : 'أسئلة مجابة'}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                    <div key={q.id} className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-primary)] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex-1">
                            <p className="font-semibold text-[var(--text-primary)]">{q.userName}</p>
                            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{q.questionText}</p>
                             <p className="text-xs text-[var(--text-secondary)]/70 mt-2">
                                {new Date(q.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>
                        <button onClick={() => setSelectedQuestion(q)} className="w-full sm:w-auto flex-shrink-0 px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
                            {q.status === 'Pending' ? 'الرد على السؤال' : 'عرض / تعديل الإجابة'}
                        </button>
                    </div>
                )) : (
                    <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-primary)]">
                        <p className="text-[var(--text-secondary)]">لا توجد أسئلة في هذا القسم.</p>
                    </div>
                )}
            </div>

            <AnswerModal 
                isOpen={!!selectedQuestion}
                onClose={() => setSelectedQuestion(null)}
                question={selectedQuestion}
                onSave={handleSaveAnswer}
            />
        </div>
    );
};

export default QuestionBankView;