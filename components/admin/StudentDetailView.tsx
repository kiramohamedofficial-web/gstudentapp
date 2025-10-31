import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { User, Grade, ToastType, Subscription, QuizAttempt } from '../../types';
import { 
    getSubscriptionByUserId, 
    getAllGrades, updateUser, deleteUser, 
    createOrUpdateSubscription, getGradesForSelection, clearUserDevices,
    getStudentProgress, getStudentQuizAttempts
} from '../../services/storageService';
import { ArrowRightIcon, PencilIcon, TrashIcon, CreditCardIcon, HardDriveIcon, ChartBarIcon, VideoCameraIcon, CheckCircleIcon, XCircleIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';
import Loader from '../common/Loader';

const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    const trimmed = phone.trim().replace(/\s/g, '').replace('+20', '');
    if (trimmed.startsWith('0') && trimmed.length === 11) return trimmed;
    if (trimmed.length === 10 && !trimmed.startsWith('0')) return '0' + trimmed;
    return trimmed; // Return as is if format is unusual, validation will handle it
};

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
            const dateValue = (subscription as any).end_date || subscription.endDate;
            setEndDate(dateValue ? new Date(dateValue).toISOString().split('T')[0] : '');
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

const InfoRow: React.FC<{ label: string; value?: string | null; iconClass: string; }> = ({ label, value, iconClass }) => (
    <div className="flex justify-between items-center py-3 border-b border-[var(--border-primary)] last:border-b-0">
        <div className="flex items-center gap-3">
            <i className={`${iconClass} w-5 h-5 text-[var(--text-secondary)] text-center`}></i>
            <span className="font-semibold text-[var(--text-secondary)]">{label}</span>
        </div>
        <span className="font-medium text-[var(--text-primary)] text-left" dir="ltr">{value || 'غير محدد'}</span>
    </div>
);


