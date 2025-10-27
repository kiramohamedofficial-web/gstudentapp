import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { User, Grade, Lesson, LessonType, QuizAttempt, ToastType, Subscription } from '../../types';
import { 
    getGradeById, getSubscriptionByUserId, getQuizAttemptsByUserId, 
    getAllGrades, getStudentProgress, updateUser, deleteUser, 
    createOrUpdateSubscription, getGradesForSelection
} from '../../services/storageService';
import { ArrowRightIcon, CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon, CreditCardIcon, BookOpenIcon, UsersIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';

interface OptionGroup {
    label: string;
    options: { value: string; label: string; }[];
}

const SubscriptionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    subscription: Subscription | undefined;
    onSave: (plan: Subscription['plan'], status: 'Active' | 'Expired', customEndDate?: string) => void;
}> = ({ isOpen, onClose, subscription, onSave }) => {
    const [plan, setPlan] = useState<Subscription['plan']>('Monthly');
    const [status, setStatus] = useState<'Active' | 'Expired'>('Active');
    const [endDate, setEndDate] = useState('');

    React.useEffect(() => {
        if (subscription) {
            setPlan(subscription.plan);
            setStatus(subscription.status);
            setEndDate(subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : '');
        } else {
            setPlan('Monthly');
            setStatus('Active');
            setEndDate('');
        }
    }, [subscription, isOpen]);

    const handleSubmit = () => {
        onSave(plan, status, endDate || undefined);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إدارة الاشتراك">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الباقة</label>
                    <select value={plan} onChange={(e) => setPlan(e.target.value as any)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <option value="Monthly">شهرية</option>
                        <option value="Quarterly">ربع سنوية</option>
                        <option value="SemiAnnually">نصف سنوية</option>
                        <option value="Annual">سنوية</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">الحالة</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <option value="Active">نشط</option>
                        <option value="Expired">منتهي الصلاحية</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">تاريخ الانتهاء (اختياري)</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">اتركه فارغًا للحساب التلقائي عند التفعيل.</p>
                </div>
                 <div className="flex justify-end pt-4">
                    <button onClick={handleSubmit} className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ التغييرات</button>
                </div>
            </div>
        </Modal>
    );
};

interface StudentDetailViewProps {
  user: User;
  onBack: () => void;
}

const StatCard: React.FC<{ icon: React.FC<{className?:string}>; label: string; value: string | number; colorClass: string; }> = ({icon: Icon, label, value, colorClass}) => (
    <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl flex items-center space-x-3 space-x-reverse">
        <div className={`p-3 rounded-lg ${colorClass.replace('text-', 'bg-').replace(']', '/10]')}`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);

const deriveTrackFromGrade = (gradeId: number): 'Scientific' | 'Literary' | undefined => {
    switch (gradeId) {
        case 5: // الثاني الثانوي - علمي
        case 7: // الثالث الثانوي - علمي علوم
        case 8: // الثالث الثانوي - علمي رياضيات
            return 'Scientific';
        case 6: // الثاني الثانوي - أدبي
        case 9: // الثالث الثانوي - أدبي
            return 'Literary';
        default:
            return undefined;
    }
};


const StudentDetailView: React.FC<StudentDetailViewProps> = ({ user, onBack }) => {
  const { addToast } = useToast();
  const [dataVersion, setDataVersion] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
  
  const [allGrades, setAllGrades] = useState<{id: number, name: string, level: 'Middle' | 'Secondary'}[]>([]);
  const allGradesFromCache = useMemo(() => getAllGrades(), [dataVersion]);
  
  const gradeName = useMemo(() => {
    if (!localUser.grade) return 'غير محدد';
    const gradeInfo = allGrades.find(g => g.id === localUser.grade);
    return gradeInfo?.name || 'غير محدد';
  }, [localUser.grade, allGrades]);

  const gradeOptionsForSelect = useMemo(() => {
    const options: (({ value: string; label: string; }) | OptionGroup)[] = [{ value: '', label: '-- غير محدد --' }];
    const middleSchool = allGrades.filter(g => g.level === 'Middle');
    const secondarySchool = allGrades.filter(g => g.level === 'Secondary');

    if (middleSchool.length > 0) {
        options.push({
            label: 'المرحلة الإعدادية',
            options: middleSchool.map(g => ({ value: g.id.toString(), label: g.name }))
        });
    }
    if (secondarySchool.length > 0) {
        options.push({
            label: 'المرحلة الثانوية',
            options: secondarySchool.map(g => ({ value: g.id.toString(), label: g.name }))
        });
    }
    return options;
  }, [allGrades]);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    const gradesData = getGradesForSelection();
    setAllGrades(gradesData);
  }, []);

  useEffect(() => {
    if (!localUser) return;
    const fetchProgress = async () => {
        const progressData = await getStudentProgress(localUser.id);
        if (progressData) {
            const progressMap = progressData.reduce((acc, item) => {
                acc[item.lesson_id] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setUserProgress(progressMap);
        }
    };
    fetchProgress();
  }, [localUser, dataVersion]);

  useEffect(() => {
    const fetchData = async () => {
        const subPromise = getSubscriptionByUserId(localUser.id);
        const attemptsPromise = getQuizAttemptsByUserId(localUser.id);
        const [subData, attemptsData] = await Promise.all([subPromise, attemptsPromise]);
        setSubscription(subData);
        setQuizAttempts(attemptsData as QuizAttempt[]);
    };
    fetchData();
  }, [localUser.id, dataVersion]);
  
  const lessonMap = useMemo(() => {
    const map = new Map<string, { title: string, unit: string }>();
    allGradesFromCache.forEach(g => {
        g.semesters.forEach(s => {
            s.units.forEach(u => {
                u.lessons.forEach(l => {
                    map.set(l.id, { title: l.title, unit: u.title });
                });
            });
        });
    });
    return map;
  }, [allGradesFromCache]);

  const { totalLessons, completedLessons, progress } = useMemo(() => {
    const grade = localUser.grade ? getGradeById(localUser.grade) : null;
    if (!grade) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    const total = allLessons.length;
    if (total === 0) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const completed = allLessons.filter(l => !!userProgress[l.id]).length;
    return { totalLessons: total, completedLessons: completed, progress: Math.round((completed / total) * 100) };
  }, [localUser.grade, userProgress, allGradesFromCache]);

  const handleOpenEditModal = () => {
    setEditFormData({ ...localUser });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
};

const handleUpdateUser = async () => {
    if (editFormData.id) {
        if (!editFormData.name || !editFormData.phone || !editFormData.guardianPhone) {
            addToast("الرجاء ملء جميع الحقول.", ToastType.ERROR); return;
        }

        const gradeId = editFormData.grade ? Number(editFormData.grade) : null;
        const derivedTrack = gradeId ? deriveTrackFromGrade(gradeId) : undefined;

        const { id, ...profileUpdates } = editFormData;

        const result = await updateUser(editFormData.id, {
            ...profileUpdates,
            grade: gradeId,
            track: derivedTrack === undefined ? null : derivedTrack,
        });

        if (result?.error) {
            addToast(`فشل تحديث البيانات: ${result.error.message}`, ToastType.ERROR);
        } else {
            addToast("تم تحديث بيانات الطالب بنجاح", ToastType.SUCCESS);
            // Update local state to reflect changes immediately
            setLocalUser(prev => ({ ...prev, ...editFormData, grade: gradeId, track: derivedTrack || null }));
            setIsEditModalOpen(false);
        }
    }
  };
  
  const handleDeleteUser = async () => {
      const result = await deleteUser(localUser.id);
      if (result?.error) {
          addToast(`فشل حذف الطالب: ${result.error.message}`, ToastType.ERROR);
      } else {
          addToast(`تم حذف الطالب ${localUser.name} بنجاح`, ToastType.SUCCESS);
          setIsDeleteModalOpen(false);
          onBack();
      }
  }

  const handleSubscriptionUpdate = async (plan: Subscription['plan'], status: 'Active' | 'Expired', endDate?: string) => {
    const { error } = await createOrUpdateSubscription(localUser.id, plan, status, endDate);
    if (error) {
        addToast(`فشل تحديث الاشتراك: ${error.message}`, ToastType.ERROR);
    } else {
        addToast("تم تحديث اشتراك الطالب", ToastType.SUCCESS);
        refreshData();
    }
  };

  if (!localUser) return <div>لا يمكن تحميل بيانات الطالب.</div>;
  
  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى قائمة الطلاب</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Profile & Actions */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-lg">{localUser.name.charAt(0)}</div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{localUser.name}</h1>
                    <p className="text-[var(--text-secondary)]">{gradeName}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--border-primary)] space-y-2 text-sm">
                    <p className="flex justify-between"><strong>الهاتف:</strong> <span className="text-[var(--text-secondary)]">{localUser.phone}</span></p>
                    <p className="flex justify-between"><strong>هاتف ولي الأمر:</strong> <span className="text-[var(--text-secondary)]">{localUser.guardianPhone}</span></p>
                </div>
                 <div className="mt-6 flex gap-2">
                    <button onClick={handleOpenEditModal} className="flex-1 flex items-center justify-center py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"><PencilIcon className="w-4 h-4 ml-2"/> تعديل</button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="flex-1 flex items-center justify-center py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"><TrashIcon className="w-4 h-4 ml-2"/> حذف</button>
                </div>
            </div>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">إدارة الاشتراك</h2>
                <div className="space-y-3">
                    <p>الحالة: <span className={`font-bold ml-2 ${subscription?.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{subscription ? (subscription.status === 'Active' ? 'نشط' : 'منتهي') : 'لا يوجد'}</span></p>
                    {subscription && <p className="text-xs text-[var(--text-secondary)]">ينتهي في: {new Date(subscription.endDate).toLocaleDateString('ar-EG')}</p>}
                    <button onClick={() => setIsSubModalOpen(true)} className="w-full text-center text-sm p-2 rounded-md bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
                        <CreditCardIcon className="w-5 h-5"/>
                        <span>تعديل الاشتراك</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column - Data */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">ملخص التقدم</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={BookOpenIcon} label="إجمالي الدروس" value={totalLessons} colorClass="text-blue-400" />
                    <StatCard icon={CheckCircleIcon} label="دروس مكتملة" value={completedLessons} colorClass="text-green-400" />
                    <StatCard icon={ClockIcon} label="دروس متبقية" value={totalLessons - completedLessons} colorClass="text-amber-400" />
                </div>
            </div>
            
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">سجل الاختبارات والواجبات</h2>
                {quizAttempts.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
                        <table className="w-full text-right text-sm">
                            <thead className="sticky top-0 bg-[var(--bg-secondary)]">
                                <tr>
                                    <th className="pb-2 font-semibold text-[var(--text-secondary)]">الاختبار</th>
                                    <th className="pb-2 font-semibold text-[var(--text-secondary)] text-center">الدرجة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizAttempts.map(attempt => (
                                    <tr key={attempt.id} className="border-t border-[var(--border-primary)]">
                                        <td className="py-2"><p className="font-semibold text-[var(--text-primary)] truncate">{lessonMap.get(attempt.lessonId)?.title || 'درس محذوف'}</p><p className="text-xs text-[var(--text-secondary)]">{new Date(attempt.submittedAt).toLocaleDateString('ar-EG')}</p></td>
                                        <td className={`py-2 text-center font-bold ${attempt.isPass ? 'text-green-500' : 'text-red-500'}`}>{attempt.score}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : ( <p className="text-center text-sm text-[var(--text-secondary)] py-4">لم يقم الطالب بأداء أي اختبارات بعد.</p> )}
            </div>
        </div>
      </div>

       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيانات الطالب">
            <div className="space-y-4">
                <input type="text" placeholder="الاسم" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <input type="text" placeholder="رقم الهاتف" name="phone" value={editFormData.phone || ''} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <input type="text" placeholder="رقم ولي الأمر" name="guardianPhone" value={editFormData.guardianPhone || ''} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <select
                    name="grade"
                    value={String(editFormData.grade || '')}
                    onChange={handleEditFormChange}
                    className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]"
                >
                    {gradeOptionsForSelect.map(item => {
                        if ('options' in item) { // It's a group
                            return (
                                <optgroup key={item.label} label={item.label}>
                                    {item.options.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </optgroup>
                            );
                        } else { // It's a single option at the top
                            return <option key={item.value} value={item.value}>{item.label}</option>;
                        }
                    })}
                </select>
                <div className="flex justify-end pt-4"><button onClick={handleUpdateUser} className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ التغييرات</button></div>
            </div>
       </Modal>
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد حذف الطالب">
            <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد من رغبتك في حذف الطالب <span className="font-bold text-[var(--text-primary)]">{localUser.name}</span>؟ سيتم حذف جميع بياناته واشتراكاته بشكل دائم.</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                <button onClick={handleDeleteUser} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، قم بالحذف</button>
            </div>
        </Modal>
        <SubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} subscription={subscription || undefined} onSave={handleSubscriptionUpdate} />
    </div>
  );
};

export default StudentDetailView;