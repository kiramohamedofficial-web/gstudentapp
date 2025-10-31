import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType, Teacher, QuizType, QuizQuestion } from '../../types';
import {
    getAllGrades, addLessonToUnit, updateLesson, deleteLesson,
    addUnitToSemester, updateUnit, deleteUnit, getAllTeachers, getUnitsForSemester, 
    getLessonsByUnit
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, DotsVerticalIcon, BookOpenIcon, VideoCameraIcon, DocumentTextIcon, ChevronDownIcon, SparklesIcon, XIcon } from '../common/Icons';
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
    const [quizEditorMode, setQuizEditorMode] = useState<'image' | 'mcq'>('image');
    const [aiSettings, setAiSettings] = useState({ topic: '', difficulty: 'متوسط' as 'سهل' | 'متوسط' | 'صعب', numQuestions: 5 });
    const [isGenerating, setIsGenerating] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const initialData = lesson ? { ...lesson } : { type: LessonType.EXPLANATION, correctAnswers: [] };
            if (!initialData.type) initialData.type = LessonType.EXPLANATION;
            setFormData(initialData);
            setQuizEditorMode(initialData.quizType === 'mcq' ? 'mcq' : 'image');
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
            if (!prev || !prev.questions) return prev;
    
            const newQuestions = [...prev.questions];
            const questionToUpdate = { ...newQuestions[qIndex] };
    
            if (field === 'options' && typeof optIndex === 'number' && Array.isArray(questionToUpdate.options)) {
                const newOptions = [...questionToUpdate.options];
                newOptions[optIndex] = value;
                questionToUpdate.options = newOptions;
            } else if (field === 'correctAnswerIndex') {
                questionToUpdate.correctAnswerIndex = Number(value);
            } else if (field === 'questionText' || field === 'imageUrl') {
                questionToUpdate[field] = value;
            }
    
            newQuestions[qIndex] = questionToUpdate;
            return { ...prev, questions: newQuestions };
        });
    };
    
    const removeQuestion = (qIndex: number) => {
        setFormData(prev => ({ ...prev, questions: (prev.questions || []).filter((_, i) => i !== qIndex) }));
    };

    const addBlankQuestion = () => {
        setFormData(prev => {
            const newQuestion: QuizQuestion = {
                questionText: '',
                options: ['', '', '', ''],
                correctAnswerIndex: 0,
                imageUrl: ''
            };
            return {
                ...prev,
                questions: [...(prev.questions || []), newQuestion]
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let dataToSave: Partial<Lesson> = { ...formData };

        if (dataToSave.type === LessonType.HOMEWORK || dataToSave.type === LessonType.EXAM) {
            dataToSave.quizType = quizEditorMode;
            
            if (quizEditorMode === 'image') {
                if (typeof dataToSave.correctAnswers === 'string') {
                    dataToSave.correctAnswers = (dataToSave.correctAnswers as string).split('\n').filter(Boolean);
                }
                dataToSave.questions = undefined;
            } else { // mcq mode
                dataToSave.imageUrl = undefined;
                dataToSave.correctAnswers = undefined;
            }
        } else {
            // If not a quiz, clear all quiz-related fields
            dataToSave.quizType = undefined;
            dataToSave.questions = undefined;
            dataToSave.imageUrl = undefined;
            dataToSave.correctAnswers = undefined;
            dataToSave.timeLimit = undefined;
            dataToSave.passingScore = undefined;
        }
        
        onSave(dataToSave as Lesson | Omit<Lesson, 'id'>);
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
                            <button type="button" onClick={() => setQuizEditorMode('image')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${quizEditorMode === 'image' ? 'bg-purple-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>امتحان من صورة</button>
                            <button type="button" onClick={() => setQuizEditorMode('mcq')} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${quizEditorMode === 'mcq' ? 'bg-purple-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>متعدد الاختيارات (MCQ)</button>
                        </div>
                        
                        {quizEditorMode === 'image' ? (
                            <div className="space-y-4">
                                <ImageUpload label="صورة الواجب/الامتحان" value={formData.imageUrl || ''} onChange={url => setFormData(p => ({...p, imageUrl: url}))} />
                                <textarea placeholder="الإجابات الصحيحة (كل إجابة في سطر)" name="correctAnswers" value={Array.isArray(formData.correctAnswers) ? formData.correctAnswers.join('\n') : formData.correctAnswers || ''} onChange={handleChange} rows={4} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] space-y-3">
                                    <h4 className="text-md font-semibold text-purple-400 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> إنشاء تلقائي بالذكاء الاصطناعي (اختياري)</h4>
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
                                
                                <div className="h-px bg-[var(--border-primary)] my-4"></div>
                                
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold">الأسئلة</h4>
                                    {(formData.questions || []).map((q, qIndex) => (
                                        <div key={qIndex} className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-lg text-[var(--text-primary)]">السؤال {qIndex + 1}</h4>
                                                <button type="button" onClick={() => removeQuestion(qIndex)} className="px-3 py-1 text-sm border border-red-500/50 text-red-500 rounded-md hover:bg-red-500/10">حذف</button>
                                            </div>
                                    
                                            <textarea
                                                value={q.questionText}
                                                onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                                placeholder="نص السؤال..."
                                                className="w-full p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"
                                                rows={3}
                                            />
                                            
                                            <ImageUpload
                                                label="صورة للسؤال (اختياري)"
                                                value={q.imageUrl || ''}
                                                onChange={url => handleQuestionChange(qIndex, 'imageUrl', url)}
                                            />
                                    
                                            <div>
                                                <p className="text-sm text-[var(--text-secondary)] mb-2">الخيارات (حدد الإجابة الصحيحة)</p>
                                                <div className="space-y-3">
                                                    {(q.options || ['', '', '', '']).map((opt, optIndex) => (
                                                        <div key={optIndex} className="flex items-center gap-3 p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                                                            <input
                                                                value={opt}
                                                                onChange={e => handleQuestionChange(qIndex, 'options', e.target.value, optIndex)}
                                                                placeholder={`الخيار ${String.fromCharCode(1575 + optIndex)}`}
                                                                className="w-full p-2 bg-transparent border-0 focus:ring-0"
                                                            />
                                                            <input
                                                                type="radio"
                                                                name={`correct_${qIndex}`}
                                                                checked={q.correctAnswerIndex === optIndex}
                                                                onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', optIndex)}
                                                                className="w-5 h-5 accent-purple-500 flex-shrink-0"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addBlankQuestion} className="w-full text-lg font-semibold text-center p-4 mt-4 rounded-md bg-purple-600/10 hover:bg-purple-600/20 border-2 border-dashed border-purple-600/30 text-purple-400">
                                        + أضف سؤال جديد
                                    </button>
                                </div>
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


const getLessonIcon = (type: LessonType) => {
    switch(type) {
        case LessonType.EXPLANATION: return VideoCameraIcon;
        case LessonType.HOMEWORK: return PencilIcon;
        case LessonType.EXAM: return BookOpenIcon;
        case LessonType.SUMMARY: return DocumentTextIcon;
        default: return BookOpenIcon;
    }
}

const LessonPartItem: React.FC<{ lesson: Lesson, onEdit: () => void, onDelete: () => void }> = ({ lesson, onEdit, onDelete }) => {
    const Icon = getLessonIcon(lesson.type);
    return (
        <div className="p-2 pl-3 bg-[var(--bg-secondary)] rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium">{lesson.title}</span>
            </div>
            <div className="flex gap-2">
                <button onClick={onEdit} className="p-1.5 text-[var(--text-secondary)] hover:text-yellow-400"><PencilIcon className="w-4 h-4"/></button>
                <button onClick={onDelete} className="p-1.5 text-[var(--text-secondary)] hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
            </div>
        </div>
    );
};

const AddPartButton: React.FC<{ type: LessonType, onClick: () => void }> = ({ type, onClick }) => {
    const labels: Record<LessonType, string> = {
        [LessonType.EXPLANATION]: "إضافة شرح",
        [LessonType.HOMEWORK]: "إضافة واجب",
        [LessonType.EXAM]: "إضافة امتحان",
        [LessonType.SUMMARY]: "إضافة ملخص",
    };
    const Icon = getLessonIcon(type);
    return (
        <button onClick={onClick} className="w-full text-sm p-2 rounded-lg bg-transparent border-2 border-dashed border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2">
            <Icon className="w-4 h-4" />
            {labels[type]}
        </button>
    );
};

const UnitItem: React.FC<{
  unit: Unit;
  teacherMap: Map<string, string>;
  lessonsForUnit: Lesson[];
  expanded: boolean;
  onToggle: () => void;
  isLoadingLessons: boolean;
  optionsMenuUnitId: string | null;
  setOptionsMenuUnitId: React.Dispatch<React.SetStateAction<string | null>>;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  openModal: (type: string, data?: any) => void;
}> = ({ unit, teacherMap, lessonsForUnit, expanded, onToggle, isLoadingLessons, optionsMenuUnitId, setOptionsMenuUnitId, optionsMenuRef, openModal }) => {
    
    const lessonCount = lessonsForUnit.length;
    const groupedLessons = useMemo(() => {
        if (!lessonsForUnit) return [];
        const lessonGroups: Record<string, { baseTitle: string, explanations: Lesson[], homeworks: Lesson[], exams: Lesson[], summaries: Lesson[] }> = {};
        lessonsForUnit.forEach(lesson => {
            const titleWithoutPrefix = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/i, '').trim();
            const baseTitle = titleWithoutPrefix.split(/[:\-(]/)[0].trim();
            if (!lessonGroups[baseTitle]) {
                lessonGroups[baseTitle] = { baseTitle, explanations: [], homeworks: [], exams: [], summaries: [] };
            }
            switch (lesson.type) {
                case LessonType.EXPLANATION: lessonGroups[baseTitle].explanations.push(lesson); break;
                case LessonType.HOMEWORK: lessonGroups[baseTitle].homeworks.push(lesson); break;
                case LessonType.EXAM: lessonGroups[baseTitle].exams.push(lesson); break;
                case LessonType.SUMMARY: lessonGroups[baseTitle].summaries.push(lesson); break;
            }
        });
        return Object.values(lessonGroups).sort((a, b) => a.baseTitle.localeCompare(b.baseTitle, 'ar-EG', { numeric: true }));
    }, [lessonsForUnit]);

    return (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
            <header onClick={onToggle} className="p-4 flex justify-between items-center cursor-pointer">
                <div className="flex items-center gap-3">
                    <ChevronDownIcon className={`w-6 h-6 text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{unit.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">أ. {teacherMap.get(unit.teacherId) || 'غير محدد'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">
                        {lessonCount > 0 ? `${lessonCount} أجزاء` : 'فارغ'}
                    </span>
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
            {expanded && (
                <div className="p-4 border-t border-[var(--border-primary)] space-y-6">
                    {isLoadingLessons ? <div className="flex justify-center py-4"><Loader /></div>
                     : groupedLessons.length > 0 ? (
                        groupedLessons.map(group => (
                            <div key={group.baseTitle} className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-primary)]">
                                <h4 className="font-bold text-lg mb-4 text-[var(--text-primary)]">{group.baseTitle}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">الشرح</h5>
                                        {group.explanations.map(l => <LessonPartItem key={l.id} lesson={l} onEdit={() => openModal('edit-lesson', {unit, lesson: l})} onDelete={() => openModal('delete-lesson', {unit, lesson: l})}/>)}
                                        {group.explanations.length === 0 && <AddPartButton type={LessonType.EXPLANATION} onClick={() => openModal('add-lesson', {unit, lesson: {type: LessonType.EXPLANATION, title: `${group.baseTitle} - شرح`}})}/>}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">الواجب</h5>
                                        {group.homeworks.map(l => <LessonPartItem key={l.id} lesson={l} onEdit={() => openModal('edit-lesson', {unit, lesson: l})} onDelete={() => openModal('delete-lesson', {unit, lesson: l})}/>)}
                                        {group.homeworks.length === 0 && <AddPartButton type={LessonType.HOMEWORK} onClick={() => openModal('add-lesson', {unit, lesson: {type: LessonType.HOMEWORK, title: `${group.baseTitle} - واجب`}})}/>}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">الامتحان</h5>
                                        {group.exams.map(l => <LessonPartItem key={l.id} lesson={l} onEdit={() => openModal('edit-lesson', {unit, lesson: l})} onDelete={() => openModal('delete-lesson', {unit, lesson: l})}/>)}
                                        {group.exams.length === 0 && <AddPartButton type={LessonType.EXAM} onClick={() => openModal('add-lesson', {unit, lesson: {type: LessonType.EXAM, title: `${group.baseTitle} - امتحان`}})}/>}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">الملخص</h5>
                                        {group.summaries.map(l => <LessonPartItem key={l.id} lesson={l} onEdit={() => openModal('edit-lesson', {unit, lesson: l})} onDelete={() => openModal('delete-lesson', {unit, lesson: l})}/>)}
                                        {group.summaries.length === 0 && <AddPartButton type={LessonType.SUMMARY} onClick={() => openModal('add-lesson', {unit, lesson: {type: LessonType.SUMMARY, title: `${group.baseTitle} - ملخص`}})}/>}
                                    </div>
                                </div>
                            </div>
                        ))
                     ) : (
                        <p className="text-center text-sm text-[var(--text-secondary)] py-4">لا توجد دروس في هذه الوحدة.</p>
                     )}
                    <button onClick={() => openModal('add-lesson', {unit, lesson: { type: LessonType.EXPLANATION }})} className="w-full p-3 border-2 border-dashed border-[var(--border-primary)] rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-solid transition-all">
                        <PlusIcon className="w-5 h-5 ml-2"/> 
                        إضافة درس جديد (ابدأ بإضافة شرح)
                    </button>
                </div>
            )}
        </div>
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
    const [units, setUnits] = useState<Unit[]>([]);
    const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({}); // Cache for lessons
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
    const [loadingLessons, setLoadingLessons] = useState<Set<string>>(new Set());
    const [optionsMenuUnitId, setOptionsMenuUnitId] = useState<string | null>(null);
    const optionsMenuRef = useRef<HTMLDivElement>(null);

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
    const closeModal = useCallback(() => setModalState({ type: null, data: {} }), []);
    const openModal = useCallback((type: string, data = {}) => setModalState({ type, data }), []);

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
        if (selectedGradeId && selectedSemesterId) {
            const fetchUnits = async () => {
                setIsLoadingUnits(true);
                setExpandedUnitId(null);
                setLessonsMap({});
                const fetchedUnits = await getUnitsForSemester(parseInt(selectedGradeId), selectedSemesterId);
                setUnits(fetchedUnits);
                setIsLoadingUnits(false);
            };
            fetchUnits();
        } else {
            setUnits([]);
        }
    }, [selectedGradeId, selectedSemesterId, dataVersion]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
                setOptionsMenuUnitId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedGrade = useMemo(() => grades.find(g => g.id.toString() === selectedGradeId), [grades, selectedGradeId]);
    const selectedSemester = useMemo(() => selectedGrade?.semesters.find(s => s.id === selectedSemesterId), [selectedGrade, selectedSemesterId]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);
    
    const handleToggleExpand = useCallback(async (unitId: string) => {
        const newExpandedId = expandedUnitId === unitId ? null : unitId;
        setExpandedUnitId(newExpandedId);

        if (newExpandedId && !lessonsMap[newExpandedId] && selectedGradeId && selectedSemesterId) {
            setLoadingLessons(prev => new Set(prev).add(unitId));
            try {
                const fetchedLessons = await getLessonsByUnit(newExpandedId);
                setLessonsMap(prevMap => ({ ...prevMap, [newExpandedId]: fetchedLessons }));
            } catch (error) {
                addToast('فشل تحميل الدروس لهذه الوحدة.', ToastType.ERROR);
            } finally {
                setLoadingLessons(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(unitId);
                    return newSet;
                });
            }
        }
    }, [expandedUnitId, lessonsMap, selectedGradeId, selectedSemesterId, addToast]);

    const handleSaveUnit = useCallback(async (unitData: Partial<Unit>) => {
        if (selectedGrade && selectedSemester) {
            try {
                if (modalState.data.unit?.id) { // Editing
                    await updateUnit(selectedGrade.id, selectedSemester.id, { ...modalState.data.unit, ...unitData });
                    addToast('تم تعديل الوحدة!', ToastType.SUCCESS);
                } else { // Adding
                    await addUnitToSemester(selectedGrade.id, selectedSemester.id, { ...unitData, teacherId: unitData.teacherId! } as Omit<Unit, 'id'|'lessons'>);
                    addToast('تمت إضافة الوحدة!', ToastType.SUCCESS);
                }
                refreshData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل حفظ الوحدة: ${error.message}`, ToastType.ERROR);
            }
        }
    }, [addToast, closeModal, modalState.data, refreshData, selectedGrade, selectedSemester]);

    const handleDeleteUnit = useCallback(async () => {
        const { unit } = modalState.data;
        if (selectedGrade && selectedSemester && unit) {
            try {
                await deleteUnit(selectedGrade.id, selectedSemester.id, unit.id);
                addToast('تم حذف الوحدة.', ToastType.SUCCESS);
                refreshData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل حذف الوحدة: ${error.message}`, ToastType.ERROR);
            }
        }
    }, [addToast, closeModal, modalState.data, refreshData, selectedGrade, selectedSemester]);
    
    const handleSaveLesson = useCallback(async (lessonData: Lesson | Omit<Lesson, 'id'>) => {
        const { unit } = modalState.data;
        if (selectedGrade && selectedSemester && unit) {
            try {
                if ('id' in lessonData && lessonData.id) { // Editing
                    await updateLesson(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                    addToast('تم تحديث الدرس', ToastType.SUCCESS);
                } else { // Adding
                    await addLessonToUnit(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                    addToast('تمت إضافة الدرس', ToastType.SUCCESS);
                }
                refreshData();
                closeModal();
            } catch(error: any) {
                 addToast(`فشل حفظ الدرس: ${error.message}`, ToastType.ERROR);
            }
        }
    }, [addToast, closeModal, modalState.data, refreshData, selectedGrade, selectedSemester]);

    const handleDeleteLesson = useCallback(async () => {
        const { unit, lesson } = modalState.data;
        if (selectedGrade && selectedSemester && unit && lesson) {
            try {
                await deleteLesson(selectedGrade.id, selectedSemester.id, unit.id, lesson.id);
                addToast('تم حذف الدرس.', ToastType.SUCCESS);
                refreshData();
                closeModal();
            } catch(error: any) {
                addToast(`فشل حذف الدرس: ${error.message}`, ToastType.ERROR);
            }
        }
    }, [addToast, closeModal, modalState.data, refreshData, selectedGrade, selectedSemester]);
    
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
                <select
                    value={selectedGradeId}
                    onChange={(e) => {
                        const newGradeId = e.target.value;
                        setSelectedGradeId(newGradeId);
                        const newGrade = grades.find(g => g.id.toString() === newGradeId);
                        setSelectedSemesterId(newGrade?.semesters[0]?.id || '');
                        setExpandedUnitId(null);
                    }}
                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                >
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <select value={selectedSemesterId} onChange={(e) => { setSelectedSemesterId(e.target.value); setExpandedUnitId(null); }} disabled={!selectedGrade} className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] transition-all disabled:opacity-50">
                    {selectedGrade?.semesters.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
            </div>

            <div className="space-y-4">
                {isLoadingUnits ? (
                    <div className="flex justify-center items-center py-20"><Loader /></div>
                ) : (
                    units.map(unit => (
                        <UnitItem
                            key={unit.id}
                            unit={unit}
                            teacherMap={teacherMap}
                            lessonsForUnit={lessonsMap[unit.id] || []}
                            expanded={expandedUnitId === unit.id}
                            onToggle={() => handleToggleExpand(unit.id)}
                            isLoadingLessons={loadingLessons.has(unit.id)}
                            optionsMenuUnitId={optionsMenuUnitId}
                            setOptionsMenuUnitId={setOptionsMenuUnitId}
                            optionsMenuRef={optionsMenuRef}
                            openModal={openModal}
                        />
                    ))
                )}
            </div>

            {selectedSemester && !isLoadingUnits && (
                <button onClick={() => openModal('add-unit', { grade: selectedGrade, semester: selectedSemester })} className="w-full p-6 border-2 border-dashed border-[var(--border-primary)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-solid transition-all">
                    <PlusIcon className="w-6 h-6 ml-2"/> 
                    <span className="font-semibold">إضافة وحدة جديدة</span>
                </button>
            )}

            {!selectedSemester && !isLoadingUnits && (
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
