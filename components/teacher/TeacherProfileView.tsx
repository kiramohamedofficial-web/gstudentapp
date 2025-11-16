
import React, { useMemo, useEffect, useState } from 'react';
import { Teacher } from '../../types';
import { getAllGrades } from '../../services/storageService';
import { BookOpenIcon, UserCircleIcon } from '../common/Icons';

interface TeacherProfileViewProps {
    teacher: Teacher;
}

const InfoCard: React.FC<{ icon: React.FC<any>, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-md border border-[var(--border-primary)]">
        <h3 className="text-md font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Icon className="w-5 h-5 text-[var(--accent-primary)]"/>
            {title}
        </h3>
        {children}
    </div>
);


const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ teacher }) => {
    const [allGrades, setAllGrades] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        const fetchGrades = async () => {
            const gradesData = await getAllGrades();
            setAllGrades(gradesData.map(g => ({ id: g.id, name: g.name })));
        };
        fetchGrades();
    }, []);

    const teacherGradeNames = useMemo(() => {
        if (!teacher.teachingGrades || allGrades.length === 0) return [];
        return teacher.teachingGrades.map(id => allGrades.find(g => g.id === id)?.name).filter(Boolean) as string[];
    }, [teacher.teachingGrades, allGrades]);
    
    return (
        <div className="max-w-4xl mx-auto space-y-6 fade-in">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-md border border-[var(--border-primary)] flex flex-col sm:flex-row items-center gap-6">
                <img 
                    src={teacher.imageUrl || 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png'} 
                    alt={teacher.name} 
                    className="w-28 h-28 rounded-full object-cover border-4 border-[var(--bg-tertiary)]"
                />
                <div className="flex-1 text-center sm:text-right">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{teacher.name}</h1>
                    <p className="text-[var(--text-secondary)] mt-1">{teacher.subject}</p>
                </div>
            </div>
            
            <InfoCard icon={UserCircleIcon} title="معلومات أساسية">
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">الاسم:</span> <span className="font-semibold">{teacher.name}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">المادة:</span> <span className="font-semibold">{teacher.subject}</span></div>
                </div>
            </InfoCard>

            <InfoCard icon={BookOpenIcon} title="الصفوف الدراسية التي يتم تدريسها">
                <div className="flex flex-wrap gap-2">
                    {teacherGradeNames.length > 0 ? teacherGradeNames.map(name => (
                        <span key={name} className="px-3 py-1 text-sm font-semibold bg-[var(--bg-tertiary)] rounded-full">{name}</span>
                    )) : (
                        <p className="text-sm text-[var(--text-secondary)]">لم تحدد بعد.</p>
                    )}
                </div>
            </InfoCard>
        </div>
    );
};

export default TeacherProfileView;
