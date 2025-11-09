import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Course, Teacher, ToastType } from '../../types';
import { getAllCourses, getAllTeachers, deleteCourse } from '../../services/storageService';
import { useToast } from '../../useToast';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon } from '../common/Icons';
import Loader from '../common/Loader';
import CourseModal from './CourseModal';
import Modal from '../common/Modal';

const CourseCard: React.FC<{ course: Course; teacherName: string; onEdit: () => void; onDelete: () => void; }> = ({ course, teacherName, onEdit, onDelete }) => (
    <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] flex flex-col overflow-hidden group">
        <div className="h-48 overflow-hidden relative">
            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute top-3 right-3 px-3 py-1 text-sm font-bold rounded-full bg-black/50 backdrop-blur-sm text-white">
                {course.isFree ? 'مجاني' : `${course.price} ج.م`}
            </div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <h3 className="font-extrabold text-xl text-[var(--text-primary)] mb-2">{course.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{teacherName}</p>
            <div className="flex justify-end gap-2 mt-auto">
                <button onClick={onEdit} className="p-2 text-[var(--text-secondary)] hover:text-yellow-400 bg-black/10 hover:bg-yellow-500/10 rounded-md transition-colors"><PencilIcon className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-[var(--text-secondary)] hover:text-red-500 bg-black/10 hover:bg-red-500/10 rounded-md transition-colors"><TrashIcon className="w-5 h-5"/></button>
            </div>
        </div>
    </div>
);


const CourseManagementView: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

    const { addToast } = useToast();
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const [courseData, teacherData] = await Promise.all([getAllCourses(), getAllTeachers()]);
        setCourses(courseData);
        setTeachers(teacherData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setEditingCourse(null);
        setIsModalOpen(true);
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingCourse) return;
        const { error } = await deleteCourse(deletingCourse.id);
        if (error) {
            addToast(`فشل حذف الكورس: ${error.message}`, ToastType.ERROR);
        } else {
            addToast('تم حذف الكورس بنجاح.', ToastType.SUCCESS);
            fetchData();
        }
        setDeletingCourse(null);
    };

    return (
        <div className="fade-in">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الكورسات</h1>
                    <p className="text-[var(--text-secondary)] mt-1">إنشاء وتعديل الكورسات المتاحة للطلاب.</p>
                </div>
                <button 
                    onClick={handleAdd} 
                    className="flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5"/> 
                    <span>إضافة كورس جديد</span>
                </button>
            </div>

            {isLoading ? (
                 <div className="flex justify-center items-center py-20"><Loader /></div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <CourseCard 
                            key={course.id} 
                            course={course} 
                            teacherName={teacherMap.get(course.teacherId) || 'غير معروف'}
                            onEdit={() => handleEdit(course)}
                            onDelete={() => setDeletingCourse(course)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                     <BookOpenIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">لا توجد كورسات بعد</h3>
                    <p className="text-[var(--text-secondary)] mt-1">ابدأ بإضافة أول كورس إلى المنصة.</p>
                </div>
            )}

            {isModalOpen && (
                <CourseModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchData();
                    }}
                    course={editingCourse}
                    teachers={teachers}
                />
            )}

            {deletingCourse && (
                <Modal isOpen={!!deletingCourse} onClose={() => setDeletingCourse(null)} title="تأكيد الحذف">
                    <p className="text-[var(--text-secondary)] mb-6">
                        هل أنت متأكد من رغبتك في حذف كورس "{deletingCourse.title}"؟ سيتم حذف جميع الفيديوهات المرتبطة به.
                    </p>
                    <div className="flex justify-end space-x-3 space-x-reverse">
                        <button onClick={() => setDeletingCourse(null)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، قم بالحذف</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CourseManagementView;