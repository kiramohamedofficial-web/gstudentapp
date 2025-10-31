import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Teacher, ToastType, Grade, User } from '../../types';
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher, getAllGrades, getUserByTeacherId, supabase } from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, UserCircleIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Loader from '../common/Loader';
import ImageUpload from '../common/ImageUpload';

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: string; }> = ({ label, checked, onChange, name }) => (
    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer p-2 rounded-md hover:bg-white/5 transition-colors">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-500 bg-transparent text-purple-600 focus:ring-purple-500" />
        <span className="text-[var(--text-secondary)] text-sm">{label}</span>
    </label>
);

interface TeacherModalSaveData {
    name: string;
    subject: string;
    imageUrl: string;
    teachingLevels?: ('Middle' | 'Secondary')[];
    teachingGrades?: number[];
    email: string; // From phone
    phone: string;
    password?: string;
    id?: string; // for editing
}

const TeacherModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TeacherModalSaveData) => void;
    teacher: Teacher | null;
}> = ({ isOpen, onClose, onSave, teacher }) => {
    const [formData, setFormData] = useState({ name: '', subject: '', imageUrl: '', phone: '', password: '', email: '' });
    const [selectedLevels, setSelectedLevels] = useState<('Middle' | 'Secondary')[]>([]);
    const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
    const [error, setError] = useState('');
    const [allGrades, setAllGrades] = useState<Grade[]>([]);
    
    useEffect(() => {
        getAllGrades().then(grades => setAllGrades(grades));
    }, []);

    const middleSchoolGrades = useMemo(() => allGrades.filter(g => g.level === 'Middle').sort((a,b) => a.id - b.id), [allGrades]);
    const secondarySchoolGrades = useMemo(() => allGrades.filter(g => g.level === 'Secondary').sort((a,b) => a.id - b.id), [allGrades]);

    useEffect(() => {
        const loadTeacherData = async () => {
            setError('');
            if (teacher) {
                const profileData = await getUserByTeacherId(teacher.id);
                setFormData({
                    name: teacher.name || '',
                    subject: teacher.subject || '',
                    imageUrl: teacher.imageUrl || '',
                    phone: profileData?.phone?.replace('+2', '') || '',
                    email: profileData?.email || '',
                    password: '' // Don't pre-fill password
                });
                setSelectedLevels(teacher.teachingLevels || []);
                setSelectedGrades(teacher.teachingGrades || []);
            } else {
                setFormData({ name: '', subject: '', imageUrl: '', phone: '', password: '', email: '' });
                setSelectedLevels([]);
                setSelectedGrades([]);
            }
        };

        if (isOpen) {
            loadTeacherData();
        }
    }, [teacher, isOpen]);

    const handleLevelChange = (level: 'Middle' | 'Secondary', isChecked: boolean) => {
        setSelectedLevels(prev => isChecked ? [...prev, level] : prev.filter(l => l !== level));
        if (!isChecked) {
            const gradesToClear = (level === 'Middle' ? middleSchoolGrades : secondarySchoolGrades).map(g => g.id);
            setSelectedGrades(prev => prev.filter(gId => !gradesToClear.includes(gId)));
        }
    };

    const handleGradeChange = (gradeId: number, isChecked: boolean) => {
        setSelectedGrades(prev => isChecked ? [...prev, gradeId] : prev.filter(id => id !== gradeId));
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const phoneRegex = /^01[0125]\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('الرجاء إدخال رقم هاتف مصري صحيح (11 رقم).');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('الرجاء إدخال بريد إلكتروني صالح.');
            return;
        }

        if (!teacher && !formData.password) {
            setError('كلمة المرور مطلوبة للمدرس الجديد.');
            return;
        }

        const saveData: TeacherModalSaveData = { 
            id: teacher?.id,
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            imageUrl: formData.imageUrl,
            phone: formData.phone,
            password: formData.password,
            teachingLevels: selectedLevels,
            teachingGrades: selectedGrades,
        };
        
        onSave(saveData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={teacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-4 pl-1">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">اسم المدرس</label>
                        <input name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">البريد الإلكتروني</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رقم هاتف المدرس (للدخول)</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-left" placeholder="01xxxxxxxxx" maxLength={11}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">كلمة المرور</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} required={!teacher} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" placeholder={teacher ? "اتركها فارغة لعدم التغيير" : "كلمة مرور قوية"} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المادة الأساسية</label>
                        <input name="subject" value={formData.subject} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                    </div>
                    <ImageUpload
                        label="صورة المدرس"
                        value={formData.imageUrl}
                        onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                    />
                     <div className="pt-4 border-t border-[var(--border-primary)]">
                        <h3 className="text-md font-semibold text-[var(--text-primary)] mb-3">التخصص الدراسي</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="block text-sm font-medium text-[var(--text-secondary)] mb-2">المراحل الدراسية</p>
                                <div className="flex space-x-4 space-x-reverse">
                                    <Checkbox label="المرحلة الإعدادية" name="level_middle" checked={selectedLevels.includes('Middle')} onChange={e => handleLevelChange('Middle', e.target.checked)} />
                                    <Checkbox label="المرحلة الثانوية" name="level_secondary" checked={selectedLevels.includes('Secondary')} onChange={e => handleLevelChange('Secondary', e.target.checked)} />
                                </div>
                            </div>

                            {selectedLevels.includes('Middle') && (
                                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md">
                                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">الصفوف الإعدادية</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                                        {middleSchoolGrades.map(grade => <Checkbox key={grade.id} label={grade.name} name={`grade_${grade.id}`} checked={selectedGrades.includes(grade.id)} onChange={e => handleGradeChange(grade.id, e.target.checked)} />)}
                                    </div>
                                </div>
                            )}
                            {selectedLevels.includes('Secondary') && (
                                <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md">
                                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">الصفوف الثانوية</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1">
                                        {secondarySchoolGrades.map(grade => <Checkbox key={grade.id} label={grade.name} name={`grade_${grade.id}`} checked={selectedGrades.includes(grade.id)} onChange={e => handleGradeChange(grade.id, e.target.checked)} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

const TeacherCard: React.FC<{ teacher: Teacher; onEdit: () => void; onDelete: () => void; }> = ({ teacher, onEdit, onDelete }) => {
    const levelMap: Record<'Middle' | 'Secondary', string> = {
        'Middle': 'إعدادي',
        'Secondary': 'ثانوي'
    };
    
    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] p-6 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-purple-500/10 hover:border-purple-500/50">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <img src={teacher.imageUrl} alt={teacher.name} className="w-20 h-20 rounded-full object-cover border-4 border-[var(--bg-tertiary)]"/>
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{teacher.name}</h3>
                        <p className="text-[var(--text-secondary)]">{teacher.subject}</p>
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={onEdit} className="p-2 text-[var(--text-secondary)] hover:text-yellow-400 transition-colors"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={onDelete} className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">التخصص</h4>
                <div className="flex flex-wrap gap-2">
                    {(teacher.teachingLevels && teacher.teachingLevels.length > 0) ? (
                        teacher.teachingLevels.map(level => (
                            <span key={level} className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/10 text-purple-400">{levelMap[level]}</span>
                        ))
                    ) : (
                        <span className="text-xs text-[var(--text-secondary)]">لم يحدد</span>
                    )}
                </div>
            </div>
        </div>
    );
};


const TeacherManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [modalState, setModalState] = useState<{ type: 'add' | 'edit' | 'delete' | null, teacher: Teacher | null }>({ type: null, teacher: null });
    const { addToast } = useToast();
    
    useEffect(() => {
        const fetchAndSetTeachers = async () => {
            setIsLoading(true);
            const data = await getAllTeachers();
            setTeachers(data as Teacher[]);
            setIsLoading(false);
        };
        fetchAndSetTeachers();
    }, [dataVersion]);
    
    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

    const handleSave = async (data: TeacherModalSaveData) => {
        setIsActionLoading(true);
        try {
            let result: { success: boolean, error?: any, data?: any };
        
            if (data.id) { // Editing
                const { id, ...updates } = data;
                
                if (!updates.password?.trim()) {
                    delete updates.password;
                }
                result = await updateTeacher(id, updates);
    
                if (updates.password && updates.password.trim()) {
                     const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').eq('teacher_id', id).single();
                     if (profileError) throw new Error(`Could not find user for teacher: ${profileError.message}`);
                     if (profileData) {
                         const { error: passwordError } = await supabase.auth.admin.updateUserById(profileData.id, { password: updates.password });
                         if (passwordError) throw new Error(`Failed to update password: ${passwordError.message}`);
                     }
                }
            } else { // Adding
                result = await createTeacher({
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    subject: data.subject,
                    phone: data.phone,
                    teaching_grades: data.teachingGrades || [],
                    teaching_levels: data.teachingLevels || [],
                    image_url: data.imageUrl,
                });
            }
            
            if (!result.success) {
                throw result.error;
            } else {
                addToast(data.id ? 'تم تحديث بيانات المدرس بنجاح.' : 'تمت إضافة المدرس بنجاح.', ToastType.SUCCESS);
                refreshData();
                closeModal();
            }
        } catch (error: any) {
             addToast(`❌ فشل: ${error.message || 'An unknown error occurred.'}`, ToastType.ERROR);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleDelete = async () => {
        if (modalState.teacher) {
            setIsActionLoading(true);
            try {
                const { success, error } = await deleteTeacher(modalState.teacher.id);
                if (!success) {
                     throw new Error(error?.message || 'حدث خطأ غير متوقع.');
                } else {
                    addToast('تم حذف المدرس بنجاح.', ToastType.SUCCESS);
                    refreshData();
                    closeModal();
                }
            } catch(error) {
                if (error instanceof Error) {
                    addToast(`فشل حذف المدرس: ${error.message}`, ToastType.ERROR);
                } else {
                    addToast('حدث خطأ غير معروف أثناء الحذف.', ToastType.ERROR);
                }
            } finally {
                setIsActionLoading(false);
            }
        }
    };

    const openModal = (type: 'add' | 'edit' | 'delete', teacher: Teacher | null = null) => {
        setModalState({ type, teacher });
    };

    const closeModal = () => setModalState({ type: null, teacher: null });

    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المدرسين</h1>
                    <p className="text-[var(--text-secondary)] mt-1">إضافة وتعديل بيانات المدرسين وتخصصاتهم.</p>
                </div>
                <button onClick={() => openModal('add')} className="flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105">
                    <PlusIcon className="w-5 h-5"/> 
                    <span>إضافة مدرس جديد</span>
                </button>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader />
                </div>
            ) : teachers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {teachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} onEdit={() => openModal('edit', teacher)} onDelete={() => openModal('delete', teacher)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                     <UserCircleIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">لا يوجد مدرسون بعد</h3>
                    <p className="text-[var(--text-secondary)] mt-1">ابدأ بإضافة أول مدرس إلى المنصة.</p>
                </div>
            )}

            <TeacherModal
                isOpen={modalState.type === 'add' || modalState.type === 'edit'}
                onClose={closeModal}
                onSave={handleSave}
                teacher={modalState.teacher}
            />

            <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="تأكيد الحذف">
                <p className="text-[var(--text-secondary)] mb-6">
                    هل أنت متأكد من رغبتك في حذف المدرس <span className="font-bold text-[var(--text-primary)]">{modalState.teacher?.name}</span>؟
                </p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                    <button onClick={closeModal} disabled={isActionLoading} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors disabled:opacity-50">إلغاء</button>
                    <button onClick={handleDelete} disabled={isActionLoading} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white disabled:opacity-50">
                        {isActionLoading ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default TeacherManagementView;