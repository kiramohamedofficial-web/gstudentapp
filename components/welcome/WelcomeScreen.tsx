import React, { useMemo } from 'react';
import { getAllGrades } from '../../services/storageService';
import { Grade, LessonType } from '../../types';
import { AtomIcon, ArrowLeftIcon, PhoneIcon, YoutubeIcon, FacebookIcon, VideoCameraSolidIcon, BookBookmarkIcon, ClockSolidIcon, UsersSolidIcon, BookOpenIcon, VideoCameraIcon } from '../common/Icons';

interface WelcomeScreenProps {
    onNavigateToLogin: () => void;
}

// Header Component
const Header: React.FC<{ onNavigateToLogin: () => void }> = ({ onNavigateToLogin }) => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-primary)]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 space-x-reverse">
                <AtomIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <span className="text-xl font-bold">منصة د. أحمد صابر</span>
            </div>
            <button
                onClick={onNavigateToLogin}
                className="px-5 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
                تسجيل الدخول
            </button>
        </div>
    </header>
);

// Hero Section Component
const HeroSection: React.FC<{ onNavigateToLogin: () => void }> = ({ onNavigateToLogin }) => (
    <section className="relative container mx-auto px-6 pt-24 pb-16 md:py-28 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-right z-10">
                <h1 className="text-4xl md:text-6xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400 mb-4 fade-in">
                    رحلتك نحو التفوق في العلوم تبدأ هنا
                </h1>
                <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 fade-in fade-in-delay-1">
                    مع د. أحمد صابر، نقدم لكم منصة تعليمية متكاملة لطلاب المرحلتين الإعدادية والثانوية، تجمع بين الشرح المبسط والتكنولوجيا التفاعلية الحديثة.
                </p>
                <button
                    onClick={onNavigateToLogin}
                    className="px-8 py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-green-500 rounded-lg 
                               hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                               transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/40 pulse-btn fade-in fade-in-delay-2"
                >
                    ابدأ رحلتك الآن
                </button>
            </div>
            <div className="relative h-72 md:h-96 flex items-center justify-center fade-in fade-in-delay-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-400/20 rounded-full blur-3xl"></div>
                <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                    {/* Placeholder for Dr. Ahmed Saber's photo */}
                    <img src="https://via.placeholder.com/288/0D1117/c9d1d9?text=Dr.A.S" alt="Dr. Ahmed Saber" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
    </section>
);

// Feature Card Component
const FeatureCard: React.FC<{ icon: React.ElementType, title: string, description: string, delay: number }> = ({ icon: Icon, title, description, delay }) => (
    <div
        className="relative bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] transition-all duration-300 transform hover:-translate-y-2 hover:border-[var(--accent-primary)] hover:shadow-2xl hover:shadow-blue-500/10 fade-in group text-right overflow-hidden"
        style={{ animationDelay: `${delay}ms` }}>
        
        {/* Decorative curved line - inspired by image */}
        <div className="absolute top-0 left-0 h-full w-24 pointer-events-none transform -translate-x-4">
             <svg width="100%" height="100%" viewBox="0 0 80 240" preserveAspectRatio="none">
                <path 
                    d="M 70 20 C 0 80, 0 160, 70 220" 
                    stroke="rgba(88, 166, 255, 0.15)" 
                    strokeWidth="2" 
                    fill="none" 
                    className="transition-all duration-500 group-hover:stroke-[rgba(88,166,255,0.4)] group-hover:translate-x-2"
                />
            </svg>
        </div>

        <div className="relative z-10 p-6 flex flex-col h-full">
            <div className="mb-4 inline-block p-4 bg-gradient-to-br from-[#102949] to-[#161B22] rounded-xl border border-white/10 shadow-lg">
                <Icon className="w-8 h-8 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
            </div>
        </div>
    </div>
);

