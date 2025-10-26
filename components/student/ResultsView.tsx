import React, { useMemo, useState, useEffect } from 'react';
import { User, QuizAttempt } from '../../types';
import { getQuizAttemptsByUserId, getAllGrades } from '../../services/storageService';
import { CheckCircleIcon, XCircleIcon } from '../common/Icons';
import Loader from '../common/Loader';
import { useSession } from '../../hooks/useSession';

const ResultsView: React.FC = () => {
    const { currentUser: user } = useSession();
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!user) return;
        const fetchAttempts = async () => {
            setIsLoading(true);
            const data = await getQuizAttemptsByUserId(user.id);
            setAttempts(data);
            setIsLoading(false);
        };
        fetchAttempts();
    }, [user]);

    const lessonMap = useMemo(() => {
        const map = new Map<string, string>();
        const allGrades = getAllGrades();
        allGrades.forEach(grade => {
            grade.semesters.forEach(semester => {
                semester.units.forEach(unit => {
                    unit.lessons.forEach(lesson => {
                        map.set(lesson.id, lesson.title);
                    });
                });
            });
        });
        return map;
    }, []);

    if (!user) return null;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">سجل الواجبات والنتائج</h1>
            
            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-x-auto">
                 {isLoading ? (
                    <div className="flex justify-center items-center p-20"><Loader /></div>
                 ) : (
                    <table className="w-full text-right text-sm text-[var(--text-secondary)]">
                        <thead className="bg-[var(--bg-tertiary)]">
                            <tr>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الواجب/الامتحان</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">التاريخ</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)] text-center">الدرجة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)] text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {attempts.length > 0 ? attempts.map(attempt => (
                                <tr key={attempt.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                                        {lessonMap.get(attempt.lessonId) || 'درس محذوف'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(attempt.submittedAt).toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className={`px-6 py-4 text-center font-bold text-lg ${attempt.isPass ? 'text-green-600' : 'text-red-600'}`}>
                                        {attempt.score}%
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center justify-center space-x-2 space-x-reverse px-3 py-1 text-xs font-semibold rounded-full ${attempt.isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {attempt.isPass ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                            <span>{attempt.isPass ? 'ناجح' : 'لم يجتاز'}</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-[var(--text-secondary)]">
                                        لم تقم بأداء أي واجبات أو امتحانات بعد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 )}
            </div>
        </div>
    );
};

export default ResultsView;
