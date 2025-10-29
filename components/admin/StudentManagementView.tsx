import React, { useState, useMemo, useEffect } from 'react';
import { User, Subscription, Grade } from '../../types';
import { getAllGrades } from '../../services/storageService';
import { SearchIcon, UsersIcon, ChevronLeftIcon } from '../common/Icons';
import Loader from '../common/Loader';

const StudentManagementView: React.FC<{
    onViewDetails: (user: User) => void;
    initialData: { users: User[], subscriptions: Subscription[], allProgress: any[] };
    isLoading: boolean;
}> = ({ onViewDetails, initialData, isLoading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    
    const { users: allUsers, subscriptions: allSubscriptions, allProgress } = initialData;
    const allGrades = useMemo(() => getAllGrades(), []);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); 

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const subscriptionsMap = useMemo(() => new Map(allSubscriptions.map(s => [s.userId, s])), [allSubscriptions]);

    const progressByStudent = useMemo(() => {
        const map = new Map<string, Record<string, boolean>>();
        allProgress.forEach(p => {
            if (!map.has(p.user_id)) {
                map.set(p.user_id, {});
            }
            map.get(p.user_id)![p.lesson_id] = true;
        });
        return map;
    }, [allProgress]);

    const calculateStudentProgress = (user: User, grades: Grade[]): number => {
        const grade = grades.find(g => g.id === user.grade);
        if (!grade) return 0;
        
        const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
        if (allLessons.length === 0) return 0; 

        const userProgress = progressByStudent.get(user.id) || {};
        const completed = allLessons.filter(l => !!userProgress[l.id]).length;
        return Math.round((completed / allLessons.length) * 100);
    };

    const filteredUsers = useMemo(() => {
        return allUsers
            .map(user => ({
                ...user,
                progress: calculateStudentProgress(user, allGrades),
                subscription: subscriptionsMap.get(user.id),
            }))
            .filter(user => {
                const query = debouncedSearchQuery.toLowerCase();
                const searchMatch = (user.name && user.name.toLowerCase().includes(query)) || (user.phone && user.phone.includes(query));
                const gradeMatch = gradeFilter ? user.grade != null && user.grade.toString() === gradeFilter : true;
                return searchMatch && gradeMatch;
            });
    }, [allUsers, allGrades, debouncedSearchQuery, gradeFilter, subscriptionsMap, progressByStudent]);
    
    const uniqueGrades = useMemo(() => {
        const gradeSet = new Set<string>();
        allUsers.forEach(u => {
            if (u.grade != null) {
                gradeSet.add(u.grade.toString());
            }
        });
        return Array.from(gradeSet).sort((a,b) => parseInt(a) - parseInt(b)).map(g => ({
            id: g,
            name: allGrades.find(grade => grade.id === parseInt(g))?.name || `الصف ${g}`
        }));
    }, [allUsers, allGrades]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الطلاب</h1>
            
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg border border-[var(--border-primary)] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
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
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                             className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">كل الصفوف</option>
                            {uniqueGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div key={user.id} className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] p-4 transition-all duration-300 hover:border-purple-400 hover:shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{user.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-lg text-[var(--text-primary)]">{user.name}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">{allGrades.find(g => g.id === user.grade)?.name}</p>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex justify-between items-center mb-1"><span className="text-xs font-semibold text-[var(--text-secondary)]">التقدم</span><span className="text-xs font-bold text-purple-400">{user.progress}%</span></div>
                                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{width: `${user.progress}%`}}></div></div>
                                </div>
                                <div className="flex items-center gap-4 justify-between md:justify-end">
                                     <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${user.subscription && user.subscription.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {user.subscription && user.subscription.status === 'Active' ? 'اشتراك نشط' : 'غير نشط'}
                                    </span>
                                    <button onClick={() => onViewDetails(user)} className="py-2 px-4 text-sm font-semibold text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors whitespace-nowrap flex items-center">
                                        التفاصيل <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                        <UsersIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                        <p className="text-[var(--text-secondary)]">لم يتم العثور على طلاب مطابقين لمعايير البحث.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentManagementView;
