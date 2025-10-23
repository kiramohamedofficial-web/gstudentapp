import React, { useMemo } from 'react';
import { getTeachers } from '../../services/storageService';
import { Teacher } from '../../types';

const TeacherCard: React.FC<{ teacher: Teacher }> = ({ teacher }) => (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] text-center p-6 transition-transform transform hover:-translate-y-2 group">
        <img src={teacher.imageUrl} alt={teacher.name} className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-[var(--bg-tertiary)] group-hover:border-[var(--accent-primary)] transition-colors duration-300" />
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{teacher.name}</h3>
        <p className="text-[var(--text-secondary)]">{teacher.subject}</p>
    </div>
);

const TeachersView: React.FC = () => {
    const teachers = useMemo(() => getTeachers(), []);

    return (
        <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[var(--text-primary)]">نخبة من أفضل المدرسين</h1>
             <p className="text-md text-[var(--text-secondary)] mb-8">تصفح قائمة المدرسين الخبراء لدينا واختر من يناسبك.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {teachers.map((teacher, index) => (
                    <div key={teacher.id} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <TeacherCard teacher={teacher} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeachersView;
