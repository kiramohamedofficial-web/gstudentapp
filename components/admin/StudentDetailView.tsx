import React, { useMemo, useState, useCallback } from 'react';
import { User, Grade, Lesson, LessonType, QuizAttempt, ToastType } from '../../types';
import { 
    getGradeById, getSubscriptionByUserId, getQuizAttemptsByUserId, 
    getAllGrades, getUserProgress, updateUser, deleteUser, createOrUpdateSubscription 
} from '../../services/storageService';
import { ArrowRightIcon, CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';


interface GroupedLesson {
    baseTitle: string;
    parts: Partial<Record<LessonType, Lesson>>;
}

interface StudentDetailViewProps {
  user: User;
  onBack: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ user, onBack }) => {
  const { addToast } = useToast();
  const [dataVersion, setDataVersion] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

  const grade = useMemo(() => getGradeById(user.grade), [user.grade, dataVersion]);
  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id, dataVersion]);
  const quizAttempts = useMemo(() => getQuizAttemptsByUserId(user.id), [user.id, dataVersion]);
  const userProgress = useMemo(() => getUserProgress(user.id), [user.id, dataVersion]);
  const allGrades = useMemo(() => getAllGrades(), []);
  
  const lessonMap = useMemo(() => {
    const map = new Map<string, { title: string, gradeName: string }>();
    allGrades.forEach(g => {
        g.semesters.forEach(s => {
            s.units.forEach(u => {
                u.lessons.forEach(l => {
                    map.set(l.id, { title: l.title, gradeName: g.name });
                });
            });
        });
    });
    return map;
  }, [allGrades]);


  const { totalLessons, completedLessons, progress } = useMemo(() => {
    if (!grade) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    const total = allLessons.length;
    const completed = allLessons.filter(l => !!userProgress[l.id]).length;
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { totalLessons: total, completedLessons: completed, progress: prog };
  }, [grade, userProgress]);

  const handleOpenEditModal = () => {
    setEditFormData({ ...user });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (editFormData.id) {
        if (!editFormData.name || !editFormData.phone || !editFormData.guardianPhone) {
            addToast("الرجاء ملء جميع الحقول.", ToastType.ERROR);
            return;
        }
        updateUser(editFormData as User);
        addToast("تم تحديث بيانات الطالب بنجاح", ToastType.SUCCESS);
        setIsEditModalOpen(false);
        refreshData();
    }
  };
  
  const handleDeleteUser = () => {
      deleteUser(user.id);
      addToast(`تم حذف الطالب ${user.name} بنجاح`, ToastType.SUCCESS);
      setIsDeleteModalOpen(false);
      onBack(); // Go back to the list after deletion
  }

  const handleSubscriptionUpdate = (plan: any, status: any, endDate: any) => {
    createOrUpdateSubscription(user.id, plan, status, endDate);
    addToast("تم تحديث اشتراك الطالب", ToastType.SUCCESS);
    refreshData();
  };

  if (!grade) {
    return <div>Could not load student data.</div>;
  }
  
  const groupLessons = (lessons: Lesson[]): GroupedLesson[] => {
    const lessonGroups: Record<string, Partial<Record<LessonType, Lesson>>> = {};

    lessons.forEach(lesson => {
        const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
        if (!lessonGroups[baseTitle]) {
            lessonGroups[baseTitle] = {};
        }
        lessonGroups[baseTitle][lesson.type] = lesson;
    });

    return Object.entries(lessonGroups).map(([baseTitle, parts]) => ({
        baseTitle,
        parts,
    }));
  };

  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى قائمة الطلاب</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile & Progress */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl mb-4">
                {user.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h1>
              <p className="text-[var(--text-secondary)]">{grade.name}</p>
              <div className="mt-4 flex gap-2">
                 <button onClick={handleOpenEditModal} className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center"><PencilIcon className="w-4 h-4 ml-1"/> تعديل</button>
                 <button onClick={() => setIsDeleteModalOpen(true)} className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center"><TrashIcon className="w-4 h-4 ml-1"/> حذف</button>
              </div>
            </div>
          </div>

           <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">إدارة الاشتراك</h2>
                <div className="space-y-3">
                    <p className="text-sm">الحالة الحالية: 
                        <span className={`font-bold ml-2 ${subscription?.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                            {subscription ? (subscription.status === 'Active' ? 'نشط' : 'منتهي الصلاحية') : 'لا يوجد اشتراك'}
                        </span>
                    </p>
                    <button onClick={() => handleSubscriptionUpdate(subscription?.plan || 'Monthly', 'Active', '')} className="w-full text-center text-sm p-2 rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors">تفعيل اشتراك جديد</button>
                    <button onClick={() => handleSubscriptionUpdate(subscription?.plan || 'Monthly', 'Expired', new Date().toISOString())} className="w-full text-center text-sm p-2 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors">إنهاء الاشتراك الحالي</button>
                </div>
            </div>

          <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">تقدم الطالب الإجمالي</h2>
            <div>
                <div className="flex justify-between items-center mb-2 text-sm text-[var(--text-secondary)]">
                    <span>التقدم</span>
                    <span className="font-bold text-[var(--text-primary)]">{progress}%</span>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3">
                    <div 
                        className="bg-purple-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-center mt-3 text-sm text-[var(--text-secondary)]">
                    أكمل الطالب <span className="font-bold text-[var(--text-primary)]">{completedLessons}</span> من أصل <span className="font-bold text-[var(--text-primary)]">{totalLessons}</span> جزء.
                </p>
            </div>
          </div>
          
           {/* Quiz Attempts Section */}
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">سجل الاختبارات والواجبات</h2>
                {quizAttempts.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto pr-2">
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
                                        <td className="py-2">
                                            <p className="font-semibold text-[var(--text-primary)] truncate">{lessonMap.get(attempt.lessonId)?.title || 'درس محذوف'}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{new Date(attempt.submittedAt).toLocaleDateString('ar-EG')}</p>
                                        </td>
                                        <td className={`py-2 text-center font-bold ${attempt.isPass ? 'text-green-600' : 'text-red-600'}`}>
                                            {attempt.score}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-sm text-[var(--text-secondary)] py-4">لم يقم الطالب بأداء أي اختبارات بعد.</p>
                )}
            </div>

        </div>

        {/* Right Column - Course Breakdown */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">تفاصيل المنهج الدراسي</h2>
            <div className="space-y-6">
                {grade.semesters.map(semester => (
                    <div key={semester.id}>
                        <h3 className="text-md font-semibold text-[var(--text-secondary)] border-r-2 border-purple-400 pr-3 mb-3">{semester.title}</h3>
                        <div className="space-y-3">
                            {semester.units.map(unit => {
                                const groupedLessons = groupLessons(unit.lessons);
                                return (
                                <div key={unit.id} className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                    <p className="font-bold text-md text-[var(--text-primary)] mb-2">{unit.title}</p>
                                    <div className="space-y-3 pr-2 border-r border-[var(--border-primary)]">
                                        {groupedLessons.map((group) => (
                                            <div key={group.baseTitle}>
                                                <p className="font-semibold text-sm text-[var(--text-secondary)] mb-1">{group.baseTitle}</p>
                                                <ul className="space-y-1 pr-2">
                                                    {Object.values(group.parts).map((lesson) => lesson && (
                                                        <li key={lesson.id} className="flex items-center justify-between text-sm">
                                                            <span className="text-[var(--text-secondary)]">{lesson.type}</span>
                                                            {userProgress[lesson.id] ? (
                                                                <div className="flex items-center space-x-1 space-x-reverse text-green-600">
                                                                    <CheckCircleIcon className="w-4 h-4" />
                                                                    <span>مكتمل</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center space-x-1 space-x-reverse text-yellow-600">
                                                                    <ClockIcon className="w-4 h-4" />
                                                                    <span>قيد الانتظار</span>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        {groupedLessons.length === 0 && <p className="text-xs text-center text-[var(--text-secondary)] py-2">لا توجد دروس لهذه المادة بعد.</p>}
                                    </div>
                                </div>
                                )}
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيانات الطالب">
            <div className="space-y-4">
                <input type="text" placeholder="الاسم" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <input type="text" placeholder="رقم الهاتف" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <input type="text" placeholder="رقم ولي الأمر" value={editFormData.guardianPhone || ''} onChange={e => setEditFormData({...editFormData, guardianPhone: e.target.value})} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <select value={editFormData.grade || ''} onChange={e => setEditFormData({...editFormData, grade: Number(e.target.value)})} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]">
                    {allGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <input type="password" placeholder="كلمة مرور جديدة (اتركها فارغة لعدم التغيير)" onChange={e => setEditFormData({...editFormData, password: e.target.value})} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]" />
                <div className="flex justify-end pt-4">
                    <button onClick={handleUpdateUser} className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ التغييرات</button>
                </div>
            </div>
       </Modal>
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد حذف الطالب">
            <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد من رغبتك في حذف الطالب <span className="font-bold text-[var(--text-primary)]">{user.name}</span>؟ سيتم حذف جميع بياناته واشتراكاته بشكل دائم.</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                <button onClick={handleDeleteUser} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، قم بالحذف</button>
            </div>
        </Modal>
    </div>
  );
};

export default StudentDetailView;