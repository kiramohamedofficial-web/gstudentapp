import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType, Teacher, QuizType, QuizQuestion } from '../../types';
import {
    getAllGrades, addLessonToUnit, updateLesson, deleteLesson,
    addUnitToSemester, updateUnit, deleteUnit
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CollectionIcon, ChevronDownIcon, VideoCameraIcon, DocumentTextIcon, BookOpenIcon, SparklesIcon, XIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import ImageUpload from '../common/ImageUpload';
import { generateQuiz } from '../../services/geminiService';
import Loader from '../common/Loader';

// Reusable Confirmation Modal
const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">تأكيد الحذف</button>
        </div>
    </Modal>
);

// Unit Add/Edit Modal
const UnitEditModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (title: string) => void; unit?: Unit | null; }> = ({ isOpen, onClose, onSave, unit }) => {
    const [title, setTitle] = useState('');
    React.useEffect(() => {
        setTitle(unit?.title || '');
    }, [unit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title.trim());
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={unit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}>
            <form onSubmit={handleSubmit}>
                <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" required
                />
                <div className="flex justify-end mt-4">
                    <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

// Lesson Add/Edit Modal (New)
const LessonModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Lesson | Omit<Lesson, 'id'>) => void; lesson: Partial<Lesson> | null; gradeName: string }> = ({ isOpen, onClose, onSave, lesson, gradeName }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Lesson>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState<'سهل' | 'متوسط' | 'صعب'>('متوسط');
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    
    useEffect(() => {
        if (isOpen) {
            const initialData = lesson ? { ...lesson } : { type: LessonType.EXPLANATION, correctAnswers: [], questions: [{ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }] };
            if (!initialData.type) initialData.type = LessonType.EXPLANATION;
            if ((initialData.type === LessonType.HOMEWORK || initialData.type === LessonType.EXAM) && !initialData.questions) {
                initialData.questions = [{ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }];
            }
            setFormData(initialData);
        }
    }, [lesson, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };
    
    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...(prev.questions || []), { questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }]
        }));
    };

    const removeQuestion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            questions: (prev.questions || []).filter((_, i) => i !== index)
        }));
    };

    const handleQuestionChange = (qIndex: number, field: keyof QuizQuestion, value: any, optIndex?: number) => {
        setFormData(prev => {
            const updatedQuestions = (prev.questions || []).map((q, i) => {
                if (i !== qIndex) {
                    return q;
                }
                if (field === 'options' && typeof optIndex === 'number') {
                    const updatedOptions = q.options.map((opt, oIdx) => (oIdx === optIndex ? value : opt));
                    return { ...q, options: updatedOptions };
                } else {
                    const finalValue = field === 'correctAnswerIndex' ? Number(value) : value;
                    return { ...q, [field]: finalValue };
                }
            });
            return { ...prev, questions: updatedQuestions };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let dataToSave: Partial<Lesson> = { ...formData };

        if (typeof dataToSave.correctAnswers === 'string') {
            dataToSave.correctAnswers = (dataToSave.correctAnswers as string).split('\n').filter(Boolean);
        }

        if (dataToSave.type === LessonType.HOMEWORK || dataToSave.type === LessonType.EXAM) {
            dataToSave.quizType = dataToSave.imageUrl ? QuizType.IMAGE : QuizType.MCQ;
            if (dataToSave.quizType === QuizType.IMAGE) {
                dataToSave.questions = undefined;
            } else {
                dataToSave.imageUrl = undefined;
                dataToSave.correctAnswers = undefined;
            }
        } else {
            dataToSave.quizType = undefined;
            dataToSave.questions = undefined;
            dataToSave.imageUrl = undefined;
            dataToSave.correctAnswers = undefined;
            dataToSave.timeLimit = undefined;
            dataToSave.passingScore = undefined;
        }
        
        onSave(dataToSave as Lesson);
    };

    const handleGenerateQuiz = async () => {
        if (!aiTopic.trim() || !gradeName) {
            addToast('يرجى إدخال موضوع للاختبار.', ToastType.ERROR);
            return;
        }
        if ((formData.questions?.length || 0) > 1 || (formData.questions?.[0]?.questionText.trim() !== '')) {
            if (!window.confirm('لديك أسئلة حالية. هل تريد استبدالها بالأسئلة التي سيتم إنشاؤها؟')) {
                return;
            }
        }
        setIsGenerating(true);
        try {
            const generatedQuestions = await generateQuiz(aiTopic, gradeName, aiDifficulty, aiNumQuestions);
            if (generatedQuestions && generatedQuestions.length > 0) {
                setFormData(prev => ({ ...prev, questions: generatedQuestions }));
                addToast(`تم إنشاء ${generatedQuestions.length} أسئلة بنجاح.`, ToastType.SUCCESS);
            } else {
                throw new Error('لم يتم إرجاع أي أسئلة.');
            }
        } catch (error: any) {
            addToast(error.message || 'فشل توليد الأسئلة.', ToastType.ERROR);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const type = formData.type || LessonType.EXPLANATION;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? 'تعديل الدرس' : 'إضافة درس جديد'}>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto p-1 -mr-2 pr-4">
                <input type="text" placeholder="عنوان الدرس" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" required/>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                    {Object.values(LessonType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                
                {type === LessonType.EXPLANATION && <input type="text" placeholder="معرف فيديو يوتيوب" name="content" value={formData.content || ''} onChange={handleChange} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"/>}
                {type === LessonType.SUMMARY && <textarea placeholder="محتوى الملخص" name="content" value={formData.content || ''} onChange={handleChange} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg" rows={5}></textarea>}
                
                {(type === LessonType.HOMEWORK || type === LessonType.EXAM) && (
                     <div className="space-y-4">
                        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                            <h3 className="text-md font-semibold text-[var(--text-secondary)] mb-3">إعدادات الاختبار</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="درجة النجاح (%)" name="passingScore" value={formData.passingScore || ''} onChange={handleChange} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"/>
                                {type === LessonType.EXAM && <input type="number" placeholder="الوقت بالدقائق" name="timeLimit" value={formData.timeLimit || ''} onChange={handleChange} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"/>}
                            </div>
                        </div>
                        
                        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] space-y-4">
                            <h3 className="text-md font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-purple-400" />
                                توليد الأسئلة بالذكاء الاصطناعي
                            </h3>
                            <input 
                                type="text" 
                                placeholder="موضوع الاختبار (مثال: نظرية فيثاغورس)" 
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)} className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                                    <option value="سهل">سهل</option>
                                    <option value="متوسط">متوسط</option>
                                    <option value="صعب">صعب</option>
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="عدد الأسئلة" 
                                    value={aiNumQuestions}
                                    onChange={(e) => setAiNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={handleGenerateQuiz}
                                disabled={isGenerating}
                                className="w-full py-2.5 font-bold text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        <span>جاري التوليد...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5"/>
                                        <span>توليد</span>
                                    </>
                                )}
                            </button>
                        </div>

                        { (formData.questions || []).map((q, qIndex) => (
                            <div key={qIndex} className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="font-bold text-[var(--text-primary)]">السؤال رقم {qIndex + 1}</p>
                                    <button type="button" onClick={() => removeQuestion(qIndex)} className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30">حذف السؤال</button>
                                </div>
                                <textarea
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                    placeholder="نص السؤال..."
                                    className="w-full p-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-3"
                                    rows={3}
                                />
                                <p className="text-sm text-[var(--text-secondary)] mb-2">اختر الإجابة الصحيحة:</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center space-x-3 space-x-reverse p-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus-within:border-purple-500">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleQuestionChange(qIndex, 'options', e.target.value, optIndex)}
                                                placeholder={`الخيار ${String.fromCharCode(1575 + optIndex)}`}
                                                className="w-full bg-transparent focus:outline-none"
                                            />
                                            <input
                                                type="radio"
                                                name={`correctAnswer_${qIndex}`}
                                                checked={q.correctAnswerIndex === optIndex}
                                                onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', optIndex)}
                                                className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-600 bg-gray-700"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="w-full py-2.5 mt-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                            + أضف سؤال جديد
                        </button>
                    </div>
                )}
                <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2.5 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700">حفظ</button></div>
            </form>
        </Modal>
    );
};


interface TeacherContentManagementProps {
    teacher: Teacher;
}

const TeacherContentManagement: React.FC<TeacherContentManagementProps> = ({ teacher }) => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: {} });
    
    const grades = useMemo(() => getAllGrades().filter(g => teacher.teachingGrades?.includes(g.id)), [teacher, dataVersion]);
    
    const [selectedGradeId, setSelectedGradeId] = useState<string>(grades[0]?.id.toString() || '');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>(grades[0]?.semesters[0]?.id || '');
    const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
    
    const selectedGrade = useMemo(() => grades.find(g => g.id.toString() === selectedGradeId), [grades, selectedGradeId]);
    const selectedSemester = useMemo(() => selectedGrade?.semesters.find(s => s.id === selectedSemesterId), [selectedGrade, selectedSemesterId]);
    const units = useMemo(() => (selectedSemester?.units || []).filter(u => u.teacherId === teacher.id), [selectedSemester, teacher.id]);

    const refreshData = () => setDataVersion(v => v + 1);
    
    const openModal = (type: string, data = {}) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: {} });

    const handleSaveUnit = async (title: string) => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester) {
            try {
                const newOrUpdatedUnit = {
                    ...unit,
                    title,
                    teacherId: teacher.id
                };
                if (unit) {
                    await updateUnit(grade.id, semester.id, newOrUpdatedUnit);
                    addToast('تم تعديل الوحدة!', ToastType.SUCCESS);
                } else {
                    await addUnitToSemester(grade.id, semester.id, { title, teacherId: teacher.id, track: grade.level === 'Secondary' ? 'All' : undefined });
                    addToast('تمت إضافة الوحدة!', ToastType.SUCCESS);
                }
                refreshData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل حفظ الوحدة: ${error.message}`, ToastType.ERROR);
            }
        }
    };
    
    const handleDeleteUnit = async () => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester && unit) {
            try {
                await deleteUnit(grade.id, semester.id, unit.id);
                addToast('تم حذف الوحدة.', ToastType.SUCCESS);
                refreshData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل حذف الوحدة: ${error.message}`, ToastType.ERROR);
            }
        }
    };

    const handleAddLesson = (unit: Unit, type: LessonType, baseTitle: string) => {
        const suggestedTitle = `${type} ${baseTitle}`;
        openModal('add-lesson', { unit, lesson: { type, title: suggestedTitle } });
    };

    const handleSaveLesson = async (lessonData: Lesson | Omit<Lesson, 'id'>) => {
        const { unit } = modalState.data;
        if (selectedGrade && selectedSemester && unit) {
            try {
                if ('id' in lessonData && lessonData.id) {
                    await updateLesson(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                    addToast('تم تحديث الدرس', ToastType.SUCCESS);
                } else {
                    await addLessonToUnit(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                    addToast('تمت إضافة الدرس', ToastType.SUCCESS);
                }
                refreshData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل حفظ الدرس: ${error.message}`, ToastType.ERROR);
            }
        }
    };

    const handleDeleteLesson = async () => {
        const { unit, lesson } = modalState.data;
        if (selectedGrade && selectedSemester && unit && lesson) {
            try {
                await deleteLesson(selectedGrade.id, selectedSemester.id, unit.id, lesson.id);
                addToast('تم حذف الدرس.', ToastType.SUCCESS);
                refreshData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل حذف الدرس: ${error.message}`, ToastType.ERROR);
            }
        }
    };

    const getLessonIcon = (type: LessonType) => {
        switch(type) {
            case LessonType.EXPLANATION: return VideoCameraIcon;
            case LessonType.HOMEWORK: return PencilIcon;
            case LessonType.EXAM: return BookOpenIcon;
            case LessonType.SUMMARY: return DocumentTextIcon;
            default: return CollectionIcon;
        }
    };

    const groupedLessonsByUnit = useMemo(() => {
        const result: Record<string, { baseTitle: string, lessons: Lesson[] }[]> = {};
        units.forEach(unit => {
            const groups: Record<string, Lesson[]> = {};
            unit.lessons.forEach(lesson => {
                const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
                if (!groups[baseTitle]) {
                    groups[baseTitle] = [];
                }
                groups[baseTitle].push(lesson);
            });
            result[unit.id] = Object.entries(groups).map(([baseTitle, lessons]) => ({ baseTitle, lessons }));
        });
        return result;
    }, [units]);
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المحتوى الخاص بك</h1>
                 <div className="flex items-center space-x-2 space-x-reverse">
                    <select value={selectedGradeId} onChange={(e) => { setSelectedGradeId(e.target.value); setSelectedSemesterId(grades.find(g => g.id.toString() === e.target.value)?.semesters[0]?.id || ''); }} className="p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        <option value="">اختر الصف</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)} disabled={!selectedGrade} className="p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] disabled:opacity-50">
                        <option value="">اختر الفصل الدراسي</option>
                        {selectedGrade?.semesters.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>
            </div>

            {selectedSemester ? (
                 <div className="space-y-4">
                    {units.map(unit => (
                        <div key={unit.id} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] transition-all duration-300">
                             <div className="p-4 flex justify-between items-center">
                                <button onClick={() => setExpandedUnit(p => p === unit.id ? null : unit.id)} className="flex-1 text-right flex items-center gap-3">
                                    <ChevronDownIcon className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${expandedUnit === unit.id ? 'rotate-180' : ''}`} />
                                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{unit.title}</h3>
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal('edit-unit', { grade: selectedGrade, semester: selectedSemester, unit })} className="p-2 text-[var(--text-secondary)] hover:text-yellow-400"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => openModal('delete-unit', { grade: selectedGrade, semester: selectedSemester, unit })} className="p-2 text-[var(--text-secondary)] hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                            {expandedUnit === unit.id && (
                                <div className="p-4 border-t border-[var(--border-primary)] space-y-4">
                                    {(groupedLessonsByUnit[unit.id] || []).length > 0 ? (
                                        (groupedLessonsByUnit[unit.id] || []).map(({baseTitle, lessons}) => (
                                            <div key={baseTitle} className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-secondary)]">
                                                <h4 className="font-bold text-[var(--text-primary)] mb-2">{baseTitle}</h4>
                                                <div className="space-y-2">
                                                    {lessons.map(lesson => (
                                                        <div key={lesson.id} className="p-2 bg-[var(--bg-secondary)] rounded-md flex justify-between items-center">
                                                             <div className="flex items-center gap-2">
                                                                {React.createElement(getLessonIcon(lesson.type), { className: "w-4 h-4 text-[var(--text-secondary)]" })}
                                                                <span className="text-sm">{lesson.title}</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => openModal('edit-lesson', { unit, lesson })} className="p-1 text-[var(--text-secondary)] hover:text-yellow-400"><PencilIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => openModal('delete-lesson', { unit, lesson })} className="p-1 text-[var(--text-secondary)] hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                                                    <button onClick={() => handleAddLesson(unit, LessonType.EXPLANATION, baseTitle)} className="flex items-center justify-center gap-1 p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md"><PlusIcon className="w-3 h-3"/> شرح</button>
                                                    <button onClick={() => handleAddLesson(unit, LessonType.HOMEWORK, baseTitle)} className="flex items-center justify-center gap-1 p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md"><PlusIcon className="w-3 h-3"/> واجب</button>
                                                    <button onClick={() => handleAddLesson(unit, LessonType.EXAM, baseTitle)} className="flex items-center justify-center gap-1 p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md"><PlusIcon className="w-3 h-3"/> امتحان</button>
                                                    <button onClick={() => handleAddLesson(unit, LessonType.SUMMARY, baseTitle)} className="flex items-center justify-center gap-1 p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md"><PlusIcon className="w-3 h-3"/> ملخص</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : <p className="text-center text-sm text-[var(--text-secondary)] py-2">لا توجد دروس في هذه الوحدة بعد.</p>}
                                </div>
                            )}
                        </div>
                    ))}
                    <button onClick={() => openModal('add-unit', { grade: selectedGrade, semester: selectedSemester })} className="w-full text-center p-3 rounded-xl bg-transparent hover:bg-[var(--bg-tertiary)] border-2 border-dashed border-[var(--border-primary)]">
                        <PlusIcon className="w-6 h-6 inline-block mr-2"/> إضافة وحدة جديدة
                    </button>
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)] mt-8">
                    <CollectionIcon className="w-16 h-16 mx-auto opacity-20 mb-4 text-[var(--text-secondary)]" />
                    <p className="text-[var(--text-secondary)]">اختر صفًا وفصلاً دراسيًا لعرض الوحدات الدراسية الخاصة بك.</p>
                </div>
            )}

            <UnitEditModal isOpen={['add-unit', 'edit-unit'].includes(modalState.type || '')} onClose={closeModal} onSave={handleSaveUnit} unit={modalState.data.unit} />
            <LessonModal isOpen={['add-lesson', 'edit-lesson'].includes(modalState.type || '')} onClose={closeModal} onSave={handleSaveLesson} lesson={modalState.data.lesson} gradeName={selectedGrade?.name || ''} />
            <ConfirmationModal isOpen={modalState.type === 'delete-unit'} onClose={closeModal} onConfirm={handleDeleteUnit} title="تأكيد حذف الوحدة" message={`هل أنت متأكد من حذف وحدة "${modalState.data.unit?.title}" وكل دروسها؟`} />
            <ConfirmationModal isOpen={modalState.type === 'delete-lesson'} onClose={closeModal} onConfirm={handleDeleteLesson} title="تأكيد حذف الدرس" message={`هل أنت متأكد من حذف درس "${modalState.data.lesson?.title}"؟`} />
        </div>
    );
};

export default TeacherContentManagement;