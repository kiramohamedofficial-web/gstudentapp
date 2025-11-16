import React, { useState, useEffect } from 'react';
import { Teacher, ToastType } from '../../types';
import { createTeacher, updateTeacher } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import ImageUpload from '../common/ImageUpload';

interface TeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    teacher: (Teacher & { email?: string, phone?: string }) | null;
    allGrades: { id: number; name: string; level: 'Middle' | 'Secondary' }[];
}

const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, onSaveSuccess, teacher, allGrades }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '',
        subject: '', imageUrl: '',
        teachingLevels: [] as ('Middle' | 'Secondary')[],
        teachingGrades: [] as number[],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (teacher) {
                setFormData({
                    name: teacher.name || '',
                    email: teacher.email || '',
                    phone: teacher.phone?.replace('+20', '') || '',
                    password: '',
                    subject: teacher.subject || '',
                    imageUrl: teacher.imageUrl || '',
                    teachingLevels: teacher.teachingLevels || [],
                    teachingGrades: teacher.teachingGrades || [],
                });
            } else {
                setFormData({
                    name: '', email: '', phone: '', password: '',
                    subject: '', imageUrl: '',
                    teachingLevels: [], teachingGrades: [],
                });
            }
        }
    }, [teacher, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleGradeToggle = (gradeId: number) => {
        setFormData(prev => {
            const newGrades = prev.teachingGrades.includes(gradeId)
                ? prev.teachingGrades.filter(id => id !== gradeId)
                : [...prev.teachingGrades, gradeId];
            return { ...prev, teachingGrades: newGrades };
        });
    };

    const handleLevelToggle = (level: 'Middle' | 'Secondary') => {
         setFormData(prev => {
            const newLevels = prev.teachingLevels.includes(level)
                ? prev.teachingLevels.filter(l => l !== level)
                : [...prev.teachingLevels, level];
            return { ...prev, teachingLevels: newLevels };
        });
    };

    const handleSave = async () => {
        setError('');
        if (!formData.name || !formData.email || !formData.subject) {
            setError('الاسم، البريد الإلكتروني والمادة حقول مطلوبة.');
            return;
        }
        if (!teacher && !formData.password) {
            setError('كلمة المرور مطلوبة للمدرس الجديد.');
            return;
        }

        setIsSaving(true);
        try {
            let result;
            if (teacher) {
                const payload = { 
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    subject: formData.subject,
                    imageUrl: formData.imageUrl,
                    teachingLevels: formData.teachingLevels,
                    teachingGrades: formData.teachingGrades,
                };
                result = await updateTeacher(teacher.id, payload);
            } else {
                 const payload = {
                    ...formData,
                    image_url: formData.imageUrl,
                    teaching_grades: formData.teachingGrades,
                    teaching_levels: formData.teachingLevels
                };
                result = await createTeacher(payload);
            }

            if (!result.success) {
                throw result.error;
            }

            addToast(teacher ? 'تم تحديث المدرس بنجاح!' : 'تم إضافة المدرس بنجاح!', ToastType.SUCCESS);
            onSaveSuccess();

        } catch (error: any) {
            setError(error.message);
            addToast(`حدث خطأ: ${error.message}`, ToastType.ERROR);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={teacher ? 'تعديل مدرس' : 'إضافة مدرس جديد'}>
            <div className="space-y-6 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto p-2 pr-4 -mr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="اسم المدرس" value={formData.name} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required />
                    <input type="text" name="subject" placeholder="المادة" value={formData.subject} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="email" name="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required />
                    <input type="tel" name="phone" placeholder="رقم الهاتف" value={formData.phone} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" />
                </div>
                <input type="password" name="password" placeholder={teacher ? "كلمة المرور (اتركها فارغة لعدم التغيير)" : "كلمة المرور"} value={formData.password} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required={!teacher} />
                
                <ImageUpload label="صورة المدرس" value={formData.imageUrl} onChange={url => setFormData(p => ({ ...p, imageUrl: url }))} />

                <div>
                    <h4 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">المراحل الدراسية</h4>
                    <div className="flex gap-4">
                        {(['Middle', 'Secondary'] as const).map(level => (
                             <label key={level} className="flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer">
                                <input type="checkbox" checked={formData.teachingLevels.includes(level)} onChange={() => handleLevelToggle(level)} className="h-4 w-4 rounded text-purple-600 bg-transparent border-gray-500" />
                                <span className="mr-2">{level === 'Middle' ? 'إعدادي' : 'ثانوي'}</span>
                            </label>
                        ))}
                    </div>
                </div>

                 <div>
                    <h4 className="font-semibold text-sm text-[var(--text-secondary)] mb-2">الصفوف الدراسية</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allGrades.map(grade => (
                             <label key={grade.id} className="flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer">
                                <input type="checkbox" checked={formData.teachingGrades.includes(grade.id)} onChange={() => handleGradeToggle(grade.id)} className="h-4 w-4 rounded text-purple-600 bg-transparent border-gray-500" />
                                <span className="mr-2 text-xs">{grade.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t border-[var(--border-primary)]">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-60">
                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>
        </Modal>
    );
};

export default TeacherModal;
