import React, { useRef, useState, useEffect } from 'react';
import { Course, Book, User, StudentView } from '../../types';
import { getFeaturedCourses, getFeaturedBooks } from '../../services/storageService';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, VideoCameraIcon, QuestionMarkCircleIcon, UsersSolidIcon, ArrowLeftIcon } from '../common/Icons';

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

// Redesigned Course Card with Advanced 3D Interactive Effect
const CourseCard: React.FC<{ course: Course; onDetailsClick: () => void }> = ({ course, onDetailsClick }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const rotateX = (y / rect.height - 0.5) * -15;
        const rotateY = (x / rect.width - 0.5) * 15;
        
        const content = card.querySelector('.card-3d-interactive-content') as HTMLElement;
        if(content) {
            content.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        const content = card.querySelector('.card-3d-interactive-content') as HTMLElement;
        if(content) {
            content.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    };

    return (
        <div 
            ref={cardRef}
            className="flex-shrink-0 w-80 h-[420px] card-3d-interactive group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-shine"></div>
            <div className="card-3d-interactive-content">
                <div className="relative bg-[var(--bg-secondary)] rounded-2xl overflow-hidden h-full flex flex-col border border-[var(--border-primary)]">
                    <div className="h-44 overflow-hidden card-image-layer">
                        <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                    </div>
                    <div className="p-4 flex flex-col flex-grow card-content-layer">
                        <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{course.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 truncate">{course.subtitle}</p>
                        <div className="flex-grow"></div>
                        <div className="flex justify-around items-center text-xs text-[var(--text-secondary)] border-y border-[var(--border-primary)] py-3 my-3">
                            <div className="flex items-center flex-col gap-1"><VideoCameraIcon className="w-5 h-5 text-blue-400"/><span>{course.videoCount} فيديو</span></div>
                            <div className="flex items-center flex-col gap-1"><DocumentTextIcon className="w-5 h-5 text-green-400"/><span>{course.fileCount} ملف</span></div>
                            <div className="flex items-center flex-col gap-1"><QuestionMarkCircleIcon className="w-5 h-5 text-yellow-400"/><span>{course.quizCount} اختبار</span></div>
                        </div>
                    </div>
                    {/* Hover reveal button */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--bg-secondary-opaque)] via-[var(--bg-secondary-opaque)] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 card-hover-layer">
                         <button
                            onClick={onDetailsClick}
                            className="w-full py-3 px-4 font-bold text-white bg-[var(--accent-gradient)] rounded-lg 
                                       hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-purple-500/50
                                       transition-all duration-300"
                        >
                            تفاصيل الدورة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Redesigned Book Card with Advanced 3D Interactive Effect
const BookCard: React.FC<{ book: Book }> = ({ book }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const rotateX = (y / rect.height - 0.5) * -15;
        const rotateY = (x / rect.width - 0.5) * 15;
        
        const content = card.querySelector('.card-3d-interactive-content') as HTMLElement;
        if(content) {
            content.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        const content = card.querySelector('.card-3d-interactive-content') as HTMLElement;
        if(content) {
            content.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    };
    
    return (
        <div 
            ref={cardRef}
            className="flex-shrink-0 w-52 h-80 card-3d-interactive group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="card-shine"></div>
             {/* Blurred background image */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <img src={book.teacherImage} alt="" className="w-full h-full object-cover blur-sm scale-110 opacity-30"/>
                <div className="absolute inset-0 bg-black/50"></div>
            </div>
            
            <div className="card-3d-interactive-content h-full">
                <div className="relative h-full flex flex-col justify-center items-center p-4">
                    {/* Floating Book Cover */}
                    <div className="relative card-image-layer transition-transform duration-500 group-hover:scale-110" style={{ filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.4))' }}>
                        <img src={book.coverImage} alt={book.title} className="w-36 h-auto max-h-[220px] object-contain rounded-md" loading="lazy" decoding="async"/>
                    </div>
                    
                    {/* Hover reveal content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 rounded-b-2xl card-content-layer">
                        <h3 className="font-bold text-md text-white truncate">{book.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-white/70">{book.teacherName}</span>
                            <span className="font-bold text-md text-yellow-300">{book.price} ج.م</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


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
        <div className="space-y-10 pb-10">
            {/* Welcome Banner */}
            <section className="relative p-8 rounded-2xl shadow-lg bg-gradient-to-tr from-purple-600/20 via-transparent to-transparent border border-[var(--border-primary)] overflow-hidden fade-in">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-pink-500/10 to-transparent opacity-50 -z-10 animate-spin-slow"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">أهلاً بعودتك، <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 animated-gradient-text">{user.name}</span>!</h1>
                        <p className="text-[var(--text-secondary)] max-w-lg">جاهز لمواصلة رحلتك نحو التفوق؟ استكشف أحدث الكورسات والمحتويات التي أضفناها لك.</p>
                    </div>
                    <button onClick={() => onNavigate('grades')} className="flex-shrink-0 px-6 py-3 font-semibold text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 backdrop-blur-sm transition-colors duration-300">
                        ابدأ المذاكرة الآن
                    </button>
                </div>
            </section>

             {/* Teachers CTA */}
            <section 
                onClick={() => onNavigate('teachers')}
                className="relative p-6 md:p-8 rounded-2xl shadow-lg border border-[var(--border-primary)] bg-gradient-to-r from-purple-500/10 to-pink-500/10 overflow-hidden fade-in group cursor-pointer transition-all duration-300 hover:border-purple-400/50"
            >
                 <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
                    <div className="flex items-center">
                        <div className="p-4 bg-white/5 rounded-full mr-4 border border-white/10 transition-transform duration-300 group-hover:scale-105">
                             <UsersSolidIcon className="w-8 h-8 text-purple-300"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">تعرف على مدرسينا</h2>
                            <p className="text-[var(--text-secondary)]">تصفح قائمة المدرسين الخبراء لدينا.</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-white/5 border border-white/10 rounded-full transition-all duration-300 group-hover:translate-x-[-4px] group-hover:bg-white/10">
                        <span>استعراض المدرسين</span>
                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:scale-110"/>
                    </div>
                </div>
            </section>


            {/* Carousels */}
            {courses.length > 0 && (
                <Carousel title="أحدث الكورسات في المنصة">
                    {courses.map(course => <CourseCard key={course.id} course={course} onDetailsClick={() => onNavigate('grades')}/>)}
                </Carousel>
            )}

            {books.length > 0 && (
                 <Carousel title="كتب وملازم المنصة">
                    {books.map(book => <BookCard key={book.id} book={book} />)}
                </Carousel>
            )}

             <div className="px-2">
                <button
                    onClick={() => onNavigate('grades')}
                    className="w-full mt-4 py-4 px-4 font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg 
                               hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-purple-500/50
                               transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-purple-500/20"
                >
                    تصفح كل الكورسات
                </button>
            </div>
        </div>
    );
};

export default StudentHomeScreen;