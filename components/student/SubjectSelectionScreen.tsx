
import React, { useState, useMemo } from 'react';
import { Grade, Unit, Semester } from '../../types';
import { TEACHERS_DATA } from './teacherData';
import { ArrowRightIcon } from '../common/Icons';

interface SubjectSelectionScreenProps {
    grade: Grade;
    onSubjectSelect: (unit: Unit) => void;
    onBack: () => void;
}

const TeacherCard: React.FC<{ unit: Unit; onClick: () => void; delay: number }> = ({ unit, onClick, delay }) => {
    const teacherInfo = TEACHERS_DATA[unit.title] || TEACHERS_DATA['Default'];
    
    return (
        <div
            onClick={onClick}
            className="bg-[var(--bg-primary)] rounded-2xl shadow-lg border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 cursor-pointer flex overflow-hidden transform hover:-translate-y-1.5 fade-in group"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex-shrink-0 w-28 md:w-32 h-full">
                <img src={teacherInfo.imageUrl} alt={teacherInfo.name} className="w-full h-full object-cover object-center" />
            </div>
            <div className="flex-grow p-4 md:p-5 flex flex-col justify-center text-right">
                <h3 className="text-lg md:text-xl font-bold text-[var(--accent-primary)] group-hover:text-[var(--accent-secondary)] transition-colors flex items-center mb-1 justify-end">
                    {unit.title}
                    <span className="mr-2 text-2xl">{teacherInfo.icon}</span>
                </h3>
                <p className="text-md text-[var(--text-primary)]">{teacherInfo.name}</p>
                 <p className="text-xs text-[var(--text-secondary)] mt-2">انقر لعرض محتوى المادة</p>
            </div>
        </div>
    );
};

const SubjectSelectionScreen: React.FC<SubjectSelectionScreenProps> = ({ grade, onSubjectSelect, onBack }) => {
    const [activeSemesterId, setActiveSemesterId] = useState<string>(grade.semesters[0]?.id || '');

    const activeSemester = useMemo(() => {
        return grade.semesters.find(s => s.id === activeSemesterId);
    }, [grade, activeSemesterId]);

    return (
        <div>
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى اختيار الصف</span>
            </button>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">المواد الدراسية - {grade.name}</h1>
            
            <div className="flex items-center space-x-2 space-x-reverse border-b border-[var(--border-primary)] mb-8">
                {grade.semesters.map(semester => (
                    <button
                        key={semester.id}
                        onClick={() => setActiveSemesterId(semester.id)}
                        className={`px-4 py-3 font-semibold transition-colors duration-200 text-sm md:text-base ${
                            activeSemesterId === semester.id
                                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {semester.title}
                    </button>
                ))}
            </div>

            {activeSemester ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeSemester.units.map((unit, index) => (
                        <TeacherCard key={unit.id} unit={unit} onClick={() => onSubjectSelect(unit)} delay={index * 75} />
                    ))}
                </div>
            ) : (
                 <div className="text-center p-12 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لم يتم العثور على مواد دراسية.</p>
                </div>
            )}
        </div>
    );
};

export default SubjectSelectionScreen;
