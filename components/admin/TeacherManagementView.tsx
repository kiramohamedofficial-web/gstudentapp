import React, { useState, useMemo, useCallback } from 'react';
import { Teacher, ToastType, Grade } from '../../types';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, getUnitsForTeacher, getAllGrades } from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, UsersSolidIcon, BookOpenIcon, CollectionIcon } from '../common/Icons';
import { useToast } from '../../useToast';

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

// Teacher Add/Edit Modal
const TeacherModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Omit<Teacher, 'id'> | Teacher) => void; teacher: Partial<Teacher> | null }> = ({ isOpen, onClose, onSave, teacher }) => {
    const [formData, setFormData] = useState<Partial<Teacher>>({ levels: [], grades: [] });
    const { addToast } = useToast();

    const allGrades = useMemo(() => getAllGrades(), []);
    const middleSchoolGrades = useMemo(() => allGrades.filter(g => g.level === 'Middle'), [allGrades]);
    const secondarySchoolGrades = useMemo(() => allGrades.filter(g => g.level === 'Secondary'), [allGrades]);

    React.useEffect(() => {
        if (isOpen) {
            setFormData(teacher || { levels: [], grades: [] });
        }
    }, [isOpen, teacher]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                addToast('حجم الصورة يجب ألا يتجاوز 2 ميجابايت.', ToastType.ERROR);
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLevelChange = (level: 'Middle' | 'Secondary', isChecked: boolean) => {
        setFormData(prev => {
            const currentLevels = prev.levels || [];
            const newLevels = isChecked ? [...currentLevels, level] : currentLevels.filter(l => l !== level);

            const gradesToKeep: number[] = [];
            if (newLevels.includes('Middle')) {
                gradesToKeep.push(...middleSchoolGrades.map(g => g.id));
            }
            if (newLevels.includes('Secondary')) {
                gradesToKeep.push(...secondarySchoolGrades.map(g => g.id));
            }
            
            const newGrades = (prev.grades || []).filter(gradeId => gradesToKeep.includes(gradeId));

            return { ...prev, levels: newLevels, grades: newGrades };
        });
    };

    const handleGradeChange = (gradeId: number, isChecked: boolean) => {
        setFormData(prev => {
            const currentGrades = prev.grades || [];
            const newGrades = isChecked ? [...currentGrades, gradeId] : currentGrades.filter(g => g.id !== gradeId);
            return { ...prev, grades: newGrades };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.subject || !formData.imageUrl) {
            addToast("الرجاء ملء جميع الحقول الأساسية.", ToastType.ERROR);
            return;
        }
        if (!formData.levels || formData.levels.length === 0) {
            addToast("الرجاء تحديد مرحلة دراسية واحدة على الأقل.", ToastType.ERROR);
            return;
        }
        if (!formData.grades || formData.grades.length === 0) {
            addToast("الرجاء تحديد صف دراسي واحد على الأقل.", ToastType.ERROR);
            return;
        }
        onSave(formData as Teacher);
    };

    const CheckboxLabel: React.FC<{ label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, checked, onChange }) => (
        <label className={`flex items-center space-x-2 space-x-reverse p-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-purple-500/10 border-purple-500/50' : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] hover:bg-[var(--border-primary)]'}`}>
            <input type="checkbox" checked={checked} onChange={onChange} className="form-checkbox h-5 w-5 rounded text-purple-600 bg-[var(--bg-secondary)] border-[var(--border-primary)] focus:ring-purple-500" />
            <span className={`text-sm font-semibold ${checked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{label}</span>
        </label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={teacher?.id ? 'تعديل بيانات المعلم' : 'إضافة معلم جديد'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset>
                    <legend className="text-sm font-semibold text-[var(--text-secondary)] mb-2">المعلومات الأساسية</legend>
                    <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم المعلم</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المادة الأساسية</label>
                            <input name="subject" value={formData.subject || ''} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">صورة المعلم</label>
                            {formData.imageUrl && <img src={formData.imageUrl} alt="معاينة" className="w-24 h-24 object-cover rounded-full border-2 border-[var(--border-primary)] mb-2" />}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                        </div>
                    </div>
                </fieldset>

                 <fieldset>
                    <legend className="text-sm font-semibold text-[var(--text-secondary)] mb-2">النطاق التدريسي</legend>
                    <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">المراحل الدراسية</label>
                            <div className="flex gap-4">
                                <CheckboxLabel label="الإعدادية" checked={formData.levels?.includes('Middle') || false} onChange={e => handleLevelChange('Middle', e.target.checked)} />
                                <CheckboxLabel label="الثانوية" checked={formData.levels?.includes('Secondary') || false} onChange={e => handleLevelChange('Secondary', e.target.checked)} />
                            </div>
                        </div>

                        {formData.levels?.includes('Middle') && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الصفوف الإعدادية</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {middleSchoolGrades.map(grade => <CheckboxLabel key={grade.id} label={grade.ordinal} checked={formData.grades?.includes(grade.id) || false} onChange={e => handleGradeChange(grade.id, e.target.checked)} />)}
                                </div>
                            </div>
                        )}
                        {formData.levels?.includes('Secondary') && (
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الصفوف الثانوية</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {secondarySchoolGrades.map(grade => <CheckboxLabel key={grade.id} label={grade.ordinal} checked={formData.grades?.includes(grade.id) || false} onChange={e => handleGradeChange(grade.id, e.target.checked)} />)}
                                </div>
                            </div>
                        )}
                    </div>
                </fieldset>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

const TeacherAssignmentsModal: React.FC<{ isOpen: boolean; onClose: () => void; teacher: Teacher | null }> = ({ isOpen, onClose, teacher }) => {
    const assignments = useMemo(() => {
        if (!teacher) return [];
        return getUnitsForTeacher(teacher.id);
    }, [teacher]);

    if (!teacher) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`المواد المسندة إلى ${teacher.name}`}>
            {assignments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {assignments.map((assignment, index) => (
                        <div key={index} className="bg-[var(--bg-tertiary)] p-3 rounded-lg flex items-center space-x-3 space-x-reverse">
                            <BookOpenIcon className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-[var(--text-primary)]">{assignment.unitTitle}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{assignment.gradeName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-[var(--text-secondary)] py-8">لم يتم إسناد أي مواد لهذا المعلم بعد.</p>
            )}
        </Modal>
    );
}

const TeacherCard: React.FC<{ teacher: Teacher; onEdit: () => void; onDelete: () => void; onViewAssignments: () => void; }> = ({ teacher, onEdit, onDelete, onViewAssignments }) => (
    <div className="teacher-card">
        <div className="teacher-card-img-wrapper">
            <img src={teacher.imageUrl} alt={teacher.name} className="teacher-card-img" />
        </div>
        <div className="p-4 text-center">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{teacher.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{teacher.subject}</p>
             <div className="flex justify-center gap-2 mt-2 mb-4">
                {teacher.levels.includes('Middle') && <span className="text-xs px-2 py-1 bg-sky-500/10 text-sky-400 rounded-full">إعدادي</span>}
                {teacher.levels.includes('Secondary') && <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full">ثانوي</span>}
            </div>
            <div className="space-y-2">
                <button onClick={onViewAssignments} className="w-full text-center text-sm py-2 px-3 rounded-md bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
                    <CollectionIcon className="w-4 h-4" />
                    <span>عرض المواد</span>
                </button>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="flex-1 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-yellow-400 rounded-md transition-colors text-sm font-semibold">تعديل</button>
                    <button onClick={onDelete} className="flex-1 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-red-500 rounded-md transition-colors text-sm font-semibold">حذف</button>
                </div>
            </div>
        </div>
    </div>
);


const TeacherManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [modalState, setModalState] = useState<{ type: 'add' | 'edit' | 'delete' | 'viewAssignments' | null; data: Partial<Teacher> | null }>({ type: null, data: null });

    const teachers = useMemo(() => getTeachers(), [dataVersion]);
    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
    
    const closeModal = () => setModalState({ type: null, data: null });

    const handleSave = (teacherData: Omit<Teacher, 'id'> | Teacher) => {
        if ('id' in teacherData && teacherData.id) {
            updateTeacher(teacherData as Teacher);
            addToast('تم تحديث بيانات المعلم بنجاح!', ToastType.SUCCESS);
        } else {
            addTeacher(teacherData);
            addToast('تمت إضافة المعلم بنجاح!', ToastType.SUCCESS);
        }
        refreshData();
        closeModal();
    };

    const handleDelete = () => {
        if (modalState.data?.id) {
            deleteTeacher(modalState.data.id);
            addToast('تم حذف المعلم بنجاح.', ToastType.SUCCESS);
            refreshData();
            closeModal();
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المعلمين</h1>
                <button onClick={() => setModalState({ type: 'add', data: null })} className="flex items-center text-sm px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors shadow-md">
                    <PlusIcon className="w-5 h-5 ml-2"/> إضافة معلم جديد
                </button>
            </div>
            
            {teachers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {teachers.map(teacher => (
                        <TeacherCard 
                            key={teacher.id} 
                            teacher={teacher} 
                            onEdit={() => setModalState({ type: 'edit', data: teacher })}
                            onDelete={() => setModalState({ type: 'delete', data: teacher })}
                            onViewAssignments={() => setModalState({ type: 'viewAssignments', data: teacher })}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary-opaque)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                    <UsersSolidIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)]/30 mb-4" />
                    <p className="text-[var(--text-secondary)]">لم يتم إضافة أي معلمين بعد. ابدأ بإضافة معلم جديد.</p>
                </div>
            )}

            <TeacherModal 
                isOpen={modalState.type === 'add' || modalState.type === 'edit'}
                onClose={closeModal}
                onSave={handleSave}
                teacher={modalState.data}
            />

            <ConfirmationModal 
                isOpen={modalState.type === 'delete'}
                onClose={closeModal}
                onConfirm={handleDelete}
                title="تأكيد حذف المعلم"
                message={`هل أنت متأكد من رغبتك في حذف المعلم "${modalState.data?.name}"؟ سيتم فك ربطه من جميع المواد المسندة إليه.`}
            />

            <TeacherAssignmentsModal
                isOpen={modalState.type === 'viewAssignments'}
                onClose={closeModal}
                teacher={modalState.data as Teacher | null}
            />
        </div>
    );
};

export default TeacherManagementView;
