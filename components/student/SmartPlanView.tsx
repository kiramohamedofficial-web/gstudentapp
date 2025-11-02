import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
import { Unit, ToastType } from '../../types';
import { generateStudyPlan, StudyPlanInputs, StudyScheduleItem } from '../../services/geminiService';
import Loader from '../common/Loader';
import { useToast } from '../../useToast';
import { SparklesIcon, ArrowRightIcon, TrashIcon, ArrowLeftIcon, PrinterIcon, ClockIcon } from '../common/Icons';

const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const timeSlots = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 7 AM to 10 PM

const ScheduleDisplay: React.FC<{ schedule: StudyScheduleItem[], onReset: () => void, subjectColors: Record<string, string> }> = ({ schedule, onReset, subjectColors }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">خطتك الدراسية الأسبوعية</h1>
                    <p className="text-[var(--text-secondary)] mt-1">تم إنشاء هذا الجدول خصيصًا لك بواسطة المساعد الذكي.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onReset} className="px-4 py-2 text-sm font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg transition-colors">تعديل الخطة</button>
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"><PrinterIcon className="w-4 h-4"/> طباعة</button>
                </div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[var(--border-primary)] p-4 overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[800px]">
                    <div className="text-center font-semibold text-xs text-[var(--text-secondary)] py-2 sticky top-0"></div>
                    {daysOfWeek.map(day => <div key={day} className="text-center font-bold text-sm text-[var(--text-primary)] py-2 sticky top-0 bg-[var(--bg-secondary)]">{day}</div>)}
                    
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-center font-semibold text-xs text-[var(--text-secondary)] py-2 border-t border-[var(--border-primary)]">{time}</div>
                            {daysOfWeek.map(day => {
                                const event = schedule.find(e => e.day === day && e.startTime <= time && e.endTime > time);
                                if (event && event.startTime === time) {
                                    const start = timeSlots.indexOf(event.startTime);
                                    const end = timeSlots.indexOf(event.endTime);
                                    const duration = end - start;
                                    return (
                                        <div key={`${day}-${time}`} className="border-t border-[var(--border-primary)] p-1" style={{ gridRow: `span ${duration}` }}>
                                            <div className="h-full rounded-lg p-2 text-white flex flex-col justify-center" style={{ backgroundColor: subjectColors[event.subject] || '#4A5568' }}>
                                                <p className="font-bold text-sm">{event.subject}</p>
                                                <p className="text-xs opacity-80">{event.startTime} - {event.endTime}</p>
                                            </div>
                                        </div>
                                    )
                                }
                                if(event) return null; // Slot is covered by an event starting earlier
                                return <div key={`${day}-${time}`} className="border-t border-[var(--border-primary)]"></div>;
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SmartPlanView: React.FC = () => {
    const { currentUser: user } = useSession();
    const { addToast } = useToast();
    const grade = useMemo(() => user?.gradeData ?? null, [user]);

    const [view, setView] = useState<'setup' | 'schedule'>('setup');
    const [step, setStep] = useState(1);
    
    // Step 1 State
    const [dailyHours, setDailyHours] = useState(3);
    const [dayStart, setDayStart] = useState('08:00');
    const [dayEnd, setDayEnd] = useState('22:00');

    // Step 2 State
    const [subjects, setSubjects] = useState<Record<string, { name: string, weeklyHours: number, priority: 'مرتفعة' | 'عادية' }>>({});

    // Step 3 State
    const [busySlots, setBusySlots] = useState<Record<string, boolean[]>>(
        daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: Array(timeSlots.length).fill(false) }), {})
    );

    // Final State
    const [isLoading, setIsLoading] = useState(false);
    const [generatedSchedule, setGeneratedSchedule] = useState<StudyScheduleItem[]>([]);
    
    const availableSubjects = useMemo(() => {
        if (!grade || !user) return [];
        return grade.semesters.flatMap(s => s.units.filter(u =>
            !u.track || u.track === 'All' || u.track === user.track
        ));
    }, [grade, user]);

    const handleSubjectToggle = (unit: Unit) => {
        setSubjects(prev => {
            const newSubjects = { ...prev };
            if (newSubjects[unit.id]) {
                delete newSubjects[unit.id];
            } else {
                newSubjects[unit.id] = { name: unit.title, weeklyHours: 2, priority: 'عادية' };
            }
            return newSubjects;
        });
    };

    const handleSubjectDetailChange = (unitId: string, field: 'weeklyHours' | 'priority', value: number | 'مرتفعة' | 'عادية') => {
        setSubjects(prev => ({
            ...prev,
            [unitId]: { ...prev[unitId], [field]: value }
        }));
    };

    const handleSlotClick = (day: string, timeIndex: number) => {
        setBusySlots(prev => {
            const newDaySlots = [...prev[day]];
            newDaySlots[timeIndex] = !newDaySlots[timeIndex];
            return { ...prev, [day]: newDaySlots };
        });
    };

    const handleGenerate = async () => {
        if (Object.keys(subjects).length === 0) {
            addToast("الرجاء اختيار مادة واحدة على الأقل.", ToastType.ERROR);
            return;
        }

        setIsLoading(true);
        try {
            const busyTimes: Record<string, string[]> = {};
            daysOfWeek.forEach(day => {
                busyTimes[day] = [];
                let start: number | null = null;
                busySlots[day].forEach((isBusy, index) => {
                    if (isBusy && start === null) start = index;
                    if (!isBusy && start !== null) {
                        busyTimes[day].push(`${timeSlots[start]} - ${timeSlots[index]}`);
                        start = null;
                    }
                });
                if (start !== null) {
                     busyTimes[day].push(`${timeSlots[start]} - 23:00`);
                }
            });

            const inputs: StudyPlanInputs = {
                gradeName: grade?.name || 'غير محدد',
                dailyStudyHours: dailyHours,
                dayStartTime: dayStart,
                dayEndTime: dayEnd,
                subjects: Object.values(subjects),
                busyTimes,
            };

            const schedule = await generateStudyPlan(inputs);
            setGeneratedSchedule(schedule);
            setView('schedule');
        } catch (e: any) {
            addToast(e.message, ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    };
    
    const subjectColors = useMemo(() => {
        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899'];
        return Object.keys(subjects).reduce((acc, subjectId, index) => ({
            ...acc,
            [subjects[subjectId].name]: colors[index % colors.length]
        }), {});
    }, [subjects]);

    if (!grade) {
        return (
            <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-xl">
                <p>يجب تحديد صفك الدراسي أولاً من ملفك الشخصي لاستخدام هذه الميزة.</p>
            </div>
        );
    }
    
    if (view === 'schedule') {
        return <ScheduleDisplay schedule={generatedSchedule} onReset={() => setView('setup')} subjectColors={subjectColors} />;
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">الخطة الذكية</h1>
            <p className="text-[var(--text-secondary)] mb-8">دع المساعد الذكي ينظم لك جدول مذاكرة أسبوعي يناسبك.</p>

            <div className="space-y-8">
                {/* Step 1 */}
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold mb-4">1. أهدافك اليومية</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كم ساعة تود المذاكرة يومياً؟ ({dailyHours} ساعات)</label>
                             <input type="range" min="1" max="8" value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">يبدأ يومك</label>
                                 <select value={dayStart} onChange={e => setDayStart(e.target.value)} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"><option>07:00</option><option>08:00</option><option>09:00</option></select>
                            </div>
                             <div>
                                 <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">ينتهي يومك</label>
                                 <select value={dayEnd} onChange={e => setDayEnd(e.target.value)} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md"><option>21:00</option><option>22:00</option><option>23:00</option></select>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Step 2 */}
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold mb-4">2. المواد والأولويات</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">اختر المواد التي تريد التركيز عليها:</p>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {availableSubjects.map(unit => (
                                    <label key={unit.id} className="flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer">
                                        <input type="checkbox" checked={!!subjects[unit.id]} onChange={() => handleSubjectToggle(unit)} className="w-4 h-4 text-purple-600 rounded" />
                                        <span className="mr-3">{unit.title}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                             {Object.keys(subjects).map(unitId => (
                                <div key={unitId} className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                                    <p className="font-semibold text-sm mb-2">{subjects[unitId].name}</p>
                                    <div className="flex items-center gap-3 text-sm">
                                        <input type="number" value={subjects[unitId].weeklyHours} onChange={e => handleSubjectDetailChange(unitId, 'weeklyHours', Number(e.target.value))} className="w-16 p-1 text-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded" />
                                        <span>ساعة/أسبوع</span>
                                        <select value={subjects[unitId].priority} onChange={e => handleSubjectDetailChange(unitId, 'priority', e.target.value as any)} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">
                                            <option value="عادية">أهمية عادية</option>
                                            <option value="مرتفعة">أهمية مرتفعة</option>
                                        </select>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
                {/* Step 3 */}
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold mb-4">3. أوقاتك غير المتاحة</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">حدد الساعات التي تكون فيها مشغولاً (مثل المدرسة أو الأنشطة الأخرى).</p>
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-8 min-w-[700px]">
                            <div></div>
                            {daysOfWeek.map(day => <div key={day} className="text-center text-xs font-bold mb-2">{day}</div>)}
                            {timeSlots.map((time, timeIndex) => (
                                <React.Fragment key={time}>
                                    <div className="text-center text-xs text-[var(--text-secondary)] pt-1">{time}</div>
                                    {daysOfWeek.map(day => (
                                        <div key={`${day}-${time}`} className="border border-[var(--border-primary)] h-8">
                                            <button onClick={() => handleSlotClick(day, timeIndex)} className={`w-full h-full transition-colors ${busySlots[day][timeIndex] ? 'bg-red-500/50 hover:bg-red-500/70' : 'bg-transparent hover:bg-purple-500/20'}`}></button>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Generate */}
                <div className="text-center">
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full md:w-auto px-10 py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg disabled:opacity-60 transition-transform transform hover:scale-105 shadow-lg">
                        {isLoading ? <Loader /> : <span className="flex items-center justify-center gap-2"><SparklesIcon className="w-6 h-6"/> إنشاء الخطة الذكية</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmartPlanView;
