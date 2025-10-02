
import React, { useRef, useState, useEffect } from 'react';
import { FeaturedTeacher, Course, Book } from '../../types';
import { getFeaturedTeachers, getFeaturedCourses, getFeaturedBooks } from '../../services/storageService';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, VideoCameraIcon, QuestionMarkCircleIcon } from '../common/Icons';

interface CarouselProps {
    title: string;
    children: React.ReactNode;
    browseAllButton?: boolean;
}

const Carousel: React.FC<CarouselProps> = ({ title, children, browseAllButton }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="mb-10">
            <header className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                     {browseAllButton && <button className="hidden sm:block text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">تصفح الكل</button>}
                     <button onClick={() => scroll('left')} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-purple-500/20 text-[var(--text-secondary)] hover:text-purple-400 transition-colors">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => scroll('right')} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-purple-500/20 text-[var(--text-secondary)] hover:text-purple-400 transition-colors">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-5 p-2 scroll-smooth"
                style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
            >
                {children}
            </div>
        </section>
    );
};

const TeacherCard: React.FC<{ teacher: FeaturedTeacher }> = ({ teacher }) => (
    <div className="flex flex-col items-center flex-shrink-0 w-28 text-center">
        <img src={teacher.imageUrl} alt={teacher.name} className="w-24 h-24 rounded-full object-cover border-2 border-purple-400 p-1" />
        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{teacher.name}</p>
        <p className="text-xs text-[var(--text-secondary)]">{teacher.subject}</p>
    </div>
);

const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <div className="flex-shrink-0 w-64 bg-[var(--bg-primary)] rounded-lg shadow-md border border-[var(--border-primary)] overflow-hidden">
        <img src={course.coverImage} alt={course.title} className="w-full h-32 object-cover"/>
        <div className="p-4">
            <h3 className="font-bold text-md text-[var(--text-primary)]">{course.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-3">{course.subtitle}</p>
            <div className="flex justify-around text-center text-xs text-white bg-gradient-to-r from-purple-500/80 to-indigo-500/80 rounded-md p-2">
                <div className="flex flex-col items-center"><DocumentTextIcon className="w-4 h-4 mb-1"/><span>{course.fileCount} ملف</span></div>
                <div className="flex flex-col items-center"><VideoCameraIcon className="w-4 h-4 mb-1"/><span>{course.videoCount} فيديو</span></div>
                <div className="flex flex-col items-center"><QuestionMarkCircleIcon className="w-4 h-4 mb-1"/><span>{course.quizCount} اختبار</span></div>
            </div>
            <button className="mt-3 w-full py-2 text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity">
                تفاصيل الدورة
            </button>
        </div>
    </div>
);

const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <div className="flex-shrink-0 w-64 bg-[var(--bg-primary)] rounded-lg shadow-md border border-[var(--border-primary)] p-3">
        <img src={book.coverImage} alt={book.title} className="w-full h-40 object-contain rounded-md mb-3"/>
        <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{book.title}</h3>
        <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
                <img src={book.teacherImage} alt={book.teacherName} className="w-6 h-6 rounded-full object-cover mr-2"/>
                <span className="text-xs text-[var(--text-secondary)]">{book.teacherName}</span>
            </div>
            <span className="font-bold text-sm text-purple-400">{book.price} ج.م</span>
        </div>
    </div>
);

interface StudentHomeScreenProps {
    onNavigateToGrades: () => void;
}

const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ onNavigateToGrades }) => {
    const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        setTeachers(getFeaturedTeachers());
        setCourses(getFeaturedCourses());
        setBooks(getFeaturedBooks());
    }, []);
    
    return (
        <div className="w-full">
            <Carousel title="نخبة من المدرسين المتخصصين على المنصة">
                {teachers.map(teacher => <TeacherCard key={teacher.id} teacher={teacher} />)}
            </Carousel>
            
            <Carousel title="أحدث الكورسات في المنصة" browseAllButton>
                {courses.map(course => <CourseCard key={course.id} course={course} />)}
            </Carousel>
             <div className="px-2 mb-10">
                <button onClick={onNavigateToGrades} className="w-full sm:hidden py-3 text-sm font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                    تصفح كل الكورسات
                </button>
            </div>


            <Carousel title="الكتب التي يثق بها طلابنا">
                {books.map(book => <BookCard key={book.id} book={book} />)}
            </Carousel>
            
            <section>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 px-2">الاختبارات الشاملة</h2>
                <div className="text-center p-8 bg-[var(--bg-primary)] rounded-lg border border-dashed border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">Exam Not Available Now</p>
                </div>
            </section>
        </div>
    );
};

export default StudentHomeScreen;