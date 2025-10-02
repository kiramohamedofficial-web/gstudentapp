
import React, { useState, useMemo, useEffect } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, Question, ToastType } from '../../types';
import { 
    getAllGrades, 
    addLessonToUnit, 
    updateLesson,
    deleteLesson,
    addUnitToSemester,
    updateUnit,
    deleteUnit,
    addActivityLog 
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, VideoCameraIcon, DocumentTextIcon, BookOpenIcon, SparklesIcon } from '../common/Icons';
import { useToast } from '../../useToast';

// Helper to parse YouTube video ID from various URL formats
const parseYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// Confirmation Modal Component
const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-700 transition-colors">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">تأكيد الحذف</button>
        </div>
    </Modal>
);

// Unit Edit Modal Component
const UnitEditModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (title: string) => void; unit?: Unit | null; }> = ({ isOpen, onClose, onSave, unit }) => {
    const [title, setTitle] = useState('');
    useEffect(() => {
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
                <label htmlFor="unitTitle" className="block text-sm font-medium text-slate-300 mb-2">عنوان الوحدة</label>
                <input
                    id="unitTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                    required
                />
                <div className="flex justify-end mt-6">
                    <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

// Lesson Edit Modal Component
const LessonEditModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (lesson: Omit<Lesson, 'id' | 'isCompleted'> | Lesson) => void; lesson?: Lesson | null; prefill?: Partial<Lesson> }> = ({ isOpen, onClose, onSave, lesson, prefill }) => {
    const getInitialState = () => ({
        title: lesson?.title || prefill?.title || '',
        type: lesson?.type || prefill?.type || LessonType.EXPLANATION,
        content: lesson?.content || '',
        questions: lesson?.questions || [],
    });
    const [data, setData] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setData(getInitialState());
            setError('');
        }
    }, [lesson, prefill, isOpen]);
    
    const handleChange = (field: keyof typeof data, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
        const newQuestions = [...data.questions];
        (newQuestions[qIndex] as any)[field] = value;
        handleChange('questions', newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...data.questions];
        newQuestions[qIndex].options[oIndex] = value;
        handleChange('questions', newQuestions);
    };

    const addQuestion = () => {
        const newQuestion: Question = { id: `q_new_${Date.now()}`, text: '', options: ['', '', '', ''], correctAnswer: '' };
        handleChange('questions', [...data.questions, newQuestion]);
    };
    
    const removeQuestion = (qIndex: number) => {
        handleChange('questions', data.questions.filter((_, i) => i !== qIndex));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!data.title.trim()) { setError('عنوان الدرس مطلوب.'); return; }

        let finalContent = data.content;
        if (data.type === LessonType.EXPLANATION) {
            if (!/^[a-zA-Z0-9_-]{11}$/.test(data.content)) {
                const videoId = parseYouTubeVideoId(data.content);
                if (data.content && !videoId) {
                    setError('رابط يوتيوب غير صالح أو معرف فيديو غير صحيح.');
                    return;
                }
                finalContent = videoId || '';
            }
        }

        const lessonToSave = { ...data, content: finalContent };
        if (lesson) {
            onSave({ ...lesson, ...lessonToSave });
        } else {
            onSave(lessonToSave);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <input type="text" placeholder="عنوان الدرس" value={data.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600" required />
                <select value={data.type} onChange={(e) => handleChange('type', e.target.value as LessonType)} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600" disabled={!!prefill?.type}>
                    {Object.values(LessonType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {data.type === LessonType.EXPLANATION && <input type="text" placeholder="الصق رابط يوتيوب أو أدخل معرف الفيديو" value={data.content} onChange={(e) => handleChange('content', e.target.value)} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600" />}
                {data.type === LessonType.SUMMARY && <textarea placeholder="اكتب الملخص هنا (يدعم HTML)" value={data.content} onChange={(e) => handleChange('content', e.target.value)} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600" rows={5} required />}
                
                {(data.type === LessonType.HOMEWORK || data.type === LessonType.EXAM) && (
                    <div className="space-y-4 pt-2 border-t border-slate-600">
                        <h4 className="font-semibold">بنك الأسئلة</h4>
                        {data.questions.map((q, qIndex) => (
                            <div key={q.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 relative">
                                <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute top-2 left-2 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                <textarea placeholder={`نص السؤال ${qIndex + 1}`} value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} className="w-full p-2 mb-2 rounded-md bg-slate-700 border border-slate-600 text-sm" rows={2} required></textarea>
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center">
                                            <input type="text" placeholder={`الخيار ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-xs" required/>
                                            <button type="button" title="تعيين كإجابة صحيحة" onClick={() => handleQuestionChange(qIndex, 'correctAnswer', opt)} className={`mr-2 ${q.correctAnswer === opt ? 'text-green-400' : 'text-slate-500'}`}><CheckCircleIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addQuestion} className="w-full text-sm py-2 px-4 bg-slate-600/50 hover:bg-slate-600 rounded-md transition-colors">+ إضافة سؤال جديد</button>
                    </div>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">حفظ الدرس</button></div>
            </form>
        </Modal>
    );
};

const lessonTypeDetails: Record<LessonType, { icon: React.FC<{className?: string}>, label: string, verb: string }> = {
    [LessonType.EXPLANATION]: { icon: VideoCameraIcon, label: 'شرح', verb: 'إضافة شرح' },
    [LessonType.HOMEWORK]: { icon: PencilIcon, label: 'واجب', verb: 'إضافة واجب' },
    [LessonType.EXAM]: { icon: BookOpenIcon, label: 'امتحان', verb: 'إضافة امتحان' },
    [LessonType.SUMMARY]: { icon: DocumentTextIcon, label: 'ملخص', verb: 'إضافة ملخص' },
};

interface GroupedLesson {
    baseTitle: string;
    parts: Partial<Record<LessonType, Lesson>>;
}

// Fix: Add a specific type for modal data to avoid `any` and subsequent errors.
interface ModalData {
    grade?: Grade;
    semester?: Semester;
    unit?: Unit;
    lesson?: Lesson;
    prefill?: Partial<Lesson>;
    group?: GroupedLesson;
}

const LessonGroupCard: React.FC<{
    group: GroupedLesson;
    grade: Grade;
    semester: Semester;
    unit: Unit;
    openModal: (type: string, data: Partial<ModalData>) => void;
}> = ({ group, grade, semester, unit, openModal }) => {
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const availableParts = Object.values(lessonTypeDetails);
    const missingParts = availableParts.filter(p => !group.parts[p.label as LessonType]);

    const handleAddPart = (type: LessonType) => {
        setAddMenuOpen(false);
        const titlePrefix = type === LessonType.EXPLANATION ? 'شرح' : type === LessonType.HOMEWORK ? 'واجب' : type === LessonType.EXAM ? 'امتحان' : 'ملخص';
        openModal('add-lesson', {
            grade, semester, unit,
            prefill: {
                title: `${titlePrefix} ${group.baseTitle}`,
                type,
            }
        });
    };

    return (
        <div className="bg-[var(--bg-secondary)] p-3 rounded-md border border-[var(--border-primary)]">
            <div className="flex justify-between items-center">
                <p className="font-bold text-md text-[var(--text-primary)]">{group.baseTitle}</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="relative">
                        <button onClick={() => setAddMenuOpen(p => !p)} className="text-green-400 hover:text-green-300"><PlusIcon className="w-5 h-5"/></button>
                        {addMenuOpen && (
                            <div className="absolute left-0 mt-2 w-36 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md shadow-lg z-10">
                                {missingParts.map(part => (
                                    <button key={part.label} onClick={() => handleAddPart(part.label as LessonType)} className="w-full text-right px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] flex items-center">
                                        <part.icon className="w-4 h-4 ml-2 text-[var(--text-secondary)]" /> {part.verb}
                                    </button>
                                ))}
                                {missingParts.length === 0 && <span className="block text-center text-xs p-2 text-[var(--text-secondary)]">كل الأجزاء مضافة</span>}
                            </div>
                        )}
                    </div>
                    <button onClick={() => openModal('delete-group', { grade, semester, unit, group })} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="mt-2 space-y-1 pr-2 border-r-2 border-[var(--border-primary)]">
                {Object.values(group.parts).map(lesson => {
                    if (!lesson) return null;
                    const { icon: Icon } = lessonTypeDetails[lesson.type];
                    return (
                        <div key={lesson.id} className="flex justify-between items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)]/30">
                            <div className="flex items-center space-x-2 space-x-reverse text-sm text-[var(--text-secondary)]">
                                <Icon className="w-4 h-4 text-[var(--accent-secondary)]" />
                                <span>{lesson.title}</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <button onClick={() => openModal('edit-lesson', { grade, semester, unit, lesson })} className="text-yellow-400 hover:text-yellow-300"><PencilIcon className="w-4 h-4"/></button>
                                <button onClick={() => openModal('delete-lesson', { grade, semester, unit, lesson })} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// Main Component
const ContentManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const grades = useMemo(() => getAllGrades(), [dataVersion]);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [modalState, setModalState] = useState<{ type: string | null; data: Partial<ModalData> }>({ type: null, data: {} });
    const { addToast } = useToast();

    const refreshData = () => setDataVersion(v => v + 1);

    const toggleExpand = (id: string) => setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

    const handleSaveUnit = (title: string) => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester) {
            if (unit) {
                updateUnit(grade.id, semester.id, { ...unit, title });
                addActivityLog('Content Update', `Unit "${unit.title}" updated to "${title}".`);
                addToast('تم تعديل الوحدة بنجاح!', ToastType.SUCCESS);
            } else {
                addUnitToSemester(grade.id, semester.id, title);
                addActivityLog('Content Add', `New unit "${title}" added to ${semester.title}.`);
                addToast('تمت إضافة الوحدة بنجاح!', ToastType.SUCCESS);
            }
        }
        refreshData();
        setModalState({ type: null, data: {} });
    };

    const handleDeleteUnit = () => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester && unit) {
            deleteUnit(grade.id, semester.id, unit.id);
            addActivityLog('Content Delete', `Unit "${unit.title}" deleted.`);
            addToast('تم حذف الوحدة بنجاح.', ToastType.SUCCESS);
        }
        refreshData();
        setModalState({ type: null, data: {} });
    };

    const handleSaveLesson = (lessonData: Omit<Lesson, 'id' | 'isCompleted'> | Lesson) => {
        const { grade, semester, unit, lesson } = modalState.data;
        if (grade && semester && unit) {
            if (lesson) {
                updateLesson(grade.id, semester.id, unit.id, lessonData as Lesson);
                addActivityLog('Content Update', `Lesson "${lesson.title}" updated.`);
                addToast('تم تعديل الدرس بنجاح!', ToastType.SUCCESS);
            } else {
                addLessonToUnit(grade.id, semester.id, unit.id, lessonData);
                addActivityLog('Content Add', `New lesson "${lessonData.title}" added to ${unit.title}.`);
                addToast('تمت إضافة الدرس بنجاح!', ToastType.SUCCESS);
            }
        }
        refreshData();
        setModalState({ type: null, data: {} });
    };
    
    const handleDeleteLesson = () => {
        const { grade, semester, unit, lesson } = modalState.data;
        if (grade && semester && unit && lesson) {
            deleteLesson(grade.id, semester.id, unit.id, lesson.id);
            addActivityLog('Content Delete', `Lesson "${lesson.title}" deleted.`);
            addToast('تم حذف الدرس بنجاح.', ToastType.SUCCESS);
        }
        refreshData();
        setModalState({ type: null, data: {} });
    };

    const handleDeleteGroup = () => {
        const { grade, semester, unit, group } = modalState.data;
        if (grade && semester && unit && group) {
            Object.values(group.parts).forEach(lesson => {
                if(lesson) {
                    deleteLesson(grade.id, semester.id, unit.id, lesson.id);
                }
            });
            addActivityLog('Content Delete', `Lesson group "${group.baseTitle}" deleted.`);
            addToast('تم حذف مجموعة الدرس بنجاح.', ToastType.SUCCESS);
        }
        refreshData();
        setModalState({ type: null, data: {} });
    };

    const openModal = (type: string, data: Partial<ModalData>) => setModalState({ type, data });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة المحتوى التعليمي</h1>
            <p className="mb-8 text-[var(--text-secondary)]">تحكم كامل في المنهج الدراسي: قم بتجميع الدروس وأجزائها (شرح، واجب، امتحان) في مكان واحد.</p>
            <div className="space-y-2">
                {grades.map(grade => (
                    <div key={grade.id} className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                        <button onClick={() => toggleExpand(`g-${grade.id}`)} className="w-full text-right p-4 flex justify-between items-center hover:bg-[var(--bg-secondary)]/50">
                            <span className="text-lg font-bold">{grade.name}</span>
                            <svg className={`w-5 h-5 transform transition-transform ${expandedIds[`g-${grade.id}`] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {expandedIds[`g-${grade.id}`] && <div className="p-2 md:p-4 border-t border-[var(--border-primary)] space-y-2">
                            {grade.semesters.map(semester => (
                                <div key={semester.id} className="bg-[var(--bg-primary)]/30 p-3 rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-[var(--text-secondary)]">{semester.title}</h3>
                                        <button onClick={() => openModal('add-unit', { grade, semester })} className="flex items-center text-xs px-2 py-1 bg-cyan-600/50 hover:bg-cyan-600 rounded-md"><PlusIcon className="w-4 h-4 ml-1"/> إضافة مادة</button>
                                    </div>
                                    <div className="space-y-2 pl-2 border-r-2 border-[var(--border-primary)]">
                                        {semester.units.map(unit => {
                                            // Fix: Correctly typed the reduce accumulator by casting the initial value to avoid errors with generic type arguments.
                                            const groupedLessons = unit.lessons.reduce((acc, lesson) => {
                                                const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
                                                if (!acc[baseTitle]) {
                                                    acc[baseTitle] = { baseTitle, parts: {} };
                                                }
                                                acc[baseTitle].parts[lesson.type] = lesson;
                                                return acc;
                                            }, {} as Record<string, GroupedLesson>);

                                            return (
                                                <div key={unit.id} className="bg-[var(--bg-primary)] p-3 rounded-md">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold text-md">{unit.title}</p>
                                                        <div className="flex items-center space-x-2 space-x-reverse">
                                                            <button onClick={() => openModal('add-lesson', { grade, semester, unit })} className="text-green-400 hover:text-green-300"><PlusIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => openModal('edit-unit', { grade, semester, unit })} className="text-yellow-400 hover:text-yellow-300"><PencilIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => openModal('delete-unit', { grade, semester, unit })} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 space-y-2">
                                                        {Object.values(groupedLessons).map(group => (
                                                            <LessonGroupCard key={group.baseTitle} group={group} grade={grade} semester={semester} unit={unit} openModal={openModal} />
                                                        ))}
                                                        <button onClick={() => openModal('add-lesson', { grade, semester, unit })} className="w-full text-center text-sm py-2 px-3 mt-2 bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] rounded-md transition-colors text-[var(--text-secondary)]">
                                                            + إضافة درس جديد...
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>}
                    </div>
                ))}
            </div>
            
            <UnitEditModal 
                isOpen={['add-unit', 'edit-unit'].includes(modalState.type || '')}
                onClose={() => setModalState({ type: null, data: {} })}
                onSave={handleSaveUnit}
                unit={modalState.type === 'edit-unit' ? modalState.data.unit : null}
            />
            <LessonEditModal
                isOpen={['add-lesson', 'edit-lesson'].includes(modalState.type || '')}
                onClose={() => setModalState({ type: null, data: {} })}
                onSave={handleSaveLesson}
                lesson={modalState.type === 'edit-lesson' ? modalState.data.lesson : null}
                prefill={modalState.type === 'add-lesson' ? modalState.data.prefill : undefined}
            />
            <ConfirmationModal
                isOpen={modalState.type === 'delete-unit'}
                onClose={() => setModalState({ type: null, data: {} })}
                onConfirm={handleDeleteUnit}
                title="تأكيد حذف المادة"
                message={`هل أنت متأكد من رغبتك في حذف مادة "${modalState.data.unit?.title}"؟ سيتم حذف جميع الدروس المرتبطة بها بشكل دائم.`}
            />
             <ConfirmationModal
                isOpen={modalState.type === 'delete-lesson'}
                onClose={() => setModalState({ type: null, data: {} })}
                onConfirm={handleDeleteLesson}
                title="تأكيد حذف جزء من الدرس"
                message={`هل أنت متأكد من رغبتك في حذف "${modalState.data.lesson?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
            />
            <ConfirmationModal
                isOpen={modalState.type === 'delete-group'}
                onClose={() => setModalState({ type: null, data: {} })}
                onConfirm={handleDeleteGroup}
                title="تأكيد حذف مجموعة الدرس"
                message={`هل أنت متأكد من رغبتك في حذف درس "${modalState.data.group?.baseTitle}" بجميع أجزائه (الشرح، الواجب، ...إلخ)؟ لا يمكن التراجع عن هذا الإجراء.`}
            />
        </div>
    );
};

export default ContentManagementView;
