import React, { useState, useMemo } from 'react';
import { Grade } from '../../types';
import { ArrowRightIcon, AtomIcon, BookOpenIcon } from '../common/Icons';

const LevelCard: React.FC<{
    title: string;
    description: string;
    icon: React.FC<{className?: string}>;
    colorClasses: string;
    onClick: () => void;
}> = ({ title, description, icon: Icon, colorClasses, onClick }) => (
    <div
        onClick={onClick}
        className={`relative rounded-2xl shadow-lg cursor-pointer transition-all transform hover:-translate-y-2 duration-300 group overflow-hidden ${colorClasses}`}
    >
        <div className="p-8 flex flex-col items-center justify-center text-center text-white h-64 md:h-72 plus-pattern">
             <div className="p-4 bg-white/10 rounded-full mb-4 border border-white/20 transition-transform duration-300 group-hover:scale-110">
                <Icon className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black">{title}</h2>
            <p className="mt-2 text-white/80">{description}</p>
        </div>
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-sm text-center font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            اختر لعرض الصفوف
        </div>
    </div>
);


const GradeCard: React.FC<{
    grade: Grade;
    color: string;
    onSelect: (grade: Grade) => void;
    delay: number;
}> = ({ grade, color, onSelect, delay }) => {
     return (
        <div
            onClick={() => onSelect(grade)}
            className="relative rounded-2xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-2 duration-300 group overflow-hidden fade-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div 
                className="relative h-48 md:h-56 p-6 flex flex-col justify-end text-white plus-pattern"
                style={{ background: color }}
            >
                <div className="relative z-10">
                    <p className="font-semibold text-white/80">{grade.levelAr}</p>
                    <h3 className="text-3xl font-bold">{grade.name}</h3>
                </div>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 border-t-2 border-yellow-400">
                <p className="font-semibold text-center text-[var(--text-primary)]">عرض محتوى المنهج</p>
            </div>
        </div>
    );
};

interface HomeScreenProps {
    grades: Grade[];
    onSelectGrade: (grade: Grade) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ grades, onSelectGrade }) => {
    const [selectedLevel, setSelectedLevel] = useState<'Middle' | 'Secondary' | null>(null);

    const filteredGrades = useMemo(() => {
        if (!selectedLevel) return [];
        return grades.filter(g => g.level === selectedLevel).sort((a, b) => a.id - b.id);
    }, [grades, selectedLevel]);
    
    const colors = {
        middle: ['#1e90ff', '#20b2aa', '#3cb371'], // DodgerBlue, LightSeaGreen, MediumSeaGreen
        secondary: ['#8a2be2', '#9932cc', '#ba55d3'], // BlueViolet, DarkOrchid, MediumOrchid
    };
    
    if (!selectedLevel) {
        return (
            <div className="fade-in">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[var(--text-primary)]">اختر المرحلة الدراسية</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <LevelCard 
                        title="المرحلة الإعدادية"
                        description="صفوف الأول والثاني والثالث الإعدادي"
                        icon={AtomIcon}
                        colorClasses="bg-gradient-to-br from-blue-500 to-teal-400"
                        onClick={() => setSelectedLevel('Middle')}
                    />
                    <LevelCard 
                        title="المرحلة الثانوية"
                        description="صفوف الأول والثاني والثالث الثانوي"
                        icon={BookOpenIcon}
                        colorClasses="bg-gradient-to-br from-purple-500 to-indigo-500"
                        onClick={() => setSelectedLevel('Secondary')}
                    />
                </div>
            </div>
        );
    }
    
    return (
        <div className="fade-in">
            <button 
                onClick={() => setSelectedLevel(null)}
                className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى اختيار المرحلة</span>
            </button>
            <h2 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">
                {selectedLevel === 'Middle' ? 'صفوف المرحلة الإعدادية' : 'صفوف المرحلة الثانوية'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGrades.map((grade, index) => (
                    <GradeCard 
                        key={grade.id} 
                        grade={grade} 
                        onSelect={onSelectGrade}
                        color={selectedLevel === 'Middle' ? colors.middle[index % colors.middle.length] : colors.secondary[index % colors.secondary.length]}
                        delay={index * 100}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomeScreen;
