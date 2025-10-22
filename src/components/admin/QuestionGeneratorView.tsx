

import React, { useState, useEffect } from 'react';
import { Subject, Question, GeneratorFormState, QuestionType, Difficulty } from '../../types';
import { CURRICULUM_TOPICS } from '../../constants';
import { generateQuestions } from '../../services/geminiService';
import { SparklesIcon, DocumentTextIcon, CheckCircleIcon } from '../common/Icons';
import Loader from '../common/Loader';
import { useToast } from '../../hooks/useToast';

const QuestionCard: React.FC<{ question: Question, index: number }> = ({ question, index }) => (
    <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)] fade-in" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-[var(--text-primary)] pr-4 flex-1">
                <span className="text-sm font-mono text-purple-400 mr-2">{index + 1}.</span>
                {question.stem}
            </h3>
            <div className="flex-shrink-0 flex flex-col items-end text-xs text-[var(--text-secondary)]">
                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full mb-1">{question.type}</span>
                <span className={`px-2 py-1 rounded-full ${question.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' : question.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{question.difficulty}</span>
            </div>
        </div>

        {question.type === QuestionType.MCQ && question.options && (
            <div className="space-y-2 my-4 pr-6">
                {question.options.map(opt => (
                    <div key={opt.id} className={`flex items-center p-2 rounded-md ${opt.id === question.answer_key ? 'bg-green-500/10' : ''}`}>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold mr-3 ${opt.id === question.answer_key ? 'bg-green-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
                            {opt.id}
                        </span>
                        <span className={`${opt.id === question.answer_key ? 'text-green-300 font-semibold' : 'text-[var(--text-secondary)]'}`}>{opt.text}</span>
                    </div>
                ))}
            </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-[var(--border-primary)] text-sm">
            <p><strong className="text-purple-400">الإجابة:</strong> {question.answer_key}</p>
            <p className="mt-2"><strong className="text-purple-400">التبرير:</strong> <span className="text-[var(--text-secondary)]">{question.rationale}</span></p>
        </div>
    </div>
);


const QuestionGeneratorView: React.FC = () => {
    const { addToast } = useToast();
    const [formState, setFormState] = useState<GeneratorFormState>({
        subject: Subject.ARABIC,
        topic: CURRICULUM_TOPICS[Subject.ARABIC][0] || '',
        questionCount: 5,
        mcqPercentage: 70,
        difficulty: { easy: 20, medium: 60, hard: 20 },
    });
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFormState(prev => ({ ...prev, topic: CURRICULUM_TOPICS[prev.subject][0] || '' }));
    }, [formState.subject]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'questionCount' || name === 'mcqPercentage' ? Number(value) : value }));
    };

    const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const changedValue = Number(value);
        const difficultyKey = name as keyof typeof formState.difficulty;
        
        setFormState(prev => {
            const newDifficulty: typeof prev.difficulty = { ...prev.difficulty, [difficultyKey]: changedValue };
            const otherSliders = (Object.keys(newDifficulty) as Array<keyof typeof newDifficulty>).filter(k => k !== difficultyKey);

            // FIX: Replaced reduce with direct property summation to fix type inference errors.
            const currentTotal = newDifficulty.easy + newDifficulty.medium + newDifficulty.hard;
            
            if (currentTotal > 100) {
                let overflow = currentTotal - 100;
                for (const slider of otherSliders) {
                    const sliderVal = newDifficulty[slider];
                    const reduction = Math.min(overflow, sliderVal);
                    newDifficulty[slider] -= reduction;
                    overflow -= reduction;
                    if (overflow <= 0) break;
                }
            }
            return { ...prev, difficulty: newDifficulty };
        });
    };
    
    const handleGenerate = async () => {
        // FIX: Replaced reduce with direct property summation to fix type inference errors.
        const difficultySum = formState.difficulty.easy + formState.difficulty.medium + formState.difficulty.hard;
        if (difficultySum !== 100) {
            addToast('يجب أن يكون مجموع توزيع الصعوبة 100%.', 'error');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedQuestions([]);
        try {
            const questions = await generateQuestions(formState);
            setGeneratedQuestions(questions);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            addToast(err.message || 'فشل إنشاء الأسئلة.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <SparklesIcon className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">مولد الأسئلة بالذكاء الاصطناعي</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] self-start">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">إعدادات توليد الأسئلة</h2>
                    <div className="space-y-5">
                        {/* Subject & Topic */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">المادة</label>
                            <select name="subject" value={formState.subject} onChange={handleInputChange} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الموضوع</label>
                            <select name="topic" value={formState.topic} onChange={handleInputChange} className="w-full p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                                {CURRICULUM_TOPICS[formState.subject].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                         {/* Question Count */}
                        <div>
                             <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">عدد الأسئلة: {formState.questionCount}</label>
                            <input type="range" name="questionCount" min="1" max="10" value={formState.questionCount} onChange={handleInputChange} className="w-full"/>
                        </div>
                        {/* MCQ Percentage */}
                        <div>
                             <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">نسبة الاختيار من متعدد: {formState.mcqPercentage}%</label>
                            <input type="range" name="mcqPercentage" min="0" max="100" step="10" value={formState.mcqPercentage} onChange={handleInputChange} className="w-full"/>
                        </div>
                        {/* Difficulty Distribution */}
                        <div className="pt-2">
                             <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">توزيع الصعوبة</label>
                             <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-green-400">سهل: {formState.difficulty.easy}%</label>
                                    <input type="range" name="easy" min="0" max="100" value={formState.difficulty.easy} onChange={handleDifficultyChange} className="w-full difficulty-easy"/>
                                </div>
                                <div>
                                    <label className="text-xs text-yellow-400">متوسط: {formState.difficulty.medium}%</label>
                                    <input type="range" name="medium" min="0" max="100" value={formState.difficulty.medium} onChange={handleDifficultyChange} className="w-full difficulty-medium"/>
                                </div>
                                <div>
                                    <label className="text-xs text-red-400">صعب: {formState.difficulty.hard}%</label>
                                    <input type="range" name="hard" min="0" max="100" value={formState.difficulty.hard} onChange={handleDifficultyChange} className="w-full difficulty-hard"/>
                                </div>
                             </div>
                        </div>
                    </div>
                     <button onClick={handleGenerate} disabled={isLoading} className="mt-8 w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? <Loader /> : <><SparklesIcon className="w-5 h-5 ml-2"/> إنشاء الأسئلة</>}
                    </button>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {isLoading && <div className="flex flex-col items-center justify-center h-full min-h-[300px]"><Loader /><p className="mt-4 text-[var(--text-secondary)]">جاري إنشاء الأسئلة...</p></div>}
                    {error && <div className="text-center text-red-400 p-8 bg-[var(--bg-secondary)] rounded-xl">حدث خطأ: {error}</div>}
                    
                    {!isLoading && !error && generatedQuestions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                           <DocumentTextIcon className="w-16 h-16 text-[var(--text-secondary)]/30 mb-4"/>
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">لم يتم إنشاء أي أسئلة بعد</h3>
                            <p className="text-[var(--text-secondary)]">اضبط الإعدادات على اليسار ثم اضغط على "إنشاء الأسئلة".</p>
                        </div>
                    )}

                    {generatedQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center"><CheckCircleIcon className="w-6 h-6 ml-2 text-green-400"/> تم إنشاء {generatedQuestions.length} سؤال بنجاح</h2>
                            {generatedQuestions.map((q, i) => <QuestionCard key={q.question_id || i} question={q} index={i} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionGeneratorView;