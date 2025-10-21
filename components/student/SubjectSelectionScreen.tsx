import React, { useState, useMemo, useCallback } from 'react';
import { Grade, Unit, User } from '../../types';
import { getUserProgress } from '../../services/storageService';
import { ArrowRightIcon, ArrowLeftIcon } from '../common/Icons';

interface SubjectSelectionScreenProps {
    grade: Grade;
    onSubjectSelect: (unit: Unit) => void;
    onBack: () => void;
    user: User;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
        <div 
            className="bg-[var(--accent-primary)] h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

const TeacherCard: React.FC<{ unit: Unit; onClick: () => void; delay: number; progress: number; }> = ({ unit, onClick, delay, progress }) => {
    return (
        <div
            onClick={onClick}
            className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent-primary)]/50 fade-in group p-5 flex items-center justify-between space-x-4 space-x-reverse"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                    {unit.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                    {unit.lessons.length} حصص
                </p>
                <div className="flex items-center">
                    <ProgressBar progress={progress} />
                    <span className="text-xs font-mono text-[var(--text-secondary)] mr-3 flex-shrink-0">{Math.round(progress)}%</span>
                </div>
            </div>
            <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-[var(--accent-primary)]/20">
                    <ArrowLeftIcon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );
};

const SubjectSelectionScreen: React.FC<SubjectSelectionScreenProps> = ({ grade, onSubjectSelect, onBack, user }) => {
    const [activeSemesterId, setActiveSemesterId] = useState<string>(grade.semesters[0]?.id || '');
    
    const userProgress = useMemo(() => getUserProgress(user.id), [user.id]);

    const calculateProgress = useCallback((unit: Unit) => {
        const totalLessons = unit.lessons.length;
        if (totalLessons === 0) return 0;
        
        const completedLessons = unit.lessons.filter(lesson => userProgress[lesson.id]).length;
        return Math.round((completedLessons / totalLessons) * 100);
    }, [userProgress]);

    const activeSemester = useMemo(() => {
        return grade.semesters.find(s => s.id === activeSemesterId);
    }, [grade, activeSemesterId]);

    return (
        <div>
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى الرئيسية</span>
            </button>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">اختر وحدة المنهج - {grade.name}</h1>
            
            <div className="flex items-center space-x-2 space-x-reverse mb-8">
                 {grade.semesters.map(semester => (
                    <button
                        key={semester.id}
                        onClick={() => setActiveSemesterId(semester.id)}
                        className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${
                            activeSemesterId === semester.id
                                ? 'bg-[var(--accent-primary)] text-black shadow-md'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {semester.title}
                    </button>
                ))}
            </div>

            {activeSemester ? (
                <div className="grid grid-cols-1 gap-4">
                    {activeSemester.units.map((unit, index) => (
                        <TeacherCard 
                            key={unit.id} 
                            unit={unit} 
                            onClick={() => onSubjectSelect(unit)} 
                            delay={index * 75}
                            progress={calculateProgress(unit)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لم يتم العثور على وحدات دراسية.</p>
                </div>
            )}
        </div>
    );
};

export default SubjectSelectionScreen;