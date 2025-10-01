import React, { useMemo } from 'react';
import { Grade } from '../../types';

interface GradeCardProps {
    grade: Grade;
    color: string;
    onSelect: (grade: Grade) => void;
}

const GradeCard: React.FC<GradeCardProps> = ({ grade, color, onSelect }) => {
    const [number, suffix] = useMemo(() => {
        const num = grade.ordinal.charAt(0);
        const suf = grade.ordinal.substring(1);
        return [num, suf];
    }, [grade.ordinal]);

    return (
        <div
            onClick={() => onSelect(grade)}
            className="relative rounded-2xl shadow-lg cursor-pointer transition-transform transform hover:-translate-y-2 duration-300 group overflow-hidden"
        >
            <div 
                className="relative h-48 md:h-56 p-6 flex flex-col justify-between text-white plus-pattern"
                style={{ background: color }}
            >
                <div className="relative z-10">
                    <div className="flex items-baseline">
                        <span className="text-8xl font-black text-white/90">{number}</span>
                        <span className="text-3xl font-bold text-yellow-300 -mt-4 ml-1">{suffix}</span>
                    </div>
                    <h3 className="text-3xl font-bold">{grade.level}</h3>
                    <p className="font-semibold text-white/80">{grade.name}</p>
                </div>
            </div>
            <div className="bg-[var(--bg-primary)] p-4 border-t-2 border-yellow-400">
                <p className="font-semibold text-center text-[var(--text-primary)]">عرض محتوى المنهج</p>
                <p className="text-xs text-center text-[var(--text-secondary)]">كل محتوى {grade.name}</p>
            </div>
        </div>
    );
};

interface HomeScreenProps {
    grades: Grade[];
    onSelectGrade: (grade: Grade) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ grades, onSelectGrade }) => {
    const middleSchoolGrades = useMemo(() => grades.filter(g => g.level === 'Middle').sort((a,b) => a.id - b.id), [grades]);
    const secondarySchoolGrades = useMemo(() => grades.filter(g => g.level === 'Secondary').sort((a,b) => a.id - b.id), [grades]);

    const colors = {
        middle: ['#1e90ff', '#20b2aa', '#3cb371'], // DodgerBlue, LightSeaGreen, MediumSeaGreen
        secondary: ['#8a2be2', '#9932cc', '#ba55d3'], // BlueViolet, DarkOrchid, MediumOrchid
    }

    return (
        <div>
            <div className="mb-12">
                <h2 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">المرحلة الإعدادية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {middleSchoolGrades.map((grade, index) => (
                        <GradeCard 
                            key={grade.id} 
                            grade={grade} 
                            onSelect={onSelectGrade}
                            color={colors.middle[index % colors.middle.length]}
                        />
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">المرحلة الثانوية</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {secondarySchoolGrades.map((grade, index) => (
                        <GradeCard 
                            key={grade.id} 
                            grade={grade} 
                            onSelect={onSelectGrade}
                            color={colors.secondary[index % colors.secondary.length]}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
