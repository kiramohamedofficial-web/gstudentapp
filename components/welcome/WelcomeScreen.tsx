import React, { useMemo, useState, useEffect } from 'react';
import { getAllGrades, getPlatformSettings } from '../../services/storageService';
import { Grade, PlatformSettings } from '../../types';
import { AtomIcon, ArrowLeftIcon, PhoneIcon, YoutubeIcon, FacebookIcon, VideoCameraSolidIcon, BookBookmarkIcon, ClockSolidIcon, UsersSolidIcon, BookOpenIcon } from '../common/Icons';

interface WelcomeScreenProps {
    onNavigateToLogin: () => void;
    onNavigateToRegister: () => void;
}

// Sub-component for the background
const CosmicFlowBackground: React.FC = () => (
    <div className="fixed top-0 left-0 right-0 bottom-0 cosmic-flow-background z-[-1]">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="shooting-star"></div>
        <div id="shooting-star2"></div>
    </div>
);

// Sub-component for the Header
const Header: React.FC<{ onNavigateToLogin: () => void; onNavigateToRegister: () => void; platformName: string; }> = ({ onNavigateToLogin, onNavigateToRegister, platformName }) => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/75 backdrop-blur-lg border-b border-[var(--border-primary)]/50 shadow-md shadow-black/10 transition-colors duration-300">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 space-x-reverse">
                <AtomIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                <span className="text-xl font-bold">{platformName}</span>
            </div>
            <div className="flex items-center gap-3">
                 <button
                    onClick={onNavigateToRegister}
                    className="px-6 py-2.5 text-sm font-semibold bg-transparent border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-[var(--accent-primary)]/10"
                >
                    إنشاء حساب
                </button>
                <button
                    onClick={onNavigateToLogin}
                    className="px-6 py-2.5 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:brightness-110 shadow-md hover:shadow-lg shadow-sky-500/20"
                >
                    تسجيل الدخول
                </button>
            </div>
        </div>
    </header>
);

// Sub-component for the Hero Section
const HeroSection: React.FC<{ onNavigateToRegister: () => void; settings: PlatformSettings; }> = ({ onNavigateToRegister, settings }) => (
    <section className="hero-section relative container mx-auto px-6 pt-24 pb-16 md:py-28 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-right z-10">
                <h1 className="text-4xl md:text-6xl font-black leading-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-yellow-300 mb-4 fade-in">
                    {settings.heroTitle}
                </h1>
                <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 fade-in fade-in-delay-1">
                    {settings.heroSubtitle}
                </p>
                <button
                    onClick={onNavigateToRegister}
                    className="px-8 py-4 font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg 
                               hover:from-sky-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-sky-500/50
                               transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/40 pulse-btn fade-in fade-in-delay-2"
                >
                    {settings.heroButtonText}
                </button>
            </div>
            <div className="relative h-72 md:h-96 flex items-center justify-center fade-in fade-in-delay-2">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-yellow-400/20 rounded-full blur-3xl"></div>
                 <div className="hero-icon-container relative w-56 h-56 md:w-72 md:h-72 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden animate-float">
                    <img src={settings.heroImageUrl} alt={settings.platformName} className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
    </section>
);

// Sub-component for a single Feature Card
const FeatureCard: React.FC<{ icon: React.ElementType, title: string, description: string, delay: number }> = ({ icon: Icon, title, description, delay }) => (
    <div
        className="relative rounded-2xl p-6 transition-all duration-300 fade-in overflow-hidden feature-card-v2"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="relative z-10 flex flex-col h-full items-center text-center">
            <div className="mb-5 p-5 rounded-2xl w-full icon-container">
                <Icon className="w-10 h-10 text-[var(--accent-primary)] mx-auto icon-svg" />
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
            </div>
        </div>
    </div>
);

// Sub-component for the Features Section
const FeaturesSection: React.FC<{ settings: PlatformSettings }> = ({ settings }) => {
    const featureIcons = [VideoCameraSolidIcon, BookBookmarkIcon, ClockSolidIcon, UsersSolidIcon];
    return (
        <section id="features" className="py-20 bg-[var(--bg-primary)]">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-yellow-400">{settings.featuresTitle}</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto">{settings.featuresSubtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {settings.features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} icon={featureIcons[index % featureIcons.length]} delay={index * 100} />
                    ))}
                </div>
            </div>
        </section>
    );
};

