import React, { useState, useMemo, useEffect } from 'react';
import { Course, Teacher, ToastType, StudentView } from '../../types';
import { getPublishedCourses, getAllTeachers } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import { CreditCardIcon, UserCircleIcon } from '../common/Icons';

interface CoursesStoreProps {
    onNavigate: (view: StudentView, data: { course: Course }) => void;
}

const CourseStoreCard: React.FC<{ course: Course; teacher?: Teacher; onView: (course: Course) => void; }> = ({ course, teacher, onView }) => {
    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] overflow-hidden flex flex-col group">
            <div className="h-48 overflow-hidden">
                <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-extrabold text-xl text-[var(--text-primary)] mb-2">{course.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow">{course.description}</p>
                <div className="flex items-center space-x-2 space-x-reverse mb-5">
                    {teacher?.imageUrl ? (
                        <img src={teacher.imageUrl} alt={teacher.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                    )}
                    <span className="text-sm font-semibold">{teacher?.name || '...'}</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-[var(--border-primary)]">
                    <p className="text-3xl font-black text-[var(--text-accent)]">
                        {course.isFree ? 'مجاني' : `${course.price} ج.م`}
                    </p>
                    <button
                        onClick={() => onView(course)}
                        className="flex items-center space-x-2 space-x-reverse px-5 py-2.5 font-bold text-white bg-blue-600 rounded-lg 
                                   hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                                   transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                        <span>عرض التفاصيل</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const CoursesStore: React.FC<CoursesStoreProps> = ({ onNavigate }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Map<string, Teacher>>(new Map());
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [courseData, teacherData] = await Promise.all([
                    getPublishedCourses(),
                    getAllTeachers()
                ]);
                setCourses(courseData);
                setTeachers(new Map(teacherData.map(t => [t.id, t])));
            } catch (error) {
                console.error("Error fetching courses or teachers for store:", error);
                addToast('فشل تحميل الكورسات. يرجى المحاولة مرة أخرى.', ToastType.ERROR);
            }
        };
        fetchData();
    }, [addToast]);

    const handleViewCourse = (course: Course) => {
        onNavigate('courseDetail', { course });
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
                            onView={handleViewCourse}
                        />
                    </div>
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لا توجد كورسات متاحة للبيع حاليًا. يرجى المراجعة لاحقًا.</p>
                </div>
            )}
        </div>
    );
};

export default CoursesStore;