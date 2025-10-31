import React, { useState, useEffect, useMemo } from 'react';
import { Teacher, User, Unit, Grade, ToastType } from '../../types';
import { getUserByTeacherId, getAllGrades } from '../../services/storageService';
import { ArrowRightIcon, PhoneIcon, ClipboardIcon, BookOpenIcon, VideoCameraIcon } from '../common/Icons';
import Loader from '../common/Loader';
import { useToast } from '../../useToast';

interface TeacherProfileViewProps {
  teacher: Teacher;
  user: User; // The logged-in student user
  onBack: () => void;
  onNavigateToCourse: (unit: Unit) => void;
}

const InfoCard: React.FC<{ icon: React.FC<any>, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-md border border-[var(--border-primary)]">
        <h3 className="text-md font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Icon className="w-5 h-5 text-[var(--accent-primary)]"/>
            {title}
        </h3>
        {children}
    </div>
);

const CourseCard: React.FC<{ unit: Unit; onClick: () => void }> = ({ unit, onClick }) => (
    <button onClick={onClick} className="w-full text-right p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors group">
        <h4 className="font-bold text-lg text-[var(--text-primary)]">{unit.title}</h4>
        <div className="flex items-center justify-between mt-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><VideoCameraIcon className="w-4 h-4"/> {unit.lessons.length} درس</span>
            </div>
            <span className="font-semibold text-[var(--accent-primary)] group-hover:underline">ابدأ الدراسة &rarr;</span>
        </div>
    </button>
);

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ teacher, user, onBack, onNavigateToCourse }) => {
  const [teacherUserData, setTeacherUserData] = useState<User | null>(null);
  const [teacherUnits, setTeacherUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  
  const teacherGradeNames = useMemo(() => {
    if (!teacher.teachingGrades || allGrades.length === 0) return [];
    return teacher.teachingGrades.map(id => allGrades.find(g => g.id === id)?.name).filter(Boolean) as string[];
  }, [teacher.teachingGrades, allGrades]);
  
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [teacherUser, gradesData] = await Promise.all([
            getUserByTeacherId(teacher.id),
            getAllGrades()
        ]);
        
        setTeacherUserData(teacherUser);
        setAllGrades(gradesData);
        
        const studentGradeData = gradesData.find(g => g.id === user.grade);

        const unitsForTeacher = (studentGradeData ? studentGradeData.semesters : [])
            .flatMap(s => s.units)
            .filter(u => u.teacherId === teacher.id)
            .filter(unit => {
                if (!unit.track || unit.track === 'All') return true;
                if (user.track === 'Scientific' && (unit.track === 'Scientific' || unit.track === 'Science' || unit.track === 'Math')) return true;
                return unit.track === user.track;
            });
        
        setTeacherUnits(unitsForTeacher);
        setIsLoading(false);
    };
    fetchData();
  }, [teacher.id, user.grade, user.track]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('تم نسخ الرقم بنجاح!', ToastType.SUCCESS);
    }).catch(() => {
      addToast('فشل نسخ الرقم.', ToastType.ERROR);
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader /></div>;
  }
  
  return (
    <div>
        <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowRightIcon className="w-4 h-4" />
            <span>العودة إلى قائمة المدرسين</span>
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] text-center">
                    <img src={teacher.imageUrl || 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png'} alt={teacher.name} className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-[var(--bg-tertiary)]"/>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{teacher.name}</h1>
                    <p className="text-md text-[var(--text-secondary)]">{teacher.subject}</p>
                 </div>

                 {teacherUserData?.phone && (
                    <InfoCard icon={PhoneIcon} title="معلومات التواصل">
                        <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded-lg">
                            <span className="font-mono text-lg tracking-wider">{teacherUserData.phone}</span>
                            <button onClick={() => copyToClipboard(teacherUserData.phone)} className="p-2 text-[var(--text-secondary)] hover:text-white rounded-md hover:bg-[var(--border-primary)]">
                                <ClipboardIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </InfoCard>
                 )}

                 <InfoCard icon={BookOpenIcon} title="الصفوف الدراسية">
                    <div className="flex flex-wrap gap-2">
                        {teacherGradeNames.length > 0 ? teacherGradeNames.map(name => (
                            <span key={name} className="px-3 py-1 text-sm font-semibold bg-[var(--bg-tertiary)] rounded-full">{name}</span>
                        )) : (
                            <p className="text-sm text-[var(--text-secondary)]">لم تحدد بعد.</p>
                        )}
                    </div>
                </InfoCard>
            </div>

            <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">المواد المتاحة</h2>
                 <div className="space-y-3">
                    {teacherUnits.length > 0 ? teacherUnits.map(unit => (
                        <CourseCard key={unit.id} unit={unit} onClick={() => onNavigateToCourse(unit)} />
                    )) : (
                        <p className="text-center py-8 text-[var(--text-secondary)]">لا توجد مواد متاحة من هذا المدرس لصفك الدراسي حاليًا.</p>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default TeacherProfileView;