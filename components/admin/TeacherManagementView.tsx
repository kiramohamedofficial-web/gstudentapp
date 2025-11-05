import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Teacher, ToastType, Grade, User } from '../../types';
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher, getGradesForSelection, getUserByTeacherId, supabase } from '../../services/storageService';
import Modal from '../common/Modal';
import { PencilIcon, TrashIcon, UserCircleIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Loader from '../common/Loader';
import ImageUpload from '../common/ImageUpload';

const TeacherCard: React.FC<{ teacher: Teacher; }> = ({ teacher }) => {
    const levelMap: Record<'Middle' | 'Secondary', string> = {
        'Middle': 'إعدادي',
        'Secondary': 'ثانوي'
    };
    
    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] p-6 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <img src={teacher.imageUrl} alt={teacher.name} className="w-20 h-20 rounded-full object-cover border-4 border-[var(--bg-tertiary)]"/>
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{teacher.name}</h3>
                        <p className="text-[var(--text-secondary)]">{teacher.subject}</p>
                    </div>
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
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchAndSetTeachers = async () => {
            setIsLoading(true);
            const data = await getAllTeachers();
            setTeachers(data as Teacher[]);
            setIsLoading(false);
        };
        fetchAndSetTeachers();
    }, []);

    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">عرض المدرسين</h1>
                    <p className="text-[var(--text-secondary)] mt-1">عرض بيانات المدرسين وتخصصاتهم.</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader />
                </div>
            ) : teachers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {teachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                     <UserCircleIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">لا يوجد مدرسون بعد</h3>
                    <p className="text-[var(--text-secondary)] mt-1">يتم إضافة المدرسين من خلال قاعدة البيانات مباشرة.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherManagementView;