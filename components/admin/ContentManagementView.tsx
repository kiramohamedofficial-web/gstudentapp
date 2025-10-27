import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType, Teacher, QuizType, QuizQuestion } from '../../types';
import {
    getAllGrades, addLessonToUnit, updateLesson, deleteLesson,
    addUnitToSemester, updateUnit, deleteUnit, getAllTeachers
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, DotsVerticalIcon, BookOpenIcon, VideoCameraIcon, DocumentTextIcon, ChevronDownIcon, SparklesIcon, XIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import ImageUpload from '../common/ImageUpload';
import { generateQuiz } from '../../services/geminiService';

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
const UnitModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Partial<Unit>) => void; unit: Unit | null; teachers: Teacher[], selectedGrade: Grade | null }> = ({ isOpen, onClose, onSave, unit, teachers, selectedGrade }) => {
    const [formData, setFormData] = useState({ title: '', teacherId: '', track: 'All' });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: unit?.title || '',
                teacherId: unit?.teacherId || '',
                track: unit?.track || 'All'
            });
        }
    }, [unit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title.trim() && formData.teacherId) {
            onSave(formData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={unit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="عنوان الوحدة" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" required />
                <select value={formData.teacherId} onChange={(e) => setFormData(p => ({...p, teacherId: e.target.value}))} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" required>
                    <option value="">-- اختر المدرس --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {selectedGrade?.level === 'Secondary' && (
                    <select value={formData.track} onChange={(e) => setFormData(p => ({...p, track: e.target.value}))} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <option value="All">الكل</option>
                        <option value="Scientific">علمي</option>
                        <option value="Literary">أدبي</option>
                    </select>
                )}
                <div className="flex justify-end mt-4"><button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button></div>
            </form>
        </Modal>
    );
};

// Lesson Add/Edit Modal
const LessonModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Lesson | Omit<Lesson, 'id'>) => void; lesson: Partial<Lesson> | null; gradeName: string }> = ({ isOpen, onClose, onSave, lesson, gradeName }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Lesson>>({});
    const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');
    const [aiSettings, setAiSettings] = useState({ topic: '', difficulty: 'متوسط' as 'سهل' | 'متوسط' | 'صعب', numQuestions: 5 });
    const [isGenerating, setIsGenerating] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const initialData = lesson ? { ...lesson } : { type: LessonType.EXPLANATION, correctAnswers: [] };
            if (!initialData.type) initialData.type = LessonType.EXPLANATION;
            setFormData(initialData);
            setCreationMode(initialData.quizType === 'mcq' ? 'ai' : 'manual');
        }
    }, [lesson, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleGenerateQuestions = async () => {
        if (!aiSettings.topic.trim()) {
            addToast('الرجاء إدخال موضوع للأسئلة.', ToastType.ERROR);
            return;
        }
        setIsGenerating(true);
        try {
            const questions = await generateQuiz(aiSettings.topic, gradeName, aiSettings.difficulty, aiSettings.numQuestions);
            setFormData(prev => ({ ...prev, questions, quizType: 'mcq' }));
            addToast(`تم توليد ${questions.length} أسئلة بنجاح.`, ToastType.SUCCESS);
        } catch (error: any) {
            addToast(error.message, ToastType.ERROR);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleQuestionChange = (qIndex: number, field: keyof QuizQuestion, value: any, optIndex?: number) => {
        setFormData(prev => {
            const newQuestions = [...(prev.questions || [])];
            const question = { ...newQuestions[qIndex] };
            if (field === 'options' && typeof optIndex === 'number') {
                const newOptions = [...question.options];
                newOptions[optIndex] = value;
                question.options = newOptions;
            } else {
                // @ts-ignore
                question[field] = value;
            }
            newQuestions[qIndex] = question;
            return { ...prev, questions: newQuestions };
        });
    };
    
    const removeQuestion = (qIndex: number) => {
        setFormData(prev => ({ ...prev, questions: (prev.questions || []).filter((_, i) => i !== qIndex) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let dataToSave = { ...formData };

        if (dataToSave.type === LessonType.HOMEWORK || dataToSave.type === LessonType.EXAM) {
            dataToSave.quizType = creationMode;
            if (creationMode === 'manual') {
                dataToSave.questions = [];
            } else {
                dataToSave.imageUrl = '';
                dataToSave.correctAnswers = [];
            }
        }
        
        onSave(dataToSave as Lesson);
    };
    
    const type = formData.type || LessonType.EXPLANATION;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? 'تعديل الدرس' : 'إضافة درس جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <input type="text" placeholder="عنوان الدرس" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required/>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md">
                    {Object.values(LessonType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                
                {type === LessonType.EXPLANATION && <input type="text" placeholder="معرف فيديو يوتيوب" name="content" value={formData.content || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>}
                {type === LessonType.SUMMARY && <textarea placeholder="محتوى الملخص" name="content" value={formData.content || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" rows={5}></textarea>}
                
                {(type === LessonType.HOMEWORK || type === LessonType.EXAM) && (
                    <div className="space-y-4 p-3 border border-dashed border-[var(--border-primary)] rounded-lg">
                        <div className="flex items-center p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                            <button type="button" onClick={() => setCreationMode('manual')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${creationMode === 'manual' ? 'bg-purple-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>إنشاء يدوي (صورة)</button>
                            <button type="button" onClick={() => setCreationMode('ai')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${creationMode === 'ai' ? 'bg-purple-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>إنشاء بالذكاء الاصطناعي</button>
                        </div>
                        
                        {creationMode === 'manual' ? (
                            <div className="space-y-4">
                                <ImageUpload label="صورة الواجب/الامتحان" value={formData.imageUrl || ''} onChange={url => setFormData(p => ({...p, imageUrl: url}))} />
                                <textarea placeholder="الإجابات الصحيحة (كل إجابة في سطر)" name="correctAnswers" value={Array.isArray(formData.correctAnswers) ? formData.correctAnswers.join('\n') : formData.correctAnswers || ''} onChange={handleChange} rows={4} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] space-y-3">
                                    <textarea placeholder="اكتب موضوع الأسئلة هنا (مثال: الدرس الأول في الجبر عن حل المعادلات)" value={aiSettings.topic} onChange={e => setAiSettings(p => ({...p, topic: e.target.value}))} rows={3} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" />
                                    <div className="grid grid-cols-3 gap-3">
                                        <select value={aiSettings.difficulty} onChange={e => setAiSettings(p => ({...p, difficulty: e.target.value as any}))} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-sm">
                                            <option value="سهل">سهل</option>
                                            <option value="متوسط">متوسط</option>
                                            <option value="صعب">صعب</option>
                                        </select>
                                        <input type="number" value={aiSettings.numQuestions} onChange={e => setAiSettings(p => ({...p, numQuestions: parseInt(e.target.value) || 1}))} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md text-sm" placeholder="العدد"/>
                                        <button type="button" onClick={handleGenerateQuestions} disabled={isGenerating} className="px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                                            <SparklesIcon className="w-4 h-4"/> {isGenerating ? 'جاري...' : 'توليد'}
                                        </button>
                                    </div>
                                </div>
                                {(formData.questions || []).length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold">الأسئلة التي تم توليدها:</h4>
                                        {(formData.questions || []).map((q, qIndex) => (
                                            <div key={qIndex} className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                                                <div className="flex justify-between items-center mb-2">
                                                    <input value={q.questionText} onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)} className="w-full p-1 bg-transparent border-b border-dashed border-[var(--border-primary)] focus:border-solid focus:outline-none" />
                                                    <button type="button" onClick={() => removeQuestion(qIndex)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-full"><XIcon className="w-4 h-4"/></button>
                                                </div>
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={optIndex} className="flex items-center gap-2 mb-1">
                                                        <input type="radio" name={`correct_${qIndex}`} checked={q.correctAnswerIndex === optIndex} onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', optIndex)} />
                                                        <input value={opt} onChange={e => handleQuestionChange(qIndex, 'options', e.target.value, optIndex)} className="w-full p-1 text-sm bg-transparent border-b border-dashed border-[var(--border-primary)]/50 focus:border-solid focus:outline-none" />
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" placeholder="درجة النجاح (%)" name="passingScore" value={formData.passingScore || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>
                            {type === LessonType.EXAM && <input type="number" placeholder="الوقت بالدقائق" name="timeLimit" value={formData.timeLimit || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>}
                        </div>
                    </div>
                )}
                <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button></div>
            </form>
        </Modal>
    );
};


const ContentManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: {} });
    const [grades, setGrades] = useState<Grade[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
    const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
    const [optionsMenuUnitId, setOptionsMenuUnitId] = useState<string | null>(null);
    const optionsMenuRef = useRef<HTMLDivElement>(null);

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

    useEffect(() => {
        const fetchData = async () => {
            const [gradesData, teachersData] = await Promise.all([getAllGrades(), getAllTeachers()]);
            setGrades(gradesData);
            setTeachers(teachersData);
            if(gradesData.length > 0) {
              if(!selectedGradeId) setSelectedGradeId(gradesData[0].id.toString());
              if(!selectedSemesterId) setSelectedSemesterId(gradesData[0].semesters[0]?.id || '');
            }
        };
        fetchData();
    }, [dataVersion]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
                setOptionsMenuUnitId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openModal = (type: string, data = {}) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: {} });

    const selectedGrade = useMemo(() => grades.find(g => g.id.toString() === selectedGradeId), [grades, selectedGradeId]);
    const selectedSemester = useMemo(() => selectedGrade?.semesters.find(s => s.id === selectedSemesterId), [selectedGrade, selectedSemesterId]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);

    const handleSaveUnit = async (unitData: Partial<Unit>) => {
        if (selectedGrade && selectedSemester) {
            if (modalState.data.unit?.id) { // Editing
                await updateUnit(selectedGrade.id, selectedSemester.id, { ...modalState.data.unit, ...unitData });
                addToast('تم تعديل الوحدة!', ToastType.SUCCESS);
            } else { // Adding
                await addUnitToSemester(selectedGrade.id, selectedSemester.id, { ...unitData, teacherId: unitData.teacherId! } as Omit<Unit, 'id' | 'lessons'>);
                addToast('تمت إضافة الوحدة!', ToastType.SUCCESS);
            }
        }
        refreshData();
        closeModal();
    };

    const handleDeleteUnit = async () => {
        const { unit } = modalState.data;
        if (selectedGrade && selectedSemester && unit) {
            await deleteUnit(selectedGrade.id, selectedSemester.id, unit.id);
            addToast('تم حذف الوحدة.', ToastType.SUCCESS);
        }
        refreshData();
        closeModal();
    };
    
    const handleAddLesson = (unit: Unit, type: LessonType) => {
        openModal('add-lesson', { unit, lesson: { type } });
    };

    const handleSaveLesson = async (lessonData: Lesson | Omit<Lesson, 'id'>) => {
        const { unit } = modalState.data;
        if (selectedGrade && selectedSemester && unit) {
            if ('id' in lessonData && lessonData.id) { // Editing
                await updateLesson(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                addToast('تم تحديث الدرس', ToastType.SUCCESS);
            } else { // Adding
                await addLessonToUnit(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                addToast('تمت إضافة الدرس', ToastType.SUCCESS);
            }
        }
        refreshData();
        closeModal();
    };

    const handleDeleteLesson = async () => {
        const { unit, lesson } = modalState.data;
        if (selectedGrade && selectedSemester && unit && lesson) {
            await deleteLesson(selectedGrade.id, selectedSemester.id, unit.id, lesson.id);
            addToast('تم حذف الدرس.', ToastType.SUCCESS);
        }
        refreshData();
        closeModal();
    };

    const unitsToDisplay = selectedSemester?.units || [];
    
    const getLessonIcon = (type: LessonType) => {
        switch(type) {
            case LessonType.EXPLANATION: return VideoCameraIcon;
            case LessonType.HOMEWORK: return PencilIcon;
            case LessonType.EXAM: return BookOpenIcon;
            case LessonType.SUMMARY: return DocumentTextIcon;
            default: return BookOpenIcon;
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-800 p-4 rounded-lg flex gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                    <p className="font-bold">تنبيه للمشرفين</p>
                    <p className="text-sm">نظام إدارة المحتوى الحالي لا يدعم التعديلات المتزامنة. لتجنب فقدان البيانات، يرجى التنسيق مع المشرفين الآخرين قبل إجراء أي تغييرات على المنهج.</p>
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-bold mb-1 text-[var(--text-primary)]">إدارة المحتوى التعليمي</h1>
                <p className="text-[var(--text-secondary)]">فلترة المحتوى حسب المدرس وتنظيمه بسهولة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={selectedGradeId} onChange={(e) => { setSelectedGradeId(e.target.value); setSelectedSemesterId(''); setExpandedUnitId(null); }} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] transition-all">
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select value={selectedSemesterId} onChange={(e) => { setSelectedSemesterId(e.target.value); setExpandedUnitId(null); }} disabled={!selectedGrade} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] transition-all disabled:opacity-50">
                    {selectedGrade?.semesters.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
            </div>

            <div className="space-y-4">
                {unitsToDisplay.map(unit => (
                    <div key={unit.id} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                        <header onClick={() => setExpandedUnitId(p => p === unit.id ? null : unit.id)} className="p-4 flex justify-between items-center cursor-pointer">
                            <div className="flex items-center gap-3">
                                <ChevronDownIcon className={`w-6 h-6 text-[var(--text-secondary)] transition-transform ${expandedUnitId === unit.id ? 'rotate-180' : ''}`} />
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{unit.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">أ. {teacherMap.get(unit.teacherId) || 'غير محدد'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">{unit.lessons.length} دروس</span>
                                <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setOptionsMenuUnitId(p => p === unit.id ? null : unit.id); }} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full"><DotsVerticalIcon className="w-5 h-5"/></button>
                                    {optionsMenuUnitId === unit.id && (
                                        <div ref={optionsMenuRef} className="absolute top-full left-0 mt-2 w-32 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg shadow-lg z-10 fade-in-up">
                                            <button onClick={() => { openModal('edit-unit', { unit }); setOptionsMenuUnitId(null); }} className="w-full text-right px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)]">تعديل</button>
                                            <button onClick={() => { openModal('delete-unit', { unit }); setOptionsMenuUnitId(null); }} className="w-full text-right px-3 py-2 text-sm text-red-500 hover:bg-[var(--bg-tertiary)]">حذف</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>
                        {expandedUnitId === unit.id && (
                            <div className="p-4 border-t border-[var(--border-primary)] space-y-4">
                                {unit.lessons.length === 0 ? (
                                    <p className="text-center text-sm text-[var(--text-secondary)] py-4">لا توجد دروس في هذه الوحدة.</p>
                                ) : (
                                    <div className="space-y-2">
                                    {unit.lessons.map(lesson => (
                                        <div key={lesson.id} className="p-2 bg-[var(--bg-tertiary)] rounded-md flex justify-between items-center">
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
                                )}
                                <div>
                                    <p className="text-sm font-semibold mb-2">إضافة جزء جديد:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <button onClick={() => handleAddLesson(unit, LessonType.EXPLANATION)} className="flex items-center justify-center gap-2 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg"><PlusIcon className="w-4 h-4"/> شرح</button>
                                        <button onClick={() => handleAddLesson(unit, LessonType.HOMEWORK)} className="flex items-center justify-center gap-2 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg"><PlusIcon className="w-4 h-4"/> واجب</button>
                                        <button onClick={() => handleAddLesson(unit, LessonType.EXAM)} className="flex items-center justify-center gap-2 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg"><PlusIcon className="w-4 h-4"/> امتحان</button>
                                        <button onClick={() => handleAddLesson(unit, LessonType.SUMMARY)} className="flex items-center justify-center gap-2 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg"><PlusIcon className="w-4 h-4"/> ملخص</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedSemester && (
                <button onClick={() => openModal('add-unit', { grade: selectedGrade, semester: selectedSemester })} className="w-full p-6 border-2 border-dashed border-[var(--border-primary)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-solid transition-all">
                    <PlusIcon className="w-6 h-6 ml-2"/> 
                    <span className="font-semibold">إضافة وحدة جديدة</span>
                </button>
            )}

            {!selectedSemester && unitsToDisplay.length === 0 && (
                 <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)] mt-8">
                    <BookOpenIcon className="w-16 h-16 mx-auto opacity-20 mb-4 text-[var(--text-secondary)]" />
                    <p className="text-[var(--text-secondary)]">اختر صفًا وفصلاً دراسيًا لبدء إدارة المحتوى.</p>
                </div>
            )}
            
            <UnitModal isOpen={['add-unit', 'edit-unit'].includes(modalState.type || '')} onClose={closeModal} onSave={handleSaveUnit} unit={modalState.data.unit} teachers={teachers} selectedGrade={selectedGrade}/>
            <LessonModal isOpen={['add-lesson', 'edit-lesson'].includes(modalState.type || '')} onClose={closeModal} onSave={handleSaveLesson} lesson={modalState.data.lesson} gradeName={selectedGrade?.name || ''} />
            <ConfirmationModal isOpen={modalState.type === 'delete-unit'} onClose={closeModal} onConfirm={handleDeleteUnit} title="تأكيد حذف الوحدة" message={`هل أنت متأكد من حذف وحدة "${modalState.data.unit?.title}" وكل دروسها؟`} />
            <ConfirmationModal isOpen={modalState.type === 'delete-lesson'} onClose={closeModal} onConfirm={handleDeleteLesson} title="تأكيد حذف الدرس" message={`هل أنت متأكد من حذف درس "${modalState.data.lesson?.title}"؟`} />
        </div>
    );
};

export default ContentManagementView;