interface StudentDetailViewProps {
  user: User;
  onBack: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ user, onBack }) => {
  const { addToast } = useToast();
  const [dataVersion, setDataVersion] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [localUser, setLocalUser] = useState(user);

  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [progress, setProgress] = useState<{ lesson_id: string }[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => { setLocalUser(user); }, [user]);
  const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
  
  const lessonMap = useMemo(() => {
    const map = new Map<string, { lessonTitle: string; unitTitle: string; }>();
    if (allGrades) {
        allGrades.forEach(grade => {
            (grade.semesters || []).forEach(semester => {
                (semester.units || []).forEach(unit => {
                    (unit.lessons || []).forEach(lesson => {
                        map.set(lesson.id, { lessonTitle: lesson.title, unitTitle: unit.title });
                    });
                });
            });
        });
    }
    return map;
  }, [allGrades]);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoadingDetails(true);
        const [subData, gradesData, progressData, attemptsData] = await Promise.all([
            getSubscriptionByUserId(localUser.id),
            getAllGrades(),
            getStudentProgress(localUser.id),
            getStudentQuizAttempts(localUser.id)
        ]);
        setSubscription(subData);
        setAllGrades(gradesData);
        setProgress(progressData);
        setAttempts(attemptsData);
        setIsLoadingDetails(false);
    };
    fetchData();
  }, [localUser.id, dataVersion]);
  
  const gradeId = (localUser as any).grade_id;

  const gradeName = useMemo(() => {
    if (gradeId === null || gradeId === undefined) return 'غير محدد';
    const gradeInfo = allGrades.find(g => g.id === gradeId);
    return gradeInfo?.name || `صف غير معروف (ID: ${gradeId})`;
  }, [gradeId, allGrades]);

  const handleOpenEditModal = () => {
    setEditFormData({ 
        ...localUser,
        phone: normalizePhoneNumber(localUser.phone),
        guardianPhone: normalizePhoneNumber((localUser as any).guardian_phone),
        grade: (localUser as any).grade_id,
     });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateUser = async () => {
    if (!editFormData.id) return;
    if (!editFormData.name || !editFormData.phone || !editFormData.guardianPhone) {
        addToast("الرجاء ملء جميع الحقول.", ToastType.ERROR); return;
    }

    const gradeIdNum = editFormData.grade ? Number(editFormData.grade) : null;
    
    const result = await updateUser(editFormData.id, {
        name: editFormData.name,
        phone: `+20${normalizePhoneNumber(editFormData.phone)}`,
        guardianPhone: `+20${normalizePhoneNumber(editFormData.guardianPhone)}`,
        grade: gradeIdNum,
    });

    if (result?.error) {
        addToast(`فشل تحديث البيانات: ${result.error.message}`, ToastType.ERROR);
    } else {
        addToast("تم تحديث بيانات الطالب بنجاح", ToastType.SUCCESS);
        const updatedLocalUser = {
            ...localUser,
            name: editFormData.name,
            phone: `+20${normalizePhoneNumber(editFormData.phone!)}`,
            grade_id: gradeIdNum,
            guardian_phone: `+20${normalizePhoneNumber(editFormData.guardianPhone!)}`
        };
        setLocalUser(updatedLocalUser as any);
        setIsEditModalOpen(false);
        refreshData();
    }
  };
  
  const handleDeleteUser = async () => {
      const { error } = await deleteUser(localUser.id);
      if (error) {
          addToast(`فشل حذف الطالب: ${error.message}`, ToastType.ERROR);
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
  
  const handleClearDevices = async () => {
    const { error } = await clearUserDevices(localUser.id);
    if (error) {
        addToast(`فشل مسح الجلسات: ${error.message}`, ToastType.ERROR);
    } else {
        addToast('تم مسح جميع جلسات الطالب بنجاح.', ToastType.SUCCESS);
        refreshData();
    }
  };

  const { subscriptionStatus, subscriptionEndDate } = useMemo(() => {
    const endDateStr = subscription?.endDate;
    if (!endDateStr) return { subscriptionStatus: { text: 'لا يوجد', color: 'text-gray-400' }, subscriptionEndDate: null };

    const endDate = new Date(endDateStr);
    const isDateValid = !isNaN(endDate.getTime());
    if (!isDateValid) return { subscriptionStatus: { text: 'تاريخ غير صالح', color: 'text-yellow-400' }, subscriptionEndDate: 'Invalid Date' };

    const isActive = endDate >= new Date();
    return {
      subscriptionStatus: isActive
        ? { text: 'نشط', color: 'text-green-400' }
        : { text: 'منتهي الصلاحية', color: 'text-red-400' },
      subscriptionEndDate: endDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  }, [subscription]);

  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى قائمة الطلاب</span>
      </button>

      {/* Header Card */}
      <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)] mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 shadow-lg">{localUser.name.charAt(0)}</div>
              <div className="flex-1 text-center sm:text-right">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)]">{localUser.name}</h1>
                  <p className="text-[var(--text-secondary)] mt-1">{gradeName}</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={handleOpenEditModal} className="flex-1 flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"><PencilIcon className="w-4 h-4 ml-2"/> تعديل</button>
                  <button onClick={() => setIsDeleteModalOpen(true)} className="flex-1 flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"><TrashIcon className="w-4 h-4 ml-2"/> حذف</button>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)]">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">البيانات الشخصية</h2>
                  <div className="space-y-1">
                      <InfoRow label="الاسم الكامل" value={localUser.name} iconClass="fa-solid fa-user" />
                      <InfoRow label="الصف الدراسي" value={gradeName} iconClass="fa-solid fa-graduation-cap" />
                      <InfoRow label="البريد الإلكتروني" value={localUser.email} iconClass="fa-solid fa-envelope" />
                      <InfoRow label="رقم الهاتف" value={localUser.phone} iconClass="fa-solid fa-phone" />
                      <InfoRow label="رقم ولي الأمر" value={(localUser as any).guardian_phone} iconClass="fa-solid fa-user-shield" />
                  </div>
              </div>
              <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)]">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">إدارة الاشتراك</h2>
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                          <strong className="text-[var(--text-secondary)]">الحالة:</strong> 
                          <span className={`font-bold text-lg ml-2 ${subscriptionStatus.color}`}>{subscriptionStatus.text}</span>
                      </div>
                      {subscriptionEndDate && (
                          <div className="flex justify-between items-center">
                              <strong className="text-[var(--text-secondary)]">ينتهي في:</strong> 
                              <span className="font-semibold">{subscriptionEndDate}</span>
                          </div>
                      )}
                      <button onClick={() => setIsSubModalOpen(true)} className="w-full text-center text-sm p-2 rounded-md bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 transition-colors flex items-center justify-center space-x-2 space-x-reverse mt-2">
                          <CreditCardIcon className="w-5 h-5"/>
                          <span>تعديل الاشتراك</span>
                      </button>
                  </div>
              </div>

              <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)]">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">إدارة الجلسات</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">إذا أبلغ الطالب عن عدم قدرته على تسجيل الدخول، استخدم هذا الزر لمسح جميع جلساته النشطة.</p>
                  <button onClick={handleClearDevices} className="w-full mt-2 text-center text-sm p-2 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/40 transition-colors">مسح جميع الجلسات</button>
              </div>
          </div>
          
          <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
                    <ChartBarIcon className="w-6 h-6 text-purple-400"/>
                    التقدم الأكاديمي
                </h2>
                {isLoadingDetails ? <div className="flex justify-center items-center h-64"><Loader/></div> : (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><VideoCameraIcon className="w-5 h-5"/> الحصص المشاهدة ({progress.length})</h3>
                            <div className="max-h-64 overflow-y-auto border border-[var(--border-primary)] rounded-lg">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-[var(--bg-tertiary)]"><tr className="sticky top-0"><th className="px-4 py-2">الدرس</th><th className="px-4 py-2">الوحدة</th></tr></thead>
                                    <tbody>
                                        {progress.map(p => (
                                            <tr key={p.lesson_id} className="border-b border-[var(--border-primary)] last:border-b-0">
                                                <td className="px-4 py-2">{lessonMap.get(p.lesson_id)?.lessonTitle || 'درس غير معروف'}</td>
                                                <td className="px-4 py-2 text-[var(--text-secondary)]">{lessonMap.get(p.lesson_id)?.unitTitle || 'وحدة غير معروفة'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><PencilIcon className="w-5 h-5"/> الواجبات والامتحانات ({attempts.length})</h3>
                            <div className="max-h-64 overflow-y-auto border border-[var(--border-primary)] rounded-lg">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-[var(--bg-tertiary)]"><tr className="sticky top-0"><th className="px-4 py-2">الاختبار</th><th className="px-4 py-2">التاريخ</th><th className="px-4 py-2 text-center">الدرجة</th><th className="px-4 py-2 text-center">الحالة</th></tr></thead>
                                    <tbody>
                                        {attempts.map(att => (
                                            <tr key={att.id} className="border-b border-[var(--border-primary)] last:border-b-0">
                                                <td className="px-4 py-2">{lessonMap.get(att.lessonId)?.lessonTitle || 'اختبار غير معروف'}</td>
                                                <td className="px-4 py-2 text-[var(--text-secondary)]">{new Date(att.submittedAt).toLocaleDateString('ar-EG')}</td>
                                                <td className={`px-4 py-2 text-center font-bold ${att.isPass ? 'text-green-400' : 'text-red-400'}`}>{att.score}%</td>
                                                <td className="px-4 py-2 text-center">{att.isPass ? <CheckCircleIcon className="w-5 h-5 text-green-400 inline"/> : <XCircleIcon className="w-5 h-5 text-red-400 inline"/>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
      </div>


       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيانات الطالب">
            <div className="space-y-4">
                <input type="text" placeholder="الاسم" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <input type="text" placeholder="رقم الهاتف" name="phone" value={editFormData.phone || ''} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <input type="text" placeholder="رقم ولي الأمر" name="guardianPhone" value={editFormData.guardianPhone || ''} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <select name="grade" value={String(editFormData.grade || '')} onChange={handleEditFormChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]">
                    <option value="">-- غير محدد --</option>
                    {getGradesForSelection().map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
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