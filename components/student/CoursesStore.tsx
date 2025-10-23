import React, { useState, useMemo } from 'react';
import { Course, Teacher, ToastType } from '../../types';
import { getFeaturedCourses, getTeachers } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import { CreditCardIcon, UserCircleIcon } from '../common/Icons';

interface PurchaseModalProps {
    course: Course | null;
    teacherName: string;
    isOpen: boolean;
    onClose: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ course, teacherName, isOpen, onClose }) => {
    const { addToast } = useToast();
    const handleConfirmPurchase = () => {
        // In a real app, this would redirect to a payment gateway
        // or trigger a payment process. Here, we just show a message.
        addToast(`تم إرسال طلب شراء "${course?.title}". سيتم التواصل معك للتأكيد.`, ToastType.SUCCESS);
        onClose();
    };

    if (!course) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تأكيد شراء الدورة">
            <div className="space-y-4">
                <p className="text-lg">أنت على وشك شراء دورة:</p>
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{course.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">مع الأستاذ / {teacherName}</p>
                    <p className="mt-3 text-2xl font-extrabold text-[var(--text-accent)]">{course.price} ج.م</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">تعليمات الدفع:</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        لإتمام عملية الشراء، يرجى تحويل المبلغ المطلوب عبر فودافون كاش على الرقم <span className="font-bold text-[var(--text-primary)] dir-ltr d-inline-block">01012345678</span> ثم إرسال صورة من التحويل عبر واتساب.
                    </p>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-5 py-2 font-medium bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-primary)] ml-3">
                        إلغاء
                    </button>
                    <button onClick={handleConfirmPurchase} className="px-5 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        تأكيد الشراء
                    </button>
                </div>
            </div>
        </Modal>
    );
};


const CourseStoreCard: React.FC<{ course: Course; teacher?: Teacher; onPurchase: (course: Course) => void; }> = ({ course, teacher, onPurchase }) => {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] overflow-hidden flex flex-col group">
            <div className="h-48 overflow-hidden">
                <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-extrabold text-xl text-[var(--text-primary)] mb-2">{course.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow">{course.subtitle}</p>
                <div className="flex items-center space-x-2 space-x-reverse mb-5">
                    {teacher?.imageUrl ? (
                        <img src={teacher.imageUrl} alt={teacher.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                    )}
                    <span className="text-sm font-semibold">{teacher?.name || '...'}</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-[var(--border-primary)]">
                    <p className="text-3xl font-black text-[var(--text-accent)]">{course.price}<span className="text-base font-normal"> ج.م</span></p>
                    <button
                        onClick={() => onPurchase(course)}
                        className="flex items-center space-x-2 space-x-reverse px-5 py-2.5 font-bold text-white bg-blue-600 rounded-lg 
                                   hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                                   transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                        <CreditCardIcon className="w-5 h-5" />
                        <span>شراء الآن</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const CoursesStore: React.FC = () => {
    const courses = useMemo(() => getFeaturedCourses(), []);
    const teachers = useMemo(() => {
        const teacherData = getTeachers();
        return new Map(teacherData.map(t => [t.id, t]));
    }, []);

    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const handlePurchaseClick = (course: Course) => {
        setSelectedCourse(course);
    };

    return (
        <div>
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-[var(--text-primary)]">متجر الكورسات</h1>
                <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                    استثمر في مستقبلك مع دوراتنا المتخصصة والمصممة بعناية لمساعدتك على التفوق.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                    <div key={course.id} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <CourseStoreCard
                            course={course}
                            teacher={teachers.get(course.teacherId)}
                            onPurchase={handlePurchaseClick}
                        />
                    </div>
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لا توجد كورسات متاحة للبيع حاليًا. يرجى المراجعة لاحقًا.</p>
                </div>
            )}

            <PurchaseModal
                isOpen={!!selectedCourse}
                onClose={() => setSelectedCourse(null)}
                course={selectedCourse}
                teacherName={selectedCourse ? teachers.get(selectedCourse.teacherId)?.name || 'غير معروف' : ''}
            />
        </div>
    );
};

export default CoursesStore;
