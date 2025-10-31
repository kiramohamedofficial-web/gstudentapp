import React, { useState, useEffect, useMemo } from 'react';
import { getAllGrades, getPlatformSettings } from '../../services/storageService';
import { Grade, PlatformSettings } from '../../types';
import { AtomIcon, ArrowLeftIcon, PhoneIcon, YoutubeIcon, FacebookIcon, SparklesIcon, ChartBarIcon, VideoCameraIcon, BrainIcon, BookOpenIcon, ArrowRightIcon, MenuIcon, XIcon } from '../common/Icons';

interface WelcomeScreenProps {
    onNavigateToLogin: () => void;
    onNavigateToRegister: () => void;
}

const MobileNav: React.FC<{ isOpen: boolean; onClose: () => void; onNavigateToLogin: () => void; onNavigateToRegister: () => void; }> = ({ isOpen, onClose, onNavigateToLogin, onNavigateToRegister }) => {
    if (!isOpen) return null;
    const handleNavigate = (action: () => void) => { action(); onClose(); };

    return (
        <div className="md:hidden fixed inset-0 z-[100]" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="fixed inset-0 bg-black/60 animate-fade-in backdrop-blur-sm"></div>
            <div 
                className="fixed top-20 right-4 w-full max-w-xs bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] flex flex-col animate-slide-in-right rounded-2xl overflow-hidden border border-[var(--glass-border)] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 space-y-3">
                    <button onClick={() => handleNavigate(onNavigateToLogin)} className="w-full py-3.5 font-semibold bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors">تسجيل الدخول</button>
                    <button onClick={() => handleNavigate(onNavigateToRegister)} className="w-full py-3.5 font-bold bg-[var(--accent-primary)] text-white rounded-lg transition-transform transform hover:scale-105">إنشاء حساب</button>
                </div>
            </div>
        </div>
    );
};

const Header: React.FC<{ onNavigateToLogin: () => void; onNavigateToRegister: () => void; onOpenNav: () => void; platformName: string; }> = ({ onNavigateToLogin, onNavigateToRegister, onOpenNav, platformName }) => (
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl m-3">
            <div className="flex items-center">
                <img src="https://j.top4top.io/p_3584uziv73.png" alt="Gstudent Logo" className="w-10 h-10" />
            </div>
            <div className="hidden md:flex items-center gap-3">
                 <button onClick={onNavigateToRegister} className="px-6 py-2.5 text-sm font-semibold bg-transparent border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-[rgba(var(--accent-primary-rgb),0.1)]">إنشاء حساب</button>
                <button onClick={onNavigateToLogin} className="px-6 py-2.5 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:brightness-110 shadow-md hover:shadow-lg shadow-[0_10px_20px_-10px_rgba(var(--accent-primary-rgb),0.4)]">تسجيل الدخول</button>
            </div>
            <div className="md:hidden">
                <button onClick={onOpenNav} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><MenuIcon className="w-7 h-7"/></button>
            </div>
        </div>
    </header>
);

const CosmicFlowBackground: React.FC = () => (
    <div className="fixed top-0 left-0 right-0 bottom-0 cosmic-flow-background z-[-1]"></div>
);

const HeroSection: React.FC<{ onNavigateToRegister: () => void; settings: PlatformSettings; }> = ({ onNavigateToRegister, settings }) => {
    const title = settings.heroTitle || '';
    const titleParts = title.split(' ');
    const firstPart = titleParts.length > 1 ? titleParts[0] : title;
    const secondPart = titleParts.length > 1 ? titleParts.slice(1).join(' ') : '';
    
    return (
        <section className="relative container mx-auto px-6 pt-32 pb-16 md:py-40 flex flex-col items-center">
            <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-[rgba(var(--accent-primary-rgb),0.15)] to-transparent blur-3xl -translate-y-1/2 z-[-1]"></div>
            
            <div className="relative z-10 text-center">
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 fade-in">
                    <span className="block text-[var(--text-primary)]">{firstPart}</span>
                    {secondPart && <span className="block gradient-text">{secondPart}</span>}
                </h1>
                <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto fade-in fade-in-delay-1">{settings.heroSubtitle}</p>
                <button onClick={onNavigateToRegister} className="inline-flex items-center justify-center group px-8 py-4 font-bold text-white bg-[var(--accent-primary)] rounded-lg hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[rgba(var(--accent-primary-rgb),0.5)] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[0_15px_30px_-10px_rgba(var(--accent-primary-rgb),0.4)] pulse-btn fade-in fade-in-delay-2">
                    <span>{settings.heroButtonText}</span>
                    <ArrowLeftIcon className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:-translate-x-1" />
                </button>
            </div>
            
            <img 
                src="https://d.top4top.io/p_3584t5zwf3.png" 
                alt="Platform Logo" 
                className="relative z-10 mt-16 w-64 h-64 md:w-80 md:h-80 object-contain animate-float"
            />
        </section>
    );
};


