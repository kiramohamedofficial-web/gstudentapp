
import React, { useState, useEffect, useMemo } from 'react';
import { User, WeakArea } from '../../types';
import { getAllGrades, getQuizAttemptsByUserId, getGradeById } from '../../services/storageService';
import { getAIStudyPlan } from '../../services/geminiService';
import Loader from '../common/Loader';
import { SparklesIcon } from '../common/Icons';

// A simple component to render markdown-like text content into JSX elements
const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');

    const renderLine = (line: string, index: number) => {
        if (line.startsWith('# ')) {
            return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-[var(--text-primary)]">{line.substring(2)}</h2>;
        }
        if (line.startsWith('* ') || line.startsWith('- ')) {
            const prevLine = index > 0 ? lines[index-1] : '';
            const isStartOfList = !prevLine.startsWith('* ') && !prevLine.startsWith('- ');
            
            const item = <li key={index} className="mb-1">{line.substring(2)}</li>;

            if(isStartOfList) {
                // This is a simplified approach; it creates a new ul for each block of list items.
                const listItems = [item];
                let nextIndex = index + 1;
                while(nextIndex < lines.length && (lines[nextIndex].startsWith('* ') || lines[nextIndex].startsWith('- '))) {
                    listItems.push(<li key={nextIndex} className="mb-1">{lines[nextIndex].substring(2)}</li>);
                    nextIndex++;
                }
                return <ul key={index} className="list-disc list-inside space-y-2 mt-2">{listItems}</ul>;
            }
            // If it's not the start of a list, it's already been rendered by the logic above.
            if (!prevLine.startsWith('* ') && !prevLine.startsWith('- ')) {
                 return <p key={index} className="my-2">{line}</p>;
            }
            return null;

        }
        return <p key={index} className="my-2">{line}</p>;
    };

    return (
        <div className="prose text-[var(--text-secondary)] leading-relaxed">
            {lines.map(renderLine)}
        </div>
    );
};


const StudyPlanView: React.FC<{ user: User }> = ({ user }) => {
    const [plan, setPlan] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const grade = useMemo(() => getGradeById(user.grade), [user.grade]);

    useEffect(() => {
        const generatePlan = async () => {
            if (!grade) {
                setError("لا يمكن العثور على بيانات الصف الدراسي.");
                setIsLoading(false);
                return;
            }

            try {
                const attempts = getQuizAttemptsByUserId(user.id);
                const allGrades = getAllGrades();
                const lessonMap = new Map<string, { lessonTitle: string, unitTitle: string }>();
                allGrades.forEach(g => {
                    g.semesters.forEach(s => {
                        s.units.forEach(u => {
                            u.lessons.forEach(l => {
                                lessonMap.set(l.id, { lessonTitle: l.title, unitTitle: u.title });
                            });
                        });
                    });
                });

                const weakAttempts = attempts.filter(a => a.score < 70);

                if (weakAttempts.length === 0) {
                    setPlan("Congratulatory message"); // special case
                    setIsLoading(false);
                    return;
                }
                
                const weakAreas: WeakArea[] = weakAttempts
                    .map(attempt => {
                        const lessonInfo = lessonMap.get(attempt.lessonId);
                        if (!lessonInfo) return null;
                        return {
                            ...lessonInfo,
                            score: attempt.score,
                        };
                    })
                    .filter((area): area is WeakArea => area !== null);

                const generatedPlan = await getAIStudyPlan(user.name, grade.name, weakAreas);
                setPlan(generatedPlan);
            } catch (e: any) {
                setError("حدث خطأ أثناء الاتصال بالمساعد الذكي.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        generatePlan();
    }, [user, grade]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-secondary)] rounded-xl">
                    <Loader />
                    <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">جاري إعداد خطتك...</p>
                    <p className="text-[var(--text-secondary)]">يقوم مساعدك الذكي بتحليل أدائك الآن.</p>
                </div>
            );
        }
        if (error) {
            return <div className="text-center p-12 text-red-400 bg-[var(--bg-secondary)] rounded-xl">{error}</div>;
        }

        if (plan === "Congratulatory message") {
             return (
                <div className="text-center p-12 bg-green-500/10 rounded-xl border border-green-500/30">
                    <SparklesIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-300">أداء متميز!</h2>
                    <p className="text-green-200/80 mt-2">لم نجد أي نقاط ضعف في نتائجك الأخيرة. استمر في العمل الرائع!</p>
                </div>
            );
        }

        if (plan) {
            return (
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                    <SimpleMarkdownRenderer content={plan} />
                </div>
            );
        }

        return null;
    }

    return (
        <div>
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <SparklesIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">الخطة الدراسية الذكية</h1>
            </div>
            {renderContent()}
        </div>
    );
};

export default StudyPlanView;
