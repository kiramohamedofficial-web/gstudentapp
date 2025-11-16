import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Teacher, User, Subscription, Grade } from '../../types';
import { getSubscriptionsByTeacherIds, getUsersByIds, getAllGrades } from '../../services/storageService';
import { SearchIcon, ChevronLeftIcon, UsersIcon } from '../common/Icons';
import Loader from '../common/Loader';

const StudentCard: React.FC<{
    student: User;
    subscription: Subscription | undefined;
    teacherName: string;
    gradeName: string;
    onViewDetails: () => void;
}> = ({ student, subscription, teacherName, gradeName, onViewDetails }) => {
    const hasActiveSub = subscription?.endDate && new Date(subscription.endDate) >= new Date();

    return (
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] transition-all duration-300 hover:border-purple-400 hover:shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{student.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-[var(--text-primary)] truncate" dir="auto">{student.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]" dir="ltr">{student.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 self-start sm:self-center">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${hasActiveSub ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {hasActiveSub ? 'اشتراك نشط' : 'غير نشط'}
                    </span>
                    <button onClick={onViewDetails} className="py-2 px-4 text-sm font-semibold text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors whitespace-nowrap flex items-center">
                        التفاصيل <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    </button>
                </div>
            </div>
            <div className="px-4 pb-4 pt-3 border-t border-[var(--border-primary)] flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">{gradeName}</span>
                <span className="text-[var(--text-secondary)]">المدرس: <span className="font-semibold text-[var(--text-primary)]">{teacherName}</span></span>
            </div>
        </div>
    );
};

interface SupervisorStudentManagementViewProps {
    supervisedTeachers: Teacher[];
    onViewDetails: (user: User) => void;
}

const SupervisorStudentManagementView: React.FC<SupervisorStudentManagementViewProps> = ({ supervisedTeachers, onViewDetails }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [teacherFilter, setTeacherFilter] = useState(''); // teacherId or '' for all
    const [allGrades, setAllGrades] = useState<Grade[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const teacherIds = supervisedTeachers.map(t => t.id);
            if (teacherIds.length === 0) {
                setStudents([]);
                setSubscriptions(new Map());
                setIsLoading(false);
                return;
            }

            const [subs, grades] = await Promise.all([
                getSubscriptionsByTeacherIds(teacherIds),
                getAllGrades()
            ]);
            
            setAllGrades(grades);

            const studentIds = [...new Set(subs.map(s => s.userId))];
            if (studentIds.length > 0) {
                const studentData = await getUsersByIds(studentIds);
                setStudents(studentData);
            } else {
                setStudents([]);
            }
            
            setSubscriptions(new Map(subs.map(s => [s.userId, s])));
            setIsLoading(false);
        };
        fetchData();
    }, [supervisedTeachers]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const subscription = subscriptions.get(student.id);
            const searchMatch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.phone?.includes(searchQuery);
            const teacherMatch = teacherFilter ? subscription?.teacherId === teacherFilter : true;
            return searchMatch && teacherMatch;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [students, subscriptions, searchQuery, teacherFilter]);

    const teacherMap = useMemo(() => new Map(supervisedTeachers.map(t => [t.id, t.name])), [supervisedTeachers]);
    const gradeMap = useMemo(() => new Map(allGrades.map(g => [g.id, g.name])), [allGrades]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الطلاب ({filteredStudents.length})</h1>
            
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg border border-[var(--border-primary)] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ابحث بالاسم أو رقم الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 pr-10 pl-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-[var(--text-secondary)]" /></div>
                    </div>
                    <div>
                        <select
                            value={teacherFilter}
                            onChange={(e) => setTeacherFilter(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">كل المدرسين</option>
                            {supervisedTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                        const subscription = subscriptions.get(student.id);
                        return (
                            <StudentCard
                                key={student.id}
                                student={student}
                                subscription={subscription}
                                teacherName={teacherMap.get(subscription?.teacherId || '') || 'غير معروف'}
                                gradeName={gradeMap.get(student.grade as number) || 'غير محدد'}
                                onViewDetails={() => onViewDetails(student)}
                            />
                        );
                    })
                ) : (
                    <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                        <UsersIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                        <p className="text-[var(--text-secondary)]">لا يوجد طلاب مشتركين مع المدرسين الذين تشرف عليهم.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupervisorStudentManagementView;
