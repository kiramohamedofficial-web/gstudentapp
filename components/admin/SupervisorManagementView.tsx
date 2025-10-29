import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Teacher, ToastType } from '../../types';
import { getAllUsers, getAllTeachers, createSupervisor, updateSupervisor, deleteUser } from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Loader from '../common/Loader';

const SupervisorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    supervisor: User | null;
    teachers: Teacher[];
}> = ({ isOpen, onClose, onSave, supervisor, teachers }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', supervised_teacher_id: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (supervisor) {
                setFormData({
                    name: supervisor.name || '',
                    email: supervisor.email || '',
                    password: '',
                    supervised_teacher_id: supervisor.teacherId || ''
                });
            } else {
                setFormData({ name: '', email: '', password: '', supervised_teacher_id: '' });
            }
        }
    }, [supervisor, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!supervisor && !formData.password) {
            setError('كلمة المرور مطلوبة للمشرف الجديد.');
            return;
        }
        onSave({ ...formData, id: supervisor?.id });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={supervisor ? 'تعديل بيانات المشرف' : 'إضافة مشرف جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" placeholder="اسم المشرف" value={formData.name} onChange={handleChange} required className="w-full p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                <input name="email" type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={handleChange} required className="w-full p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                <input name="password" type="password" placeholder={supervisor ? "اتركها فارغة لعدم التغيير" : "كلمة المرور"} value={formData.password} onChange={handleChange} required={!supervisor} className="w-full p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                <select name="supervised_teacher_id" value={formData.supervised_teacher_id} onChange={handleChange} required className="w-full p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <option value="">-- اختر المدرس للإشراف --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700">حفظ</button>
                </div>
            </form>
        </Modal>
    );
};

const SupervisorCard: React.FC<{ supervisor: User; teacherName: string; onEdit: () => void; onDelete: () => void; }> = ({ supervisor, teacherName, onEdit, onDelete }) => (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border-primary)]">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{supervisor.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">يشرف على: <span className="font-semibold">{teacherName}</span></p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onEdit} className="p-2 text-[var(--text-secondary)] hover:text-yellow-400"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-[var(--text-secondary)] hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
);

const SupervisorManagementView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ type: 'add' | 'edit' | 'delete' | null, supervisor: User | null }>({ type: null, supervisor: null });
    const { addToast } = useToast();

    const supervisors = useMemo(() => users.filter(u => u.role === 'supervisor'), [users]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [userData, teacherData] = await Promise.all([getAllUsers(), getAllTeachers()]);
        setUsers(userData);
        setTeachers(teacherData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const closeModal = () => setModalState({ type: null, supervisor: null });

    const handleSave = async (data: any) => {
        try {
            if (data.id) { // Editing
                await updateSupervisor(data.id, { name: data.name, supervised_teacher_id: data.supervised_teacher_id });
                addToast('تم تحديث بيانات المشرف بنجاح.', ToastType.SUCCESS);
            } else { // Adding
                const { error } = await createSupervisor({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    supervised_teacher_id: data.supervised_teacher_id
                });
                if (error) throw error;
                addToast('تمت إضافة المشرف بنجاح.', ToastType.SUCCESS);
            }
            fetchData();
            closeModal();
        } catch (error: any) {
            addToast(`فشل الحفظ: ${error.message}`, ToastType.ERROR);
        }
    };

    const handleDelete = async () => {
        if (modalState.supervisor) {
            try {
                const { error } = await deleteUser(modalState.supervisor.id);
                if (error) throw error;
                addToast('تم حذف المشرف بنجاح.', ToastType.SUCCESS);
                fetchData();
                closeModal();
            } catch (error: any) {
                addToast(`فشل الحذف: ${error.message}`, ToastType.ERROR);
            }
        }
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المشرفين</h1>
                    <p className="text-[var(--text-secondary)] mt-1">إضافة مشرفين جدد وتعيينهم لمراقبة محتوى المدرسين.</p>
                </div>
                <button onClick={() => setModalState({ type: 'add', supervisor: null })} className="flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105">
                    <PlusIcon className="w-5 h-5"/> 
                    <span>إضافة مشرف جديد</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20"><Loader /></div>
            ) : supervisors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {supervisors.map(supervisor => (
                        <SupervisorCard
                            key={supervisor.id}
                            supervisor={supervisor}
                            teacherName={teacherMap.get(supervisor.teacherId || '') || 'غير معين'}
                            onEdit={() => setModalState({ type: 'edit', supervisor })}
                            onDelete={() => setModalState({ type: 'delete', supervisor })}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                    <UsersIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">لا يوجد مشرفون بعد</h3>
                    <p className="text-[var(--text-secondary)] mt-1">ابدأ بإضافة أول مشرف إلى المنصة.</p>
                </div>
            )}

            <SupervisorModal
                isOpen={modalState.type === 'add' || modalState.type === 'edit'}
                onClose={closeModal}
                onSave={handleSave}
                supervisor={modalState.supervisor}
                teachers={teachers}
            />

            <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="تأكيد الحذف">
                <p className="text-[var(--text-secondary)] mb-6">
                    هل أنت متأكد من رغبتك في حذف المشرف <span className="font-bold text-[var(--text-primary)]">{modalState.supervisor?.name}</span>؟
                </p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                    <button onClick={closeModal} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                    <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، قم بالحذف</button>
                </div>
            </Modal>
        </div>
    );
};

export default SupervisorManagementView;