import React, { useMemo } from 'react';
import { Teacher } from '../../types';
import { getTeachers } from '../../services/storageService';
import { UsersSolidIcon, BookOpenIcon } from '../common/Icons';

interface TeachersViewProps {
    onSelectTeacher: (teacherId: string) => void;
}

const TeacherCard: React.FC<{ teacher: Teacher; onSelect: () => void }> = ({ teacher, onSelect }) => (
    <div className="student-teacher-card group">
        <div className="student-teacher-card-img-container">
            <img src={teacher.imageUrl} alt={teacher.name} className="student-teacher-card-img" />
        </div>
        <div className="p-5">
            <h3 className="text-xl font-bold text-[var(--text-primary)] truncate">{teacher.name}</h3>
            <p className="text-md text-[var(--text-secondary)] mb-4">{teacher.subject}</p>
            
            <div className="flex items-center gap-2 mb-5">
                {teacher.levels.includes('Middle') && (
                    <span className="text-xs font-semibold px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full">
                        إعدادي
                    </span>
                )}
                {teacher.levels.includes('Secondary') && (
                    <span className="text-xs font-semibold px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full">
                        ثانوي
                    </span>
                )}
            </div>

            <button
                onClick={onSelect}
                className="w-full flex items-center justify-center py-3 px-4 font-semibold text-white bg-purple-600 rounded-lg 
                           hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50
                           transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
            >
                <BookOpenIcon className="w-5 h-5 ml-2" />
                استعراض المواد
            </button>
        </div>
    </div>
);

const TeachersView: React.FC<TeachersViewProps> = ({ onSelectTeacher }) => {
    const teachers = useMemo(() => getTeachers(), []);

    return (
        <div>
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <UsersSolidIcon className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">نخبة من أفضل المدرسين</h1>
            </div>

            {teachers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {teachers.map((teacher) => (
                        <TeacherCard 
                            key={teacher.id} 
                            teacher={teacher} 
                            onSelect={() => onSelectTeacher(teacher.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لم يتم إضافة أي معلمين بعد.</p>
                </div>
            )}
        </div>
    );
};

export default TeachersView;