const StatCard: React.FC<{ value: string; label: string; icon: React.FC<{className?: string}>; delay: number }> = ({ value, label, icon: Icon, delay }) => (
    <div className="stat-card p-6 rounded-2xl text-center shadow-lg fade-in flex flex-col items-center justify-center h-full" style={{ animationDelay: `${delay}ms` }}>
        <div className="p-3 mb-3 bg-white/5 rounded-full"><Icon className="w-16 h-16 stat-icon" /></div>
        <p className="text-4xl md:text-5xl font-extrabold stat-number mb-2">{value}</p>
        <p className="text-sm md:text-base text-[var(--text-secondary)]">{label}</p>
    </div>
);

const SatisfactionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://h.top4top.io/p_3583croib0.png" alt="معدل الرضا" className={className} />
);

const SupportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://i.top4top.io/p_35838mn0k1.png" alt="دعم مستمر" className={className} />
);

const RegisteredStudentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://k.top4top.io/p_3583inhay3.png" alt="طالب مسجل" className={className} />
);

const InteractiveLessonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://j.top4top.io/p_3583kuzn32.png" alt="درس تفاعلي" className={className} />
);

const StatsSection: React.FC = () => {
    const statItems = [
        { value: '5000+', label: 'طالب مسجل', icon: RegisteredStudentIcon },
        { value: '200+', label: 'درس تفاعلي', icon: InteractiveLessonIcon },
        { value: '98%', label: 'معدل الرضا', icon: SatisfactionIcon },
        { value: '24/7', label: 'دعم مستمر', icon: SupportIcon }
    ];

    return (
        <section className="py-20">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {statItems.map((item, index) => (
                        <StatCard key={index} value={item.value} label={item.label} icon={item.icon} delay={300 + index * 100} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeatureCard: React.FC<{ icon: React.FC<{ className?: string }>; title: string; description: string; image: string; delay: number; }> = ({ icon: Icon, title, description, image, delay }) => (
    <div className="feature-card rounded-2xl p-6 text-center flex flex-col fade-in" style={{ animationDelay: `${delay}ms` }}>
        <div className="flex-grow">
            <div className="flex justify-center mb-5"><div className="feature-icon-wrapper p-4 rounded-xl shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)]"><Icon className="w-20 h-20 text-[var(--accent-secondary)]" /></div></div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">{title}</h3>
            <p className="text-[var(--text-secondary)] mb-6 min-h-[5rem]">{description}</p>
        </div>
        <div className="rounded-lg shadow-md overflow-hidden mt-auto">
            <img src={image} alt={title} className="feature-image w-full aspect-video object-cover" loading="lazy" />
        </div>
    </div>
);

const StatsFeatureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://f.top4top.io/p_3583e5jv00.png" alt="احصائيات" className={className} />
);

const VideoPlayerFeatureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://h.top4top.io/p_3583a5wke2.png" alt="مشغل فيديو احترافي" className={className} />
);

const AIAssistantIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src="https://g.top4top.io/p_358376lzw1.png" alt="مساعد ذكاء اصطناعي" className={className} />
);

const DetailedFeaturesSection: React.FC<{ settings: PlatformSettings }> = ({ settings }) => {
    const newFeatures = [
        { icon: StatsFeatureIcon, title: "احصائيات", description: "تتبع تقدمك بشكل تفصيلي مع إحصائيات دقيقة عن معدل الإنجاز والاختبارات والواجبات.", image: "https://b.top4top.io/p_35833r31z1.jpg" },
        { icon: VideoPlayerFeatureIcon, title: "مشغل فيديو احترافي", description: "مشاهدة بدون إعلانات مع التحكم الكامل في السرعة والجودة. قوائم تشغيل ذكية تنتقل تلقائياً للدرس التالي.", image: "https://c.top4top.io/p_3583j4bwq2.jpg" },
        { icon: AIAssistantIcon, title: "مساعد ذكاء اصطناعي", description: "اسأل أي سؤال واحصل على شرح فوري ومبسط باستخدام أحدث نماذج الذكاء الاصطناعي من Google.", image: "https://a.top4top.io/p_35834lrzk0.jpg" }
    ];

    return (
        <section id="features" className="py-20">
             <div className="container mx-auto px-6 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">{settings.featuresTitle}</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto">{settings.featuresSubtitle}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {newFeatures.map((feature, i) => (
                        <FeatureCard key={i} icon={feature.icon} title={feature.title} description={feature.description} image={feature.image} delay={i * 150} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const CallToActionSection: React.FC<{ onNavigateToLogin: () => void; onNavigateToRegister: () => void; }> = ({ onNavigateToLogin, onNavigateToRegister }) => (
    <section className="pb-20">
        <div className="container mx-auto px-6 text-center">
            <div className="relative bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl p-12 overflow-hidden">
                 <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-[rgba(var(--accent-primary-rgb),0.15)] to-transparent blur-3xl -translate-y-1/2"></div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">هل أنت مستعد لبدء رحلتك؟</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">انضم إلى آلاف الطلاب الذين يحققون النجاح والتفوق معنا.</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={onNavigateToRegister} className="w-full sm:w-auto px-8 py-3.5 font-bold bg-[var(--accent-primary)] text-white rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-[0_10px_20px_-10px_rgba(var(--accent-primary-rgb),0.4)]">
                        إنشاء حساب جديد
                    </button>
                    <button onClick={onNavigateToLogin} className="w-full sm:w-auto px-8 py-3.5 font-semibold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                        لدي حساب بالفعل
                    </button>
                </div>
            </div>
        </div>
    </section>
);


const CardWaves: React.FC = () => (
    <div className="card-waves-container">
        <svg className="waves-svg absolute bottom-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs><path id="card-gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" /></defs>
            <g className="card-waves-parallax">
                <use xlinkHref="#card-gentle-wave" x="48" y="0" /><use xlinkHref="#card-gentle-wave" x="48" y="3" /><use xlinkHref="#card-gentle-wave" x="48" y="5" /><use xlinkHref="#card-gentle-wave" x="48" y="7" />
            </g>
        </svg>
    </div>
);

const LevelCard: React.FC<{ title: string; description: string; icon: React.FC<{className?: string}>; gradient: string; onClick: () => void; }> = ({ title, description, icon: Icon, gradient, onClick }) => (
    <div onClick={onClick} className={`relative rounded-2xl shadow-lg cursor-pointer transition-all transform hover:-translate-y-2 duration-300 group overflow-hidden p-8 text-white text-center flex flex-col items-center justify-center h-72 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
        <CardWaves />
        <div className="relative z-10">
            <div className="p-4 bg-white/10 rounded-full mb-4 border border-white/20 transition-transform duration-300 group-hover:scale-110 inline-block"><Icon className="w-12 h-12" /></div>
            <h2 className="text-3xl font-black">{title}</h2>
            <p className="mt-2 text-white/80">{description}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-sm font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">اختر لعرض الصفوف</div>
    </div>
);

const GradeCard: React.FC<{ grade: Grade; gradient: string; delay: number; onClick: () => void; }> = ({ grade, gradient, delay, onClick }) => {
    const unitsCount = grade.semesters[0]?.units.length || 0;
    return (
        <div onClick={onClick} className={`relative rounded-2xl shadow-lg cursor-pointer transition-all transform hover:-translate-y-2 duration-300 group overflow-hidden h-64 fade-in bg-gradient-to-br ${gradient}`} style={{ animationDelay: `${delay}ms` }}>
            <CardWaves />
            <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <div>
                    <span className="inline-block px-3 py-1 text-xs bg-white/20 rounded-full mb-3 backdrop-blur-sm">{grade.levelAr}</span>
                    <h3 className="text-3xl font-black text-white leading-tight">{grade.name}</h3>
                </div>
                <div>
                    <div className="w-full h-px bg-white/20 my-3"></div>
                    <div className="flex items-center text-white/80 text-sm"><BookOpenIcon className="w-5 h-5 ml-2" /><span>{unitsCount} وحدة دراسية</span></div>
                </div>
            </div>
        </div>
    );
};

const GradesSection: React.FC<{ onNavigateToLogin: () => void }> = ({ onNavigateToLogin }) => {
    const [selectedLevel, setSelectedLevel] = useState<'Middle' | 'Secondary' | null>(null);
    const [grades, setGrades] = useState<Grade[]>([]);

    useEffect(() => {
        getAllGrades().then(setGrades);
    }, []);

    const middleSchoolGrades = grades.filter(g => g.level === 'Middle').sort((a, b) => a.id - b.id);
    const secondarySchoolGrades = grades.filter(g => g.level === 'Secondary').sort((a, b) => a.id - b.id);

    const gradients = ['from-purple-500 to-indigo-600', 'from-sky-500 to-cyan-500', 'from-amber-500 to-orange-500'];

    return (
        <section id="grades" className="py-20">
            <div className="container mx-auto px-6">
                 {selectedLevel ? (
                    <div className="fade-in">
                        <button onClick={() => setSelectedLevel(null)} className="flex items-center space-x-2 space-x-reverse mb-8 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ArrowRightIcon className="w-4 h-4" /><span>العودة لاختيار المرحلة</span></button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(selectedLevel === 'Middle' ? middleSchoolGrades : secondarySchoolGrades).map((grade, index) => (
                                <GradeCard key={grade.id} grade={grade} gradient={gradients[index % gradients.length]} delay={index * 100} onClick={onNavigateToLogin} />
                            ))}
                        </div>
                    </div>
                 ) : (
                    <>
                        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold">السنوات الدراسية المتاحة</h2><p className="text-lg text-[var(--text-secondary)] mt-2">استعرض المناهج المتاحة لكل صف دراسي</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                           <LevelCard title="المرحلة الإعدادية" description="صفوف الأول والثاني والثالث الإعدادي" icon={AtomIcon} gradient="from-sky-500 to-teal-500" onClick={() => setSelectedLevel('Middle')} />
                           <LevelCard title="المرحلة الثانوية" description="صفوف الأول والثاني والثالث الثانوي" icon={BookOpenIcon} gradient="from-purple-500 to-indigo-600" onClick={() => setSelectedLevel('Secondary')} />
                        </div>
                    </>
                 )}
            </div>
        </section>
    );
};

const AnimatedWaves: React.FC = () => (
    <div className="waves-container">
        <svg className="waves-svg absolute bottom-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs><path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" /></defs>
            <g className="waves-parallax"><use xlinkHref="#gentle-wave" x="48" y="0" /><use xlinkHref="#gentle-wave" x="48" y="3" /><use xlinkHref="#gentle-wave" x="48" y="5" /><use xlinkHref="#gentle-wave" x="48" y="7" /></g>
        </svg>
    </div>
);

const Footer: React.FC<{ settings: PlatformSettings }> = ({ settings }) => (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
        <div className="container mx-auto px-6 py-12"><div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2"><h3 className="text-xl font-bold mb-4">{settings.platformName}</h3><p className="text-[var(--text-secondary)] max-w-md">{settings.footerDescription}</p></div>
            <div><h3 className="text-lg font-semibold mb-4">روابط سريعة</h3><ul className="space-y-2">
                <li><a href="#grades" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ArrowLeftIcon className="w-4 h-4 ml-2"/> السنوات الدراسية</a></li>
                <li><a href="#features" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><ArrowLeftIcon className="w-4 h-4 ml-2"/> مميزات المنصة</a></li>
            </ul></div>
            <div><h3 className="text-lg font-semibold mb-4">تواصل معنا</h3><ul className="space-y-2">
                <li><a href={`tel:${settings.contactPhone}`} className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><PhoneIcon className="w-4 h-4 ml-2"/> {settings.contactPhone}</a></li>
                <li><a href={settings.contactFacebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><FacebookIcon className="w-4 h-4 ml-2"/> فيسبوك</a></li>
                <li><a href={settings.contactYoutubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"><YoutubeIcon className="w-4 h-4 ml-2"/> يوتيوب</a></li>
            </ul></div>
        </div></div>
        <div className="bg-[var(--bg-primary)] border-t border-[var(--border-primary)]"><div className="container mx-auto px-6 py-4 text-center text-sm text-[var(--text-secondary)]">&copy; {new Date().getFullYear()} {settings.platformName}. جميع الحقوق محفوظة.</div></div>
    </footer>
);

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isNavOpen, setIsNavOpen] = useState(false);
    
    useEffect(() => {
        getPlatformSettings().then(setSettings);
    }, []);
    
    if (!settings) return <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)] text-white">جاري التحميل...</div>;

    return (
        <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-cairo relative">
            <CosmicFlowBackground />
            <MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} />
            <Header onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} onOpenNav={() => setIsNavOpen(true)} platformName={settings.platformName} />
            <main>
                <HeroSection onNavigateToRegister={onNavigateToRegister} settings={settings} />
                <StatsSection />
                <DetailedFeaturesSection settings={settings} />
                <CallToActionSection onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} />
                <GradesSection onNavigateToLogin={onNavigateToLogin} />
            </main>
            <AnimatedWaves />
            <Footer settings={settings} />
        </div>
    );
};

export default WelcomeScreen;