// Grade Card Component
const GradeCard: React.FC<{ grade: Grade; colorClass: string; delay: number }> = ({ grade, colorClass, delay }) => {
    const { lessonCount, examCount } = useMemo(() => {
        const lessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
        return {
            lessonCount: lessons.length,
            examCount: lessons.filter(l => l.type === LessonType.EXAM).length
        };
    }, [grade]);

    return (
        <div
            className={`relative rounded-2xl shadow-lg overflow-hidden transition-all transform hover:-translate-y-2 duration-300 fade-in group`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} transition-transform duration-500 group-hover:scale-110`}></div>
            <div className="absolute inset-0 bg-black/20 plus-pattern opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
            
            <div className="absolute bottom-0 left-0 right-0 h-24 text-white/20 pointer-events-none z-10">
                <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="w-full h-full fill-current transform scale-x-[-1]">
                    <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,96L1380,96C1320,96,1200,96,1080,96C960,96,840,96,720,96C600,96,480,96,360,96C240,96,120,96,60,96L0,96Z"></path>
                </svg>
            </div>
            
            <div className="relative p-6 flex flex-col h-56 text-white z-20">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">{grade.levelAr}</span>
                    <AtomIcon className="w-10 h-10 text-white/30 transform transition-transform duration-500 group-hover:rotate-90" />
                </div>
                <div className="mt-auto">
                    <h3 className="text-3xl font-extrabold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{grade.name}</h3>
                    <div className="flex items-center space-x-4 space-x-reverse text-white/90 border-t border-white/20 pt-3 mt-3">
                        <div className="flex items-center space-x-2 space-x-reverse text-sm">
                            <VideoCameraIcon className="w-5 h-5" />
                            <span>{lessonCount} درس</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse text-sm">
                            <BookOpenIcon className="w-5 h-5" />
                            <span>{examCount} امتحان</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0 z-20">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <ArrowLeftIcon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

// Animated Waves Component
const AnimatedWaves = () => (
    <div className="waves-container">
        <svg className="waves-svg" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
                <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="waves-parallax">
                <use xlinkHref="#gentle-wave" x="48" y="0" />
                <use xlinkHref="#gentle-wave" x="48" y="3" />
                <use xlinkHref="#gentle-wave" x="48" y="5" />
                <use xlinkHref="#gentle-wave" x="48" y="7" />
            </g>
        </svg>
    </div>
);


// Footer Component
const Footer = () => (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
        <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold mb-4">منصة د. أحمد صابر</h3>
                    <p className="text-[var(--text-secondary)] max-w-md">منصة تعليمية رائدة تهدف إلى تقديم أفضل المحتويات التعليمية في مادة العلوم لطلاب المرحلتين الإعدادية والثانوية.</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
                    <ul className="space-y-2">
                        <li><a href="#grades" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ArrowLeftIcon className="w-4 h-4 ml-2"/> السنوات الدراسية</a></li>
                        <li><a href="#features" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ArrowLeftIcon className="w-4 h-4 ml-2"/> مميزات المنصة</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
                    <ul className="space-y-2">
                        <li><a href="#" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><PhoneIcon className="w-4 h-4 ml-2"/> +20 123 456 7890</a></li>
                        <li><a href="#" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><FacebookIcon className="w-4 h-4 ml-2"/> صفحتنا على فيسبوك</a></li>
                        <li><a href="#" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><YoutubeIcon className="w-4 h-4 ml-2"/> قناتنا على يوتيوب</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
            <div className="container mx-auto px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                &copy; {new Date().getFullYear()} Dr. Ahmed Saber. جميع الحقوق محفوظة.
            </div>
        </div>
    </footer>
);

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigateToLogin }) => {
    const grades = useMemo(() => getAllGrades(), []);
    const middleSchoolGrades = grades.filter(g => g.level === 'Middle').sort((a, b) => a.id - b.id);
    const secondarySchoolGrades = grades.filter(g => g.level === 'Secondary').sort((a, b) => a.id - b.id);
    
    const features = [
        { icon: VideoCameraSolidIcon, title: "شرح تفصيلي ومبسط", description: "فيديوهات عالية الجودة تشرح كل جزء من المنهج بأسلوب سهل وممتع." },
        { icon: BookBookmarkIcon, title: "واجبات وامتحانات دورية", description: "اختبر فهمك وتابع مستواك من خلال واجبات وامتحانات إلكترونية." },
        { icon: ClockSolidIcon, title: "وفر وقتك ومجهودك", description: "ذاكر من أي مكان وفي أي وقت يناسبك، وراجع الدروس أكثر من مرة." },
        { icon: UsersSolidIcon, title: "متابعة مستمرة وذكية", description: "نظام متكامل لمتابعة تقدمك الدراسي وتحديد نقاط القوة والضعف." },
    ];

    const secondaryColors = ['from-purple-500 to-indigo-600', 'from-rose-500 to-pink-600', 'from-red-500 to-orange-600'];
    const middleColors = ['from-sky-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-cyan-500 to-green-500'];

    return (
        <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-cairo">
            <Header onNavigateToLogin={onNavigateToLogin} />

            <main className="pt-16">
                <HeroSection onNavigateToLogin={onNavigateToLogin} />

                <section id="features" className="py-20 bg-[var(--bg-secondary)]">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">لماذا تختار منصتنا؟</h2>
                        <p className="text-lg text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">نوفر لك كل ما تحتاجه لتحقيق أعلى الدرجات بأبسط الطرق.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <FeatureCard key={index} {...feature} delay={index * 100} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="grades" className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">السنوات الدراسية المتاحة</h2>
                            <p className="text-lg text-[var(--text-secondary)] mt-2">استعرض المناهج المتاحة لكل صف دراسي</p>
                        </div>

                        <h3 className="text-2xl font-bold mb-6 pr-4 border-r-4 border-[var(--accent-secondary)]">المرحلة الثانوية</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                            {secondarySchoolGrades.map((grade, index) => (
                                <GradeCard key={grade.id} grade={grade} colorClass={secondaryColors[index % secondaryColors.length]} delay={index * 100} />
                            ))}
                        </div>

                        <h3 className="text-2xl font-bold mb-6 pr-4 border-r-4 border-[var(--accent-primary)]">المرحلة الإعدادية</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {middleSchoolGrades.map((grade, index) => (
                                <GradeCard key={grade.id} grade={grade} colorClass={middleColors[index % middleColors.length]} delay={index * 100} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            
            <AnimatedWaves />
            <Footer />
        </div>
    );
};

export default WelcomeScreen;