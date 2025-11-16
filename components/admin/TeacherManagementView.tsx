import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Teacher, ToastType } from '../../types';
import { getAllTeachers, getGradesForSelection, deleteTeacher, getUserByTeacherId } from '../../services/storageService';
import { useToast } from '../../useToast';
import { PlusIcon, UsersSolidIcon, SearchIcon } from '../common/Icons';
import Loader from '../common/Loader';
import TeacherModal from './TeacherModal';
import Modal from '../common/Modal';

const TeacherCard: React.FC<{ teacher: Teacher; onEdit: () => void; onDelete: () => void; }> = ({ teacher, onEdit, onDelete }) => {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] p-5 transition-all duration-300 hover:border-purple-400">
            <div className="flex items-start gap-4">
                <img src={teacher.imageUrl || 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png'} alt={teacher.name} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-secondary)]" />
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{teacher.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{teacher.subject}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex justify-end gap-2">
                <button onClick={onEdit} className="p-2 text-sm font-semibold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-md">تعديل</button>
                <button onClick={onDelete} className="p-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md">حذف</button>
            </div>
        </div>
    );
};

const TeacherManagementView: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [allGrades, setAllGrades] = useState<{ id: number; name: string; level: 'Middle' | 'Secondary' }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [modalState, setModalState] = useState<{ type: 'add' | 'edit' | null, teacher: Teacher | null }>({ type: null, teacher: null });
    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { addToast } = useToast();
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [teachersData, gradesData] = await Promise.all([
            getAllTeachers(),
            getGradesForSelection()
        ]);
        setTeachers(teachersData);
        setAllGrades(gradesData as any);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTeachers = useMemo(() => {
        if (!searchQuery.trim()) {
            return teachers;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return teachers.filter(teacher =>
            teacher.name.toLowerCase().includes(lowercasedQuery) ||
            teacher.subject.toLowerCase().includes(lowercasedQuery)
        );
    }, [teachers, searchQuery]);

    const openModal = async (type: 'add' | 'edit', teacher: Teacher | null = null) => {
        if (type === 'edit' && teacher) {
            // Fetch associated user data like email and phone
            const user = await getUserByTeacherId(teacher.id);
            const teacherWithUserData = { ...teacher, email: user?.email, phone: user?.phone };
            setModalState({ type, teacher: teacherWithUserData });
        } else {
            setModalState({ type, teacher: null });
        }
    };
    
    const closeModal = () => setModalState({ type: null, teacher: null });

    const handleDelete = async () => {
        if (!deletingTeacher) return;
        setIsActionLoading(true);
        const { success, error } = await deleteTeacher(deletingTeacher.id);
        if (success) {
            addToast('تم حذف المدرس بنجاح.', ToastType.SUCCESS);
            fetchData();
        } else {
            addToast(`فشل حذف المدرس: ${error?.message}`, ToastType.ERROR);
        }
        setDeletingTeacher(null);
        setIsActionLoading(false);
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المدرسين</h1>
                    <p className="text-[var(--text-secondary)] mt-1">إضافة وتعديل حسابات المدرسين وبياناتهم.</p>
                </div>
                <button onClick={() => openModal('add')} className="flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105">
                    <PlusIcon className="w-5 h-5"/> 
                    <span>إضافة مدرس جديد</span>
                </button>
            </div>

            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="ابحث بالاسم أو المادة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 pr-10 pl-4 transition-colors focus:ring-2 focus:ring-purple-400"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20"><Loader /></div>
            ) : filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} onEdit={() => openModal('edit', teacher)} onDelete={() => setDeletingTeacher(teacher)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                    <UsersSolidIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">
                        {searchQuery ? 'لا توجد نتائج مطابقة' : 'لا يوجد مدرسون بعد'}
                    </h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {searchQuery ? 'جرّب البحث بكلمة أخرى.' : 'ابدأ بإضافة أول مدرس إلى المنصة.'}
                    </p>
                </div>
            )}

            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <TeacherModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSaveSuccess={() => {
                        closeModal();
                        fetchData();
                    }}
                    teacher={modalState.teacher as any}
                    allGrades={allGrades}
                />
            )}

            {deletingTeacher && (
                <Modal isOpen={true} onClose={() => setDeletingTeacher(null)} title="تأكيد الحذف">
                    <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد من رغبتك في حذف المدرس "{deletingTeacher.name}"؟ سيتم حذف حسابه نهائياً.</p>
                    <div className="flex justify-end space-x-3 space-x-reverse">
                        <button onClick={() => setDeletingTeacher(null)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                        <button onClick={handleDelete} disabled={isActionLoading} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white disabled:opacity-50">
                            {isActionLoading ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TeacherManagementView;
