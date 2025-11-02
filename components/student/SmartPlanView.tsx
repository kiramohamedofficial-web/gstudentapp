import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
import { Unit, ToastType } from '../../types';
import { generateStudyPlan, StudyPlanInputs, StudyScheduleItem } from '../../services/geminiService';
import { useToast } from '../../useToast';
import { SparklesIcon, ArrowRightIcon, TrashIcon, ArrowLeftIcon, PrinterIcon, ClockIcon, BookOpenIcon, CalendarIcon, SunIcon, CheckCircleIcon } from '../common/Icons';

const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const timeOptions = Array.from({ length: 17 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 7 AM to 11 PM

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    const steps = ['أهدافك', 'موادك', 'التزاماتك', 'مراجعة'];
    return (
        <div className="flex justify-between items-center mb-8">
            {steps.map((label, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep > index + 1 ? 'bg-green-500 border-green-500' : currentStep === index + 1 ? 'bg-purple-600 border-purple-600' : 'bg-transparent border-[var(--border-primary)]'}`}>
                            {currentStep > index + 1 ? <CheckCircleIcon className="w-6 h-6 text-white"/> : <span className={`font-bold ${currentStep === index + 1 ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{index + 1}</span>}
                        </div>
                        <p className={`text-xs mt-2 font-semibold transition-colors ${currentStep >= index + 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{label}</p>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-[var(--border-primary)]'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const StepCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
        <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">{title}</h2>
        {children}
    </div>
);

const LoadingView: React.FC = () => {
    const messages = ['تحليل أهدافك وموادك...', 'البحث عن أفضل أوقات المذاكرة...', 'توزيع الجلسات بذكاء...', 'وضع اللمسات الأخيرة على جدولك...'];
    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setMessage(messages[index]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-4">
            <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">لحظات من فضلك...</h2>
            <p className="text-lg text-gray-300 transition-opacity duration-500">{message}</p>
        </div>
    );
};

const ScheduleDisplay: React.FC<{ schedule: StudyScheduleItem[], onReset: () => void, subjectColors: Record<string, string> }> = ({ schedule, onReset, subjectColors }) => {
    const handlePrint = () => window.print();

    const scheduleByDay = useMemo(() => {
        return daysOfWeek.map(day => ({
            day,
            events: schedule.filter(e => e.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime))
        }));
    }, [schedule]);

    return (
        <div className="fade-in print-container">
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-container { padding: 20px; }
                    .no-print { display: none !important; }
                    .print-bg-secondary { background-color: var(--bg-secondary) !important; }
                    .print-text-primary { color: var(--text-primary) !important; }
                    .print-text-secondary { color: var(--text-secondary) !important; }
                    .print-border-primary { border-color: var(--border-primary) !important; }
                }
            `}</style>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">خطتك الدراسية الأسبوعية</h1>
                    <p className="text-[var(--text-secondary)] mt-1">تم إنشاء هذا الجدول خصيصًا لك بواسطة المساعد الذكي.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onReset} className="px-4 py-2 text-sm font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg transition-colors">تعديل الخطة</button>
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"><PrinterIcon className="w-4 h-4"/> طباعة</button>
                </div>
            </div>
            
            {/* Desktop View */}
            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[var(--border-primary)] p-4 overflow-x-auto hidden md:block print-bg-secondary">
                <div className="grid grid-cols-8 min-w-[900px]">
                    <div className="text-center font-semibold text-xs py-2 sticky top-0"></div>
                    {daysOfWeek.map(day => <div key={day} className="text-center font-bold text-sm py-2 sticky top-0 print-bg-secondary print-text-primary">{day}</div>)}
                    
                    {timeOptions.map((time, timeIndex) => (
                        <React.Fragment key={time}>
                            <div className={`text-center font-semibold text-xs py-2 ${timeIndex % 2 === 0 ? '' : 'border-t'} border-[var(--border-primary)] print-border-primary print-text-secondary`}>{time}</div>
                            {daysOfWeek.map(day => {
                                const event = schedule.find(e => e.day === day && e.startTime <= time && e.endTime > time);
                                if (event && event.startTime === time) {
                                    const startIdx = timeOptions.indexOf(event.startTime);
                                    const endIdx = timeOptions.indexOf(event.endTime);
                                    const duration = (endIdx > -1 ? endIdx : timeOptions.length) - startIdx;
                                    return (
                                        <div key={`${day}-${time}`} className={`${timeIndex % 2 === 0 ? '' : 'border-t'} border-[var(--border-primary)] p-1 print-border-primary`} style={{ gridRow: `span ${duration}` }}>
                                            <div className="h-full rounded-lg p-2 text-white flex flex-col justify-center" style={{ backgroundColor: subjectColors[event.subject] || '#4A5568' }}>
                                                <p className="font-bold text-sm">{event.subject}</p>
                                                <p className="text-xs opacity-80">{event.startTime} - {event.endTime}</p>
                                            </div>
                                        </div>
                                    )
                                }
                                if(event) return null; // Slot is covered
                                return <div key={`${day}-${time}`} className={`${timeIndex % 2 === 0 ? '' : 'border-t'} border-[var(--border-primary)] print-border-primary`}></div>;
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Mobile View */}
            <div className="space-y-4 md:hidden">
                {scheduleByDay.map(({ day, events }) => (
                     <div key={day} className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] p-4">
                        <h3 className="font-bold text-lg mb-3 print-text-primary">{day}</h3>
                        {events.length > 0 ? (
                            <div className="space-y-3">
                                {events.map(event => (
                                     <div key={event.startTime} className="flex items-center gap-3">
                                         <div className="w-1.5 h-full rounded-full" style={{ backgroundColor: subjectColors[event.subject] || '#4A5568' }}></div>
                                         <div className="p-3 rounded-lg flex-1" style={{ backgroundColor: `${subjectColors[event.subject] || '#4A5568'}20`}}>
                                            <p className="font-bold text-sm" style={{ color: subjectColors[event.subject] || '#CBD5E0' }}>{event.subject}</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5"><ClockIcon className="w-3 h-3"/> {event.startTime} - {event.endTime}</p>
                                         </div>
                                     </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-center py-4 text-[var(--text-secondary)]">يوم راحة!</p>
                        )}
                    </div>
                ))}
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
    
    const [dailyHours, setDailyHours] = useState(3);
    const [dayStart, setDayStart] = useState('08:00');
    const [dayEnd, setDayEnd] = useState('22:00');
    const [subjects, setSubjects] = useState<Record<string, { name: string, weeklyHours: number, priority: 'مرتفعة' | 'عادية' }>>({});
    const [busyBlocks, setBusyBlocks] = useState<{ id: number; day: string; start: string; end: string }[]>([]);

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
            if (newSubjects[unit.id]) delete newSubjects[unit.id];
            else newSubjects[unit.id] = { name: unit.title, weeklyHours: 2, priority: 'عادية' };
            return newSubjects;
        });
    };

    const handleSubjectDetailChange = (unitId: string, field: 'weeklyHours' | 'priority', value: number | 'مرتفعة' | 'عادية') => {
        setSubjects(prev => ({ ...prev, [unitId]: { ...prev[unitId], [field]: value } }));
    };

    const handleAddBusyBlock = (day: string, start: string, end: string) => {
        if (start >= end) {
            addToast("وقت البدء يجب أن يكون قبل وقت الانتهاء.", ToastType.ERROR);
            return;
        }
        setBusyBlocks(prev => [...prev, { id: Date.now(), day, start, end }]);
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
                const blocksForDay = busyBlocks.filter(b => b.day === day);
                if (blocksForDay.length > 0) {
                    busyTimes[day] = blocksForDay.map(b => `${b.start}-${b.end}`);
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
            ...acc, [subjects[subjectId].name]: colors[index % colors.length]
        }), {});
    }, [subjects]);

    if (!grade) {
        return (
            <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-xl">
                <p>يجب تحديد صفك الدراسي أولاً من ملفك الشخصي لاستخدام هذه الميزة.</p>
            </div>
        );
    }
    
    if (isLoading) return <LoadingView />;
    if (view === 'schedule') return <ScheduleDisplay schedule={generatedSchedule} onReset={() => { setView('setup'); setStep(1); }} subjectColors={subjectColors} />;

    return (
        <div className="fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-[var(--text-primary)] mb-2">الخطة الذكية</h1>
            <p className="text-center text-[var(--text-secondary)] mb-8">دع المساعد الذكي ينظم لك جدول مذاكرة أسبوعي يناسبك.</p>
            <Stepper currentStep={step} />

            {step === 1 && (
                <StepCard title="1. أهدافك اليومية">
                    <div className="space-y-6">
                        <div>
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
                </StepCard>
            )}

            {step === 2 && (
                <StepCard title="2. المواد والأولويات">
                    <div className="space-y-3">
                        {availableSubjects.map(unit => (
                             <div key={unit.id} className={`p-4 rounded-lg border-2 transition-all ${subjects[unit.id] ? 'border-purple-500 bg-purple-500/10' : 'border-transparent bg-[var(--bg-tertiary)]'}`}>
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => handleSubjectToggle(unit)}>
                                    <span className="font-semibold">{unit.title}</span>
                                    <div className={`w-5 h-5 rounded-full border-2 ${subjects[unit.id] ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}></div>
                                </div>
                                {subjects[unit.id] && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border-primary)] space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <label>الساعات الأسبوعية:</label>
                                            <input type="number" min="1" max="20" value={subjects[unit.id].weeklyHours} onChange={e => handleSubjectDetailChange(unit.id, 'weeklyHours', Number(e.target.value))} className="w-16 p-1 text-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded" />
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <label>الأولوية:</label>
                                            <div className="flex items-center p-1 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-primary)]">
                                                <button onClick={() => handleSubjectDetailChange(unit.id, 'priority', 'عادية')} className={`px-2 py-1 text-xs rounded ${subjects[unit.id].priority === 'عادية' ? 'bg-gray-500 text-white' : ''}`}>عادية</button>
                                                <button onClick={() => handleSubjectDetailChange(unit.id, 'priority', 'مرتفعة')} className={`px-2 py-1 text-xs rounded ${subjects[unit.id].priority === 'مرتفعة' ? 'bg-red-500 text-white' : ''}`}>مرتفعة</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </StepCard>
            )}
            
            {step === 3 && (
                <StepCard title="3. أوقاتك غير المتاحة">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {daysOfWeek.map(day => (
                            <div key={day} className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                <h4 className="font-semibold mb-2">{day}</h4>
                                <div className="space-y-1">
                                    {busyBlocks.filter(b => b.day === day).map(block => (
                                        <div key={block.id} className="flex items-center justify-between text-xs bg-[var(--bg-secondary)] p-1.5 rounded">
                                            <span>{block.start} - {block.end}</span>
                                            <button onClick={() => setBusyBlocks(prev => prev.filter(b => b.id !== block.id))}><TrashIcon className="w-3 h-3 text-red-500"/></button>
                                        </div>
                                    ))}
                                </div>
                                <AddBusyBlockForm day={day} onAdd={handleAddBusyBlock} />
                            </div>
                        ))}
                    </div>
                </StepCard>
            )}
            
            {step === 4 && (
                <StepCard title="4. مراجعة وإنشاء">
                     <div className="space-y-4">
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg"><strong>أهدافك:</strong> {dailyHours} ساعات يومياً، من {dayStart} إلى {dayEnd}.</div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg"><strong>المواد:</strong> {Object.keys(subjects).length} مواد.</div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg"><strong>الأوقات المشغولة:</strong> {busyBlocks.length} فترة.</div>
                    </div>
                </StepCard>
            )}

            <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1} className="px-6 py-2 font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg disabled:opacity-50 flex items-center gap-2"><ArrowRightIcon className="w-4 h-4"/> السابق</button>
                {step < 4 ? (
                    <button onClick={() => setStep(s => Math.min(4, s+1))} className="px-6 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2">التالي <ArrowLeftIcon className="w-4 h-4"/></button>
                ) : (
                    <button onClick={handleGenerate} className="px-6 py-2 font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> إنشاء الخطة</button>
                )}
            </div>
        </div>
    );
};

const AddBusyBlockForm: React.FC<{ day: string; onAdd: (day: string, start: string, end: string) => void }> = ({ day, onAdd }) => {
    const [start, setStart] = useState('14:00');
    const [end, setEnd] = useState('16:00');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onAdd(day, start, end); }} className="flex gap-2 items-end mt-2">
            <select value={start} onChange={e => setStart(e.target.value)} className="w-full text-xs p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <span className="text-xs">إلى</span>
            <select value={end} onChange={e => setEnd(e.target.value)} className="w-full text-xs p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded">{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <button type="submit" className="px-2 py-1 text-xs font-bold bg-purple-600 text-white rounded">+</button>
        </form>
    )
};

export default SmartPlanView;
