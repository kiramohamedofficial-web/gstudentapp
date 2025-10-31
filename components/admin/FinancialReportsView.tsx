import React, { useState, useEffect, useMemo } from 'react';
import { 
    getAllSubscriptions, 
    getPlatformSettings, 
    getAllTeachers, 
    getAllGrades, 
    getAllStudentProgress, 
    getAllQuizAttempts 
} from '../../services/storageService';
import { Teacher, Subscription, Grade, PlatformSettings, QuizAttempt, Lesson } from '../../types';
import Loader from '../common/Loader';
import { ChartBarIcon, UsersIcon, VideoCameraIcon, BookOpenIcon, PencilIcon } from '../common/Icons';

interface TeacherPerformance extends Teacher {
    studentCount: number;
    totalInteractions: number;
}

const FinancialReportsView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [monthlyRevenue, setMonthlyRevenue] = useState<Record<string, number>>({});
    const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [subs, settings, teachers, grades, progress, attempts] = await Promise.all([
                getAllSubscriptions(),
                getPlatformSettings(),
                getAllTeachers(),
                getAllGrades(),
                getAllStudentProgress(),
                getAllQuizAttempts()
            ]);

            // Calculate monthly revenue
            if (settings) {
                const prices: Record<string, number> = {
                    Monthly: settings.monthlyPrice,
                    Quarterly: settings.quarterlyPrice,
                    SemiAnnually: settings.semiAnnuallyPrice,
                    Annual: settings.annualPrice
                };
                const revenue: Record<string, number> = {};
                subs.forEach(sub => {
                    const date = new Date(sub.startDate);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const price = prices[sub.plan] || 0;
                    if (!revenue[monthKey]) revenue[monthKey] = 0;
                    revenue[monthKey] += price;
                });
                setMonthlyRevenue(revenue);
            }

            // Calculate teacher performance
            const lessonsByTeacher = new Map<string, string[]>();
            grades.flatMap(g => g.semesters.flatMap(s => s.units.flatMap(u => u.lessons.map(l => ({...l, teacherId: u.teacherId})))))
                  .forEach(lesson => {
                      if (!lessonsByTeacher.has(lesson.teacherId)) lessonsByTeacher.set(lesson.teacherId, []);
                      lessonsByTeacher.get(lesson.teacherId)!.push(lesson.id);
                  });

            const performanceData = teachers.map(teacher => {
                const teacherSubs = subs.filter(s => s.teacherId === teacher.id);
                const studentCount = new Set(teacherSubs.map(s => s.userId)).size;

                const teacherLessonIds = new Set(lessonsByTeacher.get(teacher.id) || []);
                const progressCount = progress.filter(p => teacherLessonIds.has(p.lesson_id)).length;
                const attemptCount = attempts.filter(a => teacherLessonIds.has(a.lessonId)).length;
                const totalInteractions = progressCount + attemptCount;

                return {
                    ...teacher,
                    studentCount,
                    totalInteractions,
                };
            });
            
            performanceData.sort((a, b) => b.studentCount - a.studentCount || b.totalInteractions - a.totalInteractions);
            setTeacherPerformance(performanceData);

            setIsLoading(false);
        };

        fetchData();
    }, []);
    
    const sortedMonths = useMemo(() => Object.keys(monthlyRevenue).sort().reverse(), [monthlyRevenue]);
    // FIX: Added explicit types to the reduce function's parameters to resolve the TypeScript error.
    const totalRevenue = useMemo(() => Object.values(monthlyRevenue).reduce((sum: number, rev: number) => sum + rev, 0), [monthlyRevenue]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">التقارير المالية والأداء</h1>
                <p className="text-[var(--text-secondary)] mt-1">نظرة شاملة على إيرادات المنصة وأداء المدرسين.</p>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
                    <ChartBarIcon className="w-6 h-6 text-purple-400" />
                    تقرير الإيرادات الشهري
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="border-b border-[var(--border-primary)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">الشهر</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">الإيرادات المحققة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMonths.map(monthKey => (
                                <tr key={monthKey} className="border-b border-[var(--border-primary)] last:border-b-0">
                                    <td className="px-4 py-3 font-medium">{new Date(monthKey + '-02').toLocaleString('ar-EG', {month: 'long', year: 'numeric'})}</td>
                                    <td className="px-4 py-3 font-bold text-lg text-green-400">{monthlyRevenue[monthKey].toLocaleString()} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-[var(--border-secondary)]">
                            <tr>
                                <td className="px-4 py-3 font-bold text-lg text-[var(--text-primary)]">الإجمالي</td>
                                <td className="px-4 py-3 font-bold text-xl text-green-300">{totalRevenue.toLocaleString()} ج.م</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                 <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
                    <UsersIcon className="w-6 h-6 text-purple-400" />
                    تقرير أداء المدرسين
                </h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="border-b border-[var(--border-primary)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">المدرس</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">المادة</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-center">الطلاب المشتركون</th>
                                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)] text-center">إجمالي التفاعلات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherPerformance.map(teacher => (
                                <tr key={teacher.id} className="border-b border-[var(--border-primary)] last:border-b-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={teacher.imageUrl} alt={teacher.name} className="w-10 h-10 rounded-full object-cover" />
                                            <span className="font-semibold text-[var(--text-primary)]">{teacher.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{teacher.subject}</td>
                                    <td className="px-4 py-3 text-center font-bold text-lg">{teacher.studentCount}</td>
                                    <td className="px-4 py-3 text-center font-bold text-lg">{teacher.totalInteractions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialReportsView;