import React, { useRef, useState, useEffect } from 'react';
import { Course, Book, User, StudentView } from '../../types';
import { getFeaturedCourses, getFeaturedBooks } from '../../services/storageService';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, VideoCameraIcon, QuestionMarkCircleIcon, ChartBarIcon, CreditCardIcon, ArrowLeftIcon, UserCircleIcon } from '../common/Icons';

// Carousel component for horizontal scrolling content
const Carousel: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section>
            <header className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <button onClick={() => scroll('left')} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => scroll('right')} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
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

// Redesigned Course Card
const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <div className="flex-shrink-0 w-72 bg-[var(--bg-secondary)] rounded-2xl shadow-md border border-[var(--border-primary)] overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent-primary)]">
        <div className="h-40 overflow-hidden">
             <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async"/>
        </div>
        <div className="p-4">
            <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{course.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 truncate">{course.subtitle}</p>
            <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-primary)] pt-3">
                <div className="flex items-center"><VideoCameraIcon className="w-4 h-4 ml-1 text-[var(--accent-primary)]"/><span>{course.videoCount} فيديو</span></div>
                <div className="flex items-center"><DocumentTextIcon className="w-4 h-4 ml-1 text-[var(--accent-primary)]"/><span>{course.fileCount} ملف</span></div>
                <div className="flex items-center"><QuestionMarkCircleIcon className="w-4 h-4 ml-1 text-[var(--accent-primary)]"/><span>{course.quizCount} اختبار</span></div>
            </div>
        </div>
    </div>
);

// Redesigned Book Card
const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <div className="flex-shrink-0 w-52 p-4 bg-[var(--bg-secondary)] rounded-2xl shadow-md border border-[var(--border-primary)] group transition-transform duration-300 hover:-translate-y-1">
        <div className="relative">
             <img src={book.coverImage} alt={book.title} className="w-full h-60 object-contain rounded-md mb-3 transition-transform duration-500 group-hover:scale-105" style={{filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'}} loading="lazy" decoding="async"/>
        </div>
        <h3 className="font-bold text-md text-[var(--text-primary)] truncate mt-2">{book.title}</h3>
        <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--text-secondary)]">{book.teacherName}</span>
            <span className="font-bold text-md text-[var(--accent-primary)]">{book.price} ج.م</span>
        </div>
    </div>
);

// New Quick Access Card component
const QuickAccessCard: React.FC<{ title: string, icon: React.FC<{className?: string}>, onClick: () => void, delay: number }> = ({ title, icon: Icon, onClick, delay }) => (
    <button onClick={onClick} className="p-4 bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] flex flex-col items-center justify-center text-center group transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-lg hover:border-[var(--accent-primary)] hover:bg-gray-700/50 fade-in" style={{animationDelay: `${delay}ms`}}>
        <div className="p-4 mb-3 rounded-full bg-[var(--bg-tertiary)] group-hover:bg-[var(--accent-primary)]/20 transition-colors duration-300">
             <Icon className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300"/>
        </div>
        <span className="font-bold text-[var(--text-primary)]">{title}</span>
    </button>
)

// Main Component
interface StudentHomeScreenProps {
    user: User;
    onNavigate: (view: StudentView) => void;
}

const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ user, onNavigate }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        setCourses(getFeaturedCourses());
        setBooks(getFeaturedBooks());
    }, []);
    
    return (
        <div className="space-y-12">
            {/* Welcome Banner */}
            <section className="relative p-8 rounded-2xl shadow-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden fade-in">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full filter blur-3xl"></div>
                 <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">أهلاً بعودتك، {user.name}!</h1>
                    <p className="text-[var(--text-secondary)] mb-6">جاهز لمواصلة رحلتك نحو التفوق؟</p>
                    <button onClick={() => onNavigate('grades')} className="px-6 py-3 font-bold text-white bg-blue-600 rounded-lg 
                               hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                               transition-all duration-300 transform hover:scale-105 shadow-md flex items-center">
                        اذهب إلى صفك الدراسي
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    </button>
                </div>
            </section>

            {/* Quick Access */}
            <section>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <QuickAccessCard title="الواجبات والنتائج" icon={ChartBarIcon} onClick={() => onNavigate('results')} delay={100} />
                     <QuickAccessCard title="اسأل البروف" icon={QuestionMarkCircleIcon} onClick={() => onNavigate('ask')} delay={200} />
                     <QuickAccessCard title="الاشتراك" icon={CreditCardIcon} onClick={() => onNavigate('subscription')} delay={300} />
                     <QuickAccessCard title="الإعدادات" icon={UserCircleIcon} onClick={() => onNavigate('profile')} delay={400} />
                 </div>
            </section>

            {/* Carousels */}
            {courses.length > 0 && (
                <Carousel title="أحدث الكورسات">
                    {courses.map(course => <CourseCard key={course.id} course={course} />)}
                </Carousel>
            )}

            {books.length > 0 && (
                 <Carousel title="كتب البروف وملازمه">
                    {books.map(book => <BookCard key={book.id} book={book} />)}
                </Carousel>
            )}
        </div>
    );
};

export default StudentHomeScreen;