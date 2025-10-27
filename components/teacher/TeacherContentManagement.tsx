import React, { useState, useMemo, useCallback } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType, Teacher } from '../../types';
import {
    getAllGrades, addLessonToUnit, updateLesson, deleteLesson,
    addUnitToSemester, updateUnit, deleteUnit, addActivityLog
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CollectionIcon, ChevronDownIcon, VideoCameraIcon, DocumentTextIcon, BookOpenIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import ImageUpload from '../common/ImageUpload';

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
const LessonModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Lesson | Omit<Lesson, 'id'>) => void; lesson: Lesson | null; }> = ({ isOpen, onClose, onSave, lesson }) => {
    const [formData, setFormData] = useState<Partial<Lesson>>({});
    
    React.useEffect(() => {
        if (isOpen) {
            setFormData(lesson || { type: LessonType.EXPLANATION, correctAnswers: [] });
        }
    }, [lesson, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const isNumber = e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            // @ts-ignore
            correctAnswers: typeof formData.correctAnswers === 'string' ? formData.correctAnswers.split('\n').filter(Boolean) : (formData.correctAnswers || []),
        };
        onSave(dataToSave as Lesson);
    };
    
    const type = formData.type || LessonType.EXPLANATION;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <input type="text" placeholder="عنوان الدرس" name="title" value={formData.title || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required/>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md">
                    {Object.values(LessonType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {type === LessonType.EXPLANATION && <input type="text" placeholder="معرف فيديو يوتيوب" name="content" value={formData.content || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>}
                {type === LessonType.SUMMARY && <textarea placeholder="محتوى الملخص" name="content" value={formData.content || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" rows={5}></textarea>}
                {(type === LessonType.HOMEWORK || type === LessonType.EXAM) && (
                    <div className="space-y-4 p-3 border border-dashed border-[var(--border-primary)] rounded-lg">
                        <ImageUpload label="صورة الواجب/الامتحان" value={formData.imageUrl || ''} onChange={url => setFormData(p => ({...p, imageUrl: url}))} />
                        <textarea placeholder="الإجابات الصحيحة (كل إجابة في سطر)" name="correctAnswers" value={Array.isArray(formData.correctAnswers) ? formData.correctAnswers.join('\n') : formData.correctAnswers || ''} onChange={handleChange} rows={4} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"/>
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


interface TeacherContentManagementProps {
    teacher: Teacher;
}

const TeacherContentManagement: React.FC<TeacherContentManagementProps> = ({ teacher }) => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: {} });
    
    const grades = useMemo(() => getAllGrades().filter(g => teacher.teachingGrades?.includes(g.id)), [teacher, dataVersion]);
    
    const [selectedGradeId, setSelectedGradeId] = useState<string>('');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
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
            const newOrUpdatedUnit = {
                ...unit,
                title,
                teacherId: teacher.id
            };
            if (unit) {
                await updateUnit(grade.id, semester.id, newOrUpdatedUnit);
                addToast('تم تعديل الوحدة!', ToastType.SUCCESS);
            } else {
                await addUnitToSemester(grade.id, semester.id, { title, teacherId: teacher.id });
                addToast('تمت إضافة الوحدة!', ToastType.SUCCESS);
            }
        }
        refreshData();
        closeModal();
    };
    
    const handleDeleteUnit = async () => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester && unit) {
            await deleteUnit(grade.id, semester.id, unit.id);
            addToast('تم حذف الوحدة.', ToastType.SUCCESS);
        }
        refreshData();
        closeModal();
    };

    const handleSaveLesson = async (lessonData: Lesson | Omit<Lesson, 'id'>) => {
        const { unit } = modalState.data;
        if (selectedGrade && selectedSemester && unit) {
            if ('id' in lessonData) {
                await updateLesson(selectedGrade.id, selectedSemester.id, unit.id, lessonData);
                addToast('تم تحديث الدرس', ToastType.SUCCESS);
            } else {
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

    const getLessonIcon = (type: LessonType) => {
        switch(type) {
            case LessonType.EXPLANATION: return VideoCameraIcon;
            case LessonType.HOMEWORK: return PencilIcon;
            case LessonType.EXAM: return BookOpenIcon;
            case LessonType.SUMMARY: return DocumentTextIcon;
            default: return CollectionIcon;
        }
    }
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المحتوى الخاص بك</h1>
                 <div className="flex items-center space-x-2 space-x-reverse">
                    <select value={selectedGradeId} onChange={(e) => { setSelectedGradeId(e.target.value); setSelectedSemesterId(''); }} className="p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
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
                                <div className="p-4 border-t border-[var(--border-primary)] space-y-2">
                                    {unit.lessons.length > 0 ? unit.lessons.map(lesson => (
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
                                    )) : <p className="text-center text-sm text-[var(--text-secondary)] py-2">لا توجد دروس في هذه الوحدة بعد.</p>}
                                    <button onClick={() => openModal('add-lesson', { unit })} className="w-full text-sm text-center p-2 mt-2 rounded-md bg-transparent hover:bg-[var(--border-primary)] border-2 border-dashed border-[var(--border-primary)] text-[var(--text-secondary)]">
                                        <PlusIcon className="w-4 h-4 inline-block ml-1"/> إضافة درس
                                    </button>
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
            <LessonModal isOpen={['add-lesson', 'edit-lesson'].includes(modalState.type || '')} onClose={closeModal} onSave={handleSaveLesson} lesson={modalState.data.lesson} />
            <ConfirmationModal isOpen={modalState.type === 'delete-unit'} onClose={closeModal} onConfirm={handleDeleteUnit} title="تأكيد حذف الوحدة" message={`هل أنت متأكد من حذف وحدة "${modalState.data.unit?.title}" وكل دروسها؟`} />
            <ConfirmationModal isOpen={modalState.type === 'delete-lesson'} onClose={closeModal} onConfirm={handleDeleteLesson} title="تأكيد حذف الدرس" message={`هل أنت متأكد من حذف درس "${modalState.data.lesson?.title}"؟`} />
        </div>
    );
};

export default TeacherContentManagement;