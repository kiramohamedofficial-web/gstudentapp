import React, { useState, useMemo, useCallback } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType, Teacher } from '../../types';
import {
    getAllGrades, addLessonToUnit, updateLesson, deleteLesson,
    addUnitToSemester, updateUnit, deleteUnit, addActivityLog
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CollectionIcon } from '../common/Icons';
import { useToast } from '../../useToast';

const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">تأكيد الحذف</button>
        </div>
    </Modal>
);

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
    
    const selectedGrade = useMemo(() => grades.find(g => g.id.toString() === selectedGradeId), [grades, selectedGradeId]);
    const selectedSemester = useMemo(() => selectedGrade?.semesters.find(s => s.id === selectedSemesterId), [selectedGrade, selectedSemesterId]);
    const units = useMemo(() => (selectedSemester?.units || []).filter(u => u.teacherId === teacher.id), [selectedSemester, teacher.id]);

    const refreshData = () => setDataVersion(v => v + 1);
    
    const openModal = (type: string, data = {}) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: {} });

    const handleSaveUnit = (title: string) => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester) {
            // This is a simplified version of unit creation/update from admin view
            // In a real app, it would need to handle tracks etc.
            const newOrUpdatedUnit = { 
                id: unit?.id || `u${Date.now()}`, 
                title, 
                lessons: unit?.lessons || [],
                teacherId: teacher.id
            };
            if (unit) {
                updateUnit(grade.id, semester.id, newOrUpdatedUnit);
                addToast('تم تعديل الوحدة!', 'success');
            } else {
                addUnitToSemester(grade.id, semester.id, { title, teacherId: teacher.id });
                addToast('تمت إضافة الوحدة!', 'success');
            }
        }
        refreshData();
        closeModal();
    };
    
    const handleDeleteUnit = () => {
        const { grade, semester, unit } = modalState.data;
        if (grade && semester && unit) {
            deleteUnit(grade.id, semester.id, unit.id);
            addToast('تم حذف الوحدة.', 'success');
        }
        refreshData();
        closeModal();
    };
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المحتوى الخاص بك</h1>
                 <div className="flex items-center space-x-2 space-x-reverse">
                    <select value={selectedGradeId} onChange={(e) => setSelectedGradeId(e.target.value)} className="p-2 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
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
                        <div key={unit.id} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-[var(--text-primary)]">{unit.title}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => alert('Editing lessons for this unit is not implemented in this view yet.')} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-md"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => openModal('delete-unit', { grade: selectedGrade, semester: selectedSemester, unit })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                            </div>
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
            <ConfirmationModal isOpen={modalState.type === 'delete-unit'} onClose={closeModal} onConfirm={handleDeleteUnit} title="تأكيد حذف الوحدة" message={`هل أنت متأكد من حذف وحدة "${modalState.data.unit?.title}"؟`} />
        </div>
    );
};

export default TeacherContentManagement;