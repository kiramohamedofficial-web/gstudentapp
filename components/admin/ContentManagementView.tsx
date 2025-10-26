import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType, Teacher } from '../../types';
import { 
    getAllGrades, addLessonToUnit, updateLesson, deleteLesson,
    addUnitToSemester, updateUnit, deleteUnit, addActivityLog, getAllTeachers
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, VideoCameraIcon, DocumentTextIcon, BookOpenIcon, DotsVerticalIcon, CollectionIcon, ChevronDownIcon, UserCircleIcon, ShieldExclamationIcon } from '../common/Icons';
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
        <p className="text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">تأكيد الحذف</button>
        </div>
    </Modal>
);

// Unit Edit Modal Component
const UnitEditModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (title: string, teacherId: string) => void; 
    unit?: Unit | null; 
    teachers: Teacher[];
    preselectedTeacherId?: string;
}> = ({ isOpen, onClose, onSave, unit, teachers, preselectedTeacherId }) => {
    const [title, setTitle] = useState('');
    const [teacherId, setTeacherId] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (unit) { // Editing
                setTitle(unit.title || '');
                setTeacherId(unit.teacherId || '');
            } else { // Adding
                setTitle('');
                setTeacherId(preselectedTeacherId || '');
            }
        }
    }, [unit, isOpen, preselectedTeacherId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && teacherId) {
            onSave(title.trim(), teacherId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={unit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="unitTitle" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">عنوان الوحدة</label>
                    <input id="unitTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label htmlFor="teacherId" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">المدرس</label>
                    <select id="teacherId" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-purple-500 focus:border-purple-500">
                        <option value="">اختر المدرس</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="flex justify-end mt-6">
                    <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button>
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
        imageUrl: lesson?.imageUrl || '',
        correctAnswers: lesson?.correctAnswers || [],
        timeLimit: lesson?.timeLimit || 0,
        passingScore: lesson?.passingScore || 50,
    });
    const [data, setData] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setData(getInitialState());
            setError('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lesson, prefill, isOpen]);
    
    const handleChange = (field: keyof typeof data, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) { // 1MB Limit
                setError('حجم الصورة يجب ألا يتجاوز 1 ميجابايت.');
                e.target.value = ''; // Reset file input
                return;
            }
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('imageUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCorrectAnswersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const answers = e.target.value.split(',').map(a => a.trim());
        handleChange('correctAnswers', answers);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!data.title.trim()) { setError('عنوان الدرس مطلوب.'); return; }

        let lessonToSave: any = { ...data };

        if (data.type === LessonType.EXPLANATION) {
            if (!/^[a-zA-Z0-9_-]{11}$/.test(data.content)) {
                const videoId = parseYouTubeVideoId(data.content);
                if (data.content && !videoId) {
                    setError('رابط يوتيوب غير صالح أو معرف فيديو غير صحيح.');
                    return;
                }
                lessonToSave.content = videoId || '';
            }
        }
        
        if (data.type === LessonType.HOMEWORK || data.type === LessonType.EXAM) {
            if (!data.imageUrl) {
                setError('الرجاء رفع صورة للواجب أو الامتحان.');
                return;
            }
            if (data.correctAnswers.length === 0 || (data.correctAnswers.length === 1 && !data.correctAnswers[0])) {
                setError('الرجاء إدخال إجابة صحيحة واحدة على الأقل.');
                return;
            }
            lessonToSave = {
                ...data,
                correctAnswers: data.correctAnswers.filter(Boolean), // remove empty strings from array
                content: '', // Clear content field for image quizzes
            };
        } else {
            lessonToSave.imageUrl = '';
            lessonToSave.correctAnswers = [];
        }

        lessonToSave.timeLimit = Number(data.timeLimit);
        lessonToSave.passingScore = Number(data.passingScore);

        if (lesson) {
            onSave({ ...lesson, ...lessonToSave });
        } else {
            onSave(lessonToSave);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <input type="text" placeholder="عنوان الدرس" value={data.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" required />
                <select value={data.type} onChange={(e) => handleChange('type', e.target.value as LessonType)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" disabled={!!prefill?.type}>
                    {Object.values(LessonType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                {data.type === LessonType.EXPLANATION && <input type="text" placeholder="الصق رابط يوتيوب أو أدخل معرف الفيديو" value={data.content} onChange={(e) => handleChange('content', e.target.value)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />}
                {data.type === LessonType.SUMMARY && <textarea placeholder="اكتب الملخص هنا (يدعم HTML)" value={data.content} onChange={(e) => handleChange('content', e.target.value)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" rows={5} required />}
                
                {(data.type === LessonType.HOMEWORK || data.type === LessonType.EXAM) && (
                    <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">صورة الامتحان (1 ميجا بحد أقصى)</label>
                            <input type="file" onChange={handleImageUpload} accept="image/*" className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                            {data.imageUrl && <img src={data.imageUrl} alt="Preview" className="mt-4 rounded-lg border border-[var(--border-primary)] max-h-60 w-auto" />}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الإجابات الصحيحة (افصل بينها بفاصلة ,)</label>
                            <input type="text" value={(data.correctAnswers || []).join(',')} onChange={handleCorrectAnswersChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" placeholder="الإجابة 1, الإجابة 2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-sm text-[var(--text-secondary)]">الوقت المحدد (بالدقائق)</label>
                                <input type="number" placeholder="0 لترك الوقت مفتوح" value={data.timeLimit} onChange={(e) => handleChange('timeLimit', e.target.value)} className="w-full mt-1 p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                            </div>
                            <div>
                                <label className="text-sm text-[var(--text-secondary)]">درجة النجاح (%)</label>
                                <input type="number" placeholder="مثال: 50" value={data.passingScore} onChange={(e) => handleChange('passingScore', e.target.value)} min="0" max="100" className="w-full mt-1 p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                            </div>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ الدرس</button></div>
            </form>
        </Modal>
    );
};

const lessonTypeDetails: Record<LessonType, { icon: React.FC<{className?: string}>, label: string }> = {
    [LessonType.EXPLANATION]: { icon: VideoCameraIcon, label: 'شرح' },
    [LessonType.HOMEWORK]: { icon: PencilIcon, label: 'واجب' },
    [LessonType.EXAM]: { icon: BookOpenIcon, label: 'امتحان' },
    [LessonType.SUMMARY]: { icon: DocumentTextIcon, label: 'ملخص' },
};

interface GroupedLesson { baseTitle: string; parts: Partial<Record<LessonType, Lesson>>; }
interface ModalData { grade?: Grade; semester?: Semester; unit?: Unit; lesson?: Lesson; prefill?: Partial<Lesson>; group?: GroupedLesson; }

// --- Sub-components for Accordion Layout ---
const DropdownMenu: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsOpen(p => !p)} className="p-1 rounded-full hover:bg-black/10"><DotsVerticalIcon className="w-5 h-5"/></button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-36 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-lg z-20 text-sm">
                    <button onClick={() => handleAction(onEdit)} className="w-full text-right px-3 py-2 hover:bg-[var(--bg-tertiary)] flex items-center"><PencilIcon className="w-4 h-4 ml-2"/> تعديل</button>
                    <button onClick={() => handleAction(onDelete)} className="w-full text-right px-3 py-2 hover:bg-[var(--bg-tertiary)] flex items-center text-red-500"><TrashIcon className="w-4 h-4 ml-2"/> حذف</button>
                </div>
            )}
        </div>
    );
};

const UnitAccordion: React.FC<{ unit: Unit; grade: Grade; semester: Semester; openModal: (type: string, data: Partial<ModalData>) => void; teachers: Teacher[] }> = ({ unit, grade, semester, openModal, teachers }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const teacherName = useMemo(() => teachers.find(t => t.id === unit.teacherId)?.name || 'غير معروف', [teachers, unit.teacherId]);

    const groupedLessons = useMemo(() => {
        return Object.values(unit.lessons.reduce((acc, lesson) => {
            const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
            if (!acc[baseTitle]) {
                acc[baseTitle] = { baseTitle, parts: {} };
            }
            acc[baseTitle].parts[lesson.type] = lesson;
            return acc;
        }, {} as Record<string, GroupedLesson>));
    }, [unit.lessons]);

    return (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden transition-all duration-300">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-4 text-right hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <span className="px-2 py-1 text-xs font-mono rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{groupedLessons.length} دروس</span>
                    <div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{unit.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><UserCircleIcon className="w-3 h-3"/> {teacherName}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <DropdownMenu
                        onEdit={() => openModal('edit-unit', { grade, semester, unit })}
                        onDelete={() => openModal('delete-unit', { grade, semester, unit })}
                    />
                    <ChevronDownIcon className={`w-6 h-6 text-[var(--text-secondary)] mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-[var(--border-primary)] space-y-3 fade-in">
                    {groupedLessons.map(group => (
                        <div key={group.baseTitle} className="bg-[var(--bg-tertiary)] rounded-lg p-3 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-md text-[var(--text-primary)]">{group.baseTitle}</p>
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                    {Object.entries(group.parts).map(([type, lesson]) => {
                                        if(!lesson) return null;
                                        const details = lessonTypeDetails[type as LessonType];
                                        return <span key={type} title={details.label} className="flex items-center text-xs px-2 py-1 rounded-full bg-black/10 text-[var(--text-secondary)]"><details.icon className="w-4 h-4 ml-1"/> {details.label}</span>
                                    })}
                                </div>
                            </div>
                            <DropdownMenu
                                onEdit={() => {
                                    const firstLesson = Object.values(group.parts)[0];
                                    if(firstLesson) openModal('edit-lesson', { grade, semester, unit, lesson: firstLesson });
                                }}
                                onDelete={() => openModal('delete-group', { grade, semester, unit, group })}
                            />
                        </div>
                    ))}
                    {groupedLessons.length === 0 && <p className="text-center text-sm text-[var(--text-secondary)] py-4">لا توجد دروس في هذه الوحدة.</p>}
                    
                    <div className="pt-3 mt-3 border-t border-[var(--border-primary)]/50">
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">إضافة جزء جديد:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            {(Object.keys(lessonTypeDetails) as LessonType[]).map(type => (
                                <button key={type} onClick={() => openModal('add-lesson', { grade, semester, unit, prefill: { type }})} className="flex items-center justify-center p-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)]/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                    <PlusIcon className="w-4 h-4 ml-1"/> {lessonTypeDetails[type].label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Component
const ContentManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const grades = useMemo(() => getAllGrades(), [dataVersion]);
    const [modalState, setModalState] = useState<{ type: string | null; data: Partial<ModalData> }>({ type: null, data: {} });
    const { addToast } = useToast();

    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
    
    useEffect(() => {
        const fetchAndSetTeachers = async () => {
            const data = await getAllTeachers();
            setTeachers(data);
        };
        fetchAndSetTeachers();
    }, [dataVersion]);
    
    const selectedGrade = useMemo(() => grades.find(g => g.id.toString() === selectedGradeId), [grades, selectedGradeId]);
    const selectedSemester = useMemo(() => selectedGrade?.semesters.find(s => s.id === selectedSemesterId), [selectedGrade, selectedSemesterId]);
    
    const units = useMemo(() => {
        let unitsToShow = selectedSemester?.units || [];
        if (selectedTeacherId) {
            unitsToShow = unitsToShow.filter(u => u.teacherId === selectedTeacherId);
        }
        return unitsToShow;
    }, [selectedSemester, selectedTeacherId]);

    const handleSelectGrade = (gradeId: string) => {
        setSelectedGradeId(gradeId);
        setSelectedSemesterId('');
    };

    const refreshData = () => setDataVersion(v => v + 1);

    const handleSaveUnit = (title: string, teacherId: string) => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester) {
            if (unit) {
                updateUnit(grade.id, semester.id, { ...unit, title, teacherId });
                addActivityLog('Content Update', `Unit "${unit.title}" updated.`);
                addToast('تم تعديل الوحدة بنجاح!', ToastType.SUCCESS);
            } else {
                addUnitToSemester(grade.id, semester.id, { title, teacherId, track: 'All' });
                addActivityLog('Content Add', `New unit "${title}" added.`);
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
            (Object.values(group.parts) as (Lesson | undefined)[]).forEach(lesson => {
                if(lesson) deleteLesson(grade.id, semester.id, unit.id, lesson.id);
            });
            addActivityLog('Content Delete', `Lesson group "${group.baseTitle}" deleted.`);
            addToast('تم حذف مجموعة الدرس بنجاح.', ToastType.SUCCESS);
        }
        refreshData();
        setModalState({ type: null, data: {} });
    };

    const openModal = (type: string, data: Partial<ModalData>) => setModalState({ type, data });
    
    return (
        <div className="flex flex-col h-full">
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg p-4 mb-6 flex items-start gap-3">
                <ShieldExclamationIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold">تنبيه للمشرفين</h4>
                    <p>نظام إدارة المحتوى الحالي لا يدعم التعديلات المتزامنة. لتجنب فقدان البيانات، يرجى التنسيق مع المشرفين الآخرين قبل إجراء أي تغييرات على المنهج.</p>
                </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المحتوى التعليمي</h1>
                    <p className="text-[var(--text-secondary)] mt-1">فلترة المحتوى حسب المدرس وتنظيمه بسهولة.</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse self-end sm:self-center">
                     <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="w-40 p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                        <option value="">كل المدرسين</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select value={selectedGradeId} onChange={(e) => handleSelectGrade(e.target.value)} className="w-40 p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                        <option value="">اختر الصف</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <select value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)} disabled={!selectedGrade} className="w-48 p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-50">
                        <option value="">اختر الفصل الدراسي</option>
                        {selectedGrade?.semesters.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {selectedSemester ? (
                     <div className="space-y-4">
                        {units.map(unit => (
                            <UnitAccordion key={unit.id} unit={unit} grade={selectedGrade!} semester={selectedSemester} openModal={openModal} teachers={teachers} />
                        ))}
                        <button onClick={() => openModal('add-unit', { grade: selectedGrade, semester: selectedSemester })} className="w-full text-center p-3 rounded-xl bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border-2 border-dashed border-[var(--border-primary)] hover:border-[var(--accent-primary)]">
                            <PlusIcon className="w-6 h-6 inline-block mr-2"/> إضافة وحدة جديدة
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-[var(--text-secondary)] p-4 min-h-[50vh]">
                        <div>
                            <CollectionIcon className="w-16 h-16 mx-auto opacity-20 mb-4" />
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">ابدأ التنظيم</h3>
                            <p>اختر مدرسًا وصفًا دراسيًا لعرض الوحدات والدروس.</p>
                        </div>
                    </div>
                )}
            </div>
            
            <UnitEditModal isOpen={['add-unit', 'edit-unit'].includes(modalState.type || '')} onClose={() => setModalState({ type: null, data: {} })} onSave={handleSaveUnit} unit={modalState.type === 'edit-unit' ? modalState.data.unit : null} teachers={teachers} preselectedTeacherId={selectedTeacherId} />
            <LessonEditModal isOpen={['add-lesson', 'edit-lesson'].includes(modalState.type || '')} onClose={() => setModalState({ type: null, data: {} })} onSave={handleSaveLesson} lesson={modalState.type === 'edit-lesson' ? modalState.data.lesson : null} prefill={modalState.type === 'add-lesson' ? modalState.data.prefill : undefined} />
            <ConfirmationModal isOpen={modalState.type === 'delete-unit'} onClose={() => setModalState({ type: null, data: {} })} onConfirm={handleDeleteUnit} title="تأكيد حذف الوحدة" message={`هل أنت متأكد من رغبتك في حذف وحدة "${modalState.data.unit?.title}"؟ سيتم حذف جميع الدروس المرتبطة بها بشكل دائم.`} />
            <ConfirmationModal isOpen={modalState.type === 'delete-lesson'} onClose={() => setModalState({ type: null, data: {} })} onConfirm={handleDeleteLesson} title="تأكيد حذف جزء من الدرس" message={`هل أنت متأكد من رغبتك في حذف "${modalState.data.lesson?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`} />
            <ConfirmationModal isOpen={modalState.type === 'delete-group'} onClose={() => setModalState({ type: null, data: {} })} onConfirm={handleDeleteGroup} title="تأكيد حذف مجموعة الدرس" message={`هل أنت متأكد من رغبتك في حذف درس "${modalState.data.group?.baseTitle}" بجميع أجزائه (الشرح، الواجب، ...إلخ)؟ لا يمكن التراجع عن هذا الإجراء.`} />
        </div>
    );
};

export default ContentManagementView;