// Sub-component for a single Grade Card (New 3D Tilt Design)
const GradeCard: React.FC<{ grade: Grade; colorClass: string; delay: number; onClick: () => void; }> = ({ grade, colorClass, delay, onClick }) => {
    const { subjectsCount } = useMemo(() => {
        const subjectsCount = grade.semesters.flatMap(s => s.units).length;
        return { subjectsCount };
    }, [grade]);

    return (
        <div
            onClick={onClick}
            className={`relative rounded-2xl shadow-lg overflow-hidden transition-all duration-300 fade-in group cursor-pointer perspective-1000`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} transition-transform duration-500 tilt-target`}></div>
            <div className="absolute inset-0 bg-black/20 plus-pattern opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
            
            <div className="absolute bottom-0 left-0 right-0 h-24 text-white/20 pointer-events-none z-10">
                <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="w-full h-full fill-current transform scale-x-[-1]">
                    <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,96L1380,96C1320,96,1200,96,1080,96C960,96,840,96,720,96C600,96,480,96,360,96C240,96,120,96,60,96L0,96Z"></path>
                </svg>
            </div>
            
            <div className="relative p-6 flex flex-col h-56 text-white z-20 transform-style-3d tilt-target">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">{grade.levelAr}</span>
                    <AtomIcon className="w-10 h-10 text-white/30 transform transition-transform duration-500 group-hover:rotate-90" />
                </div>
                <div className="mt-auto">
                    <h3 className="text-3xl font-extrabold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{grade.name}</h3>
                    <div className="flex items-center space-x-4 space-x-reverse text-white/90 border-t border-white/20 pt-3 mt-3">
                        <div className="flex items-center space-x-2 space-x-reverse text-sm">
                            <BookOpenIcon className="w-5 h-5" />
                            <span>{subjectsCount} وحدة دراسية</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-20">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <ArrowLeftIcon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

// Sub-component for the Grades Section
const GradesSection: React.FC<{ grades: Grade[], onNavigateToLogin: () => void }> = ({ grades, onNavigateToLogin }) => {
    const middleSchoolGrades = grades.filter(g => g.level === 'Middle').sort((a, b) => a.id - b.id);
    const secondarySchoolGrades = grades.filter(g => g.level === 'Secondary').sort((a, b) => a.id - b.id);
    
    const secondaryColors = ['from-indigo-500 to-violet-600', 'from-sky-500 to-cyan-600', 'from-amber-400 to-orange-500'];
    const middleColors = ['from-cyan-400 to-sky-500', 'from-teal-400 to-emerald-500', 'from-yellow-400 to-amber-500'];

    return (
        <section id="grades" className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">السنوات الدراسية المتاحة</h2>
                    <p className="text-lg text-[var(--text-secondary)] mt-2">استعرض المناهج المتاحة لكل صف دراسي</p>
                </div>

                <h3 className="text-2xl font-bold mb-6 pr-4 border-r-4 border-yellow-400">المرحلة الثانوية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {secondarySchoolGrades.map((grade, index) => (
                        <GradeCard key={grade.id} grade={grade} colorClass={secondaryColors[index % secondaryColors.length]} delay={index * 100} onClick={onNavigateToLogin} />
                    ))}
                </div>

                <h3 className="text-2xl font-bold mb-6 pr-4 border-r-4 border-sky-400">المرحلة الإعدادية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {middleSchoolGrades.map((grade, index) => (
                        <GradeCard key={grade.id} grade={grade} colorClass={middleColors[index % middleColors.length]} delay={index * 100} onClick={onNavigateToLogin} />
                    ))}
                </div>
            </div>
        </section>
    );
};

// Sub-component for the Animated Waves separator
const AnimatedWaves: React.FC = () => (
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

// Sub-component for the Footer
const Footer: React.FC<{ settings: PlatformSettings }> = ({ settings }) => (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
        <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold mb-4">{settings.platformName}</h3>
                    <p className="text-[var(--text-secondary)] max-w-md">{settings.footerDescription}</p>
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
                        <li><a href={`tel:${settings.contactPhone}`} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><PhoneIcon className="w-4 h-4 ml-2"/> {settings.contactPhone}</a></li>
                        <li><a href={settings.contactFacebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><FacebookIcon className="w-4 h-4 ml-2"/> صفحتنا على فيسبوك</a></li>
                        <li><a href={settings.contactYoutubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><YoutubeIcon className="w-4 h-4 ml-2"/> قناتنا على يوتيوب</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
            <div className="container mx-auto px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                &copy; {new Date().getFullYear()} {settings.platformName}. جميع الحقوق محفوظة.
            </div>
        </div>
    </footer>
);


// The main WelcomeScreen component, now composed of smaller parts
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const grades = useMemo(() => getAllGrades(), []);
    
    useEffect(() => {
        setSettings(getPlatformSettings());
    }, []);
    
    if (!settings) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">جاري التحميل...</div>;
    }

    return (
        <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-cairo relative">
            <CosmicFlowBackground />
            <Header onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} platformName={settings.platformName} />

            <main className="pt-16">
                <HeroSection onNavigateToRegister={onNavigateToRegister} settings={settings} />
                <FeaturesSection settings={settings} />
                <GradesSection grades={grades} onNavigateToLogin={onNavigateToLogin} />
            </main>
            
            <AnimatedWaves />
            <Footer settings={settings} />
        </div>
    );
};

export default WelcomeScreen;