import React, { useState, useEffect } from 'react';
import { SupervisorProfile, Teacher, ToastType } from '../../types';
import { createSupervisor, updateSupervisor } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';

interface SupervisorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    supervisor: SupervisorProfile | null;
    allTeachers: Teacher[];
}

const SupervisorModal: React.FC<SupervisorModalProps> = ({ isOpen, onClose, onSaveSuccess, supervisor, allTeachers }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setError('');
            if (supervisor) {
                setFormData({
                    name: supervisor.name || '',
                    email: supervisor.email || '',
                    phone: supervisor.phone?.replace('+20', '') || '',
                    password: ''
                });
                setSelectedTeacherIds(supervisor.supervisor_teachers?.map(st => st.teachers.id) || []);
            } else {
                setFormData({ name: '', email: '', phone: '', password: '' });
                setSelectedTeacherIds([]);
            }
        }
    }, [supervisor, isOpen]);

    const handleTeacherToggle = (teacherId: string) => {
        setSelectedTeacherIds(prev => 
            prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSave = async () => {
        setError('');
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('الاسم والبريد الإلكتروني حقول مطلوبة.');
            return;
        }
        if (!supervisor && !formData.password.trim()) {
            setError('كلمة المرور مطلوبة للمشرف الجديد.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = { ...formData, teacherIds: selectedTeacherIds };
            let result;
            if (supervisor) {
                result = await updateSupervisor(supervisor.id, payload);
            } else {
                result = await createSupervisor(payload);
            }

            if (!result.success) {
                throw result.error;
            }

            addToast(supervisor ? 'تم تحديث المشرف بنجاح!' : 'تم إضافة المشرف بنجاح!', ToastType.SUCCESS);
            onSaveSuccess();

        } catch (error: any) {
            setError(error.message);
            addToast(`حدث خطأ: ${error.message}`, ToastType.ERROR);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={supervisor ? 'تعديل مشرف' : 'إضافة مشرف جديد'}>
            <div className="space-y-6 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto p-2 pr-4 -mr-2">
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)] space-y-4">
                    <h3 className="font-semibold text-lg border-b border-[var(--border-primary)] pb-2">بيانات الحساب</h3>
                    <input type="text" name="name" placeholder="اسم المشرف" value={formData.name} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" required />
                    <input type="email" name="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" required />
                    <input type="tel" name="phone" placeholder="رقم الهاتف" value={formData.phone} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" />
                    <input type="password" name="password" placeholder={supervisor ? "كلمة المرور (اتركها فارغة لعدم التغيير)" : "كلمة المرور"} value={formData.password} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" required={!supervisor} />
                </div>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                    <h3 className="font-semibold text-lg border-b border-[var(--border-primary)] pb-2 mb-4">ربط المدرسين</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {allTeachers.map(teacher => (
                            <label key={teacher.id} className="flex items-center p-2 rounded-md hover:bg-[var(--bg-secondary)] cursor-pointer">
                                <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => handleTeacherToggle(teacher.id)} className="h-5 w-5 rounded text-purple-600 bg-transparent border-gray-500" />
                                <span className="mr-3">{teacher.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-[var(--border-primary)]">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-60">
                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>
        </Modal>
    );
};

export default SupervisorModal;