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

  const allGrades = useMemo(() => getAllGrades(), []);
  
  const teacherGradeNames = useMemo(() => {
    if (!teacher.teachingGrades) return [];
    return teacher.teachingGrades.map(id => allGrades.find(g => g.id === id)?.name).filter(Boolean) as string[];
  }, [teacher.teachingGrades, allGrades]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const profilePromise = getUserByTeacherId(teacher.id);
      
      const studentGrade = allGrades.find(g => g.id === user.grade);
      let units: Unit[] = [];
      if (studentGrade) {
        units = studentGrade.semesters
          .flatMap(s => s.units)
          .filter(u => u.teacherId === teacher.id);
      }
      setTeacherUnits(units);
      
      const profile = await profilePromise;
      setTeacherUserData(profile);
      
      setIsLoading(false);
    };
    fetchData();
  }, [teacher.id, user.grade, allGrades]);

  const handleCopyPhone = () => {
    if (teacherUserData?.phone) {
      navigator.clipboard.writeText(teacherUserData.phone);
      addToast('تم نسخ رقم الهاتف بنجاح!', ToastType.SUCCESS);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowRightIcon className="w-4 h-4" />
            <span>العودة</span>
        </button>

        {isLoading ? (
            <div className="flex justify-center items-center p-20"><Loader /></div>
        ) : (
            <div className="space-y-8">
                <header className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)] flex flex-col md:flex-row items-center gap-6">
                    <img src={teacher.imageUrl} alt={teacher.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[var(--border-primary)] shadow-md" />
                    <div className="text-center md:text-right">
                        <h1 className="text-4xl font-black text-[var(--text-primary)]">{teacher.name}</h1>
                        <p className="text-lg text-[var(--text-secondary)] mt-1">{teacher.subject}</p>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <InfoCard icon={PhoneIcon} title="معلومات التواصل">
                            {teacherUserData?.phone ? (
                                <div className="flex items-center justify-between bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                    <span className="font-bold text-lg tracking-wider text-[var(--text-primary)]" dir="ltr">{teacherUserData.phone}</span>
                                    <button onClick={handleCopyPhone} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-primary)] rounded-full">
                                        <ClipboardIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">رقم الهاتف غير متوفر.</p>
                            )}
                        </InfoCard>

                         <InfoCard icon={BookOpenIcon} title="المواد التي يدرسها">
                            {teacherGradeNames.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {teacherGradeNames.map(name => (
                                        <span key={name} className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{name}</span>
                                    ))}
                                </div>
                            ) : (
                                 <p className="text-sm text-[var(--text-secondary)]">لم يتم تحديد مواد.</p>
                            )}
                        </InfoCard>
                    </div>
                    <div className="md:col-span-2">
                         <InfoCard icon={VideoCameraIcon} title="الدورات والمناهج المتاحة لك">
                             {teacherUnits.length > 0 ? (
                                <div className="space-y-3">
                                    {teacherUnits.map(unit => (
                                        <CourseCard key={unit.id} unit={unit} onClick={() => onNavigateToCourse(unit)} />
                                    ))}
                                </div>
                             ) : (
                                <p className="text-center text-sm text-[var(--text-secondary)] py-8">
                                    لا توجد دورات متاحة من هذا المدرس لصفك الدراسي حاليًا.
                                </p>
                             )}
                        </InfoCard>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TeacherProfileView;
