import React, { useState, useEffect, useMemo } from 'react';
import { Course, CourseVideo, Teacher, ToastType } from '../../types';
import { getAllTeachers, checkCoursePurchase, purchaseCourse } from '../../services/storageService';
import { ArrowRightIcon, BookOpenIcon, LockClosedIcon, PlayIcon, ShieldExclamationIcon, UserCircleIcon, VideoCameraIcon, DocumentTextIcon } from '../common/Icons';
import Loader from '../common/Loader';
import CustomYouTubePlayer from './CustomYouTubePlayer';
import { useSession } from '../../hooks/useSession';
import { useToast } from '../../useToast';
import PdfViewer from './PdfViewer';

interface CourseDetailViewProps {
    course: Course;
    onBack: () => void;
    isDataSaverEnabled: boolean;
}

const parseYouTubeVideoId = (url: any): string | null => {
    if (typeof url !== 'string' || !url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match) {
        return match[1];
    }
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }
    return null;
};


const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, onBack, isDataSaverEnabled }) => {
    const { currentUser } = useSession();
    const { addToast } = useToast();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [playingVideo, setPlayingVideo] = useState<CourseVideo | null>(null);
    const [isViewingPdf, setIsViewingPdf] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const teachers = await getAllTeachers();
            const courseTeacher = teachers.find(t => t.id === course.teacherId);
            setTeacher(courseTeacher || null);

            if(currentUser && !course.isFree) {
                const purchased = await checkCoursePurchase(currentUser.id, course.id);
                setIsPurchased(purchased);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [course, currentUser]);
    
    const handlePurchase = async () => {
        if (!currentUser) {
            addToast('يجب تسجيل الدخول أولاً لإتمام الشراء', ToastType.ERROR);
            return;
        }
        await purchaseCourse(currentUser.id, course.id);
        addToast(`تم شراء كورس "${course.title}" بنجاح!`, ToastType.SUCCESS);
        setIsPurchased(true);
    };

    const canPlayVideo = (video: CourseVideo) => {
        return course.isFree || isPurchased || video.isFree;
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }
    
    const videoId = playingVideo?.videoUrl ? parseYouTubeVideoId(playingVideo.videoUrl) : null;

    if (isViewingPdf && course.pdfUrl) {
        return <PdfViewer pdfUrl={course.pdfUrl} title={course.title} onBack={() => setIsViewingPdf(false)} />;
    }

    if (playingVideo && videoId) {
        return (
             <div>
                <button onClick={() => setPlayingVideo(null)} className="flex items-center space-x-2 space-x-reverse mb-4 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>العودة لتفاصيل الكورس</span>
                </button>
                <h2 className="text-2xl font-bold mb-4">{playingVideo.title}</h2>
                <CustomYouTubePlayer videoId={videoId} onLessonComplete={() => {}} isDataSaverEnabled={isDataSaverEnabled} />
            </div>
        )
    }
    
    if (playingVideo && !videoId) {
        return (
             <div>
                <button onClick={() => setPlayingVideo(null)} className="flex items-center space-x-2 space-x-reverse mb-4 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>العودة لتفاصيل الكورس</span>
                </button>
                <h2 className="text-2xl font-bold mb-4">{playingVideo.title}</h2>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-[var(--border-primary)] flex items-center justify-center text-center p-4">
                    <div>
                        <ShieldExclamationIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">رابط الفيديو غير صالح</h3>
                        <p className="text-sm text-gray-400 mt-1">لا يمكن تشغيل هذا الفيديو. يرجى إبلاغ الدعم الفني.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة لمتجر الكورسات</span>
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] overflow-hidden">
                        <img src={course.coverImage} alt={course.title} className="w-full h-64 object-cover" />
                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{course.title}</h1>
                            <p className="text-md text-[var(--text-secondary)] mt-4">{course.description}</p>
                        </div>
                    </div>
                     <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)]">
                        <h2 className="text-xl font-bold mb-4">محتويات الكورس</h2>
                        <div className="space-y-3">
                            {course.videos.map(video => (
                                <button key={video.id} onClick={() => canPlayVideo(video) && setPlayingVideo(video)} disabled={!canPlayVideo(video)} className="w-full text-right p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors group disabled:cursor-not-allowed">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            {canPlayVideo(video) ? <PlayIcon className="w-6 h-6 text-green-500"/> : <LockClosedIcon className="w-6 h-6 text-gray-500"/>}
                                            <span className={`font-semibold ${canPlayVideo(video) ? 'text-[var(--text-primary)]' : 'text-gray-500'}`}>{video.title}</span>
                                        </div>
                                        {video.isFree && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">مجاني</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)] text-center">
                        <p className="text-4xl font-black text-[var(--text-accent)] mb-4">
                            {course.isFree ? 'مجاني' : `${course.price} ج.م`}
                        </p>
                        {!course.isFree && !isPurchased && (
                            <button onClick={handlePurchase} className="w-full py-3 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">شراء الكورس</button>
                        )}
                        {(course.isFree || isPurchased) && (
                            <p className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg font-semibold">تم الاشتراك</p>
                        )}
                    </div>
                    {teacher && (
                        <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)]">
                             <img src={teacher.imageUrl} alt={teacher.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
                             <h3 className="text-lg font-bold text-center">{teacher.name}</h3>
                             <p className="text-sm text-center text-[var(--text-secondary)]">{teacher.subject}</p>
                        </div>
                    )}
                    {course.pdfUrl && (course.isFree || isPurchased) && (
                        <button onClick={() => setIsViewingPdf(true)} className="block w-full text-center p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors font-semibold flex items-center justify-center gap-2">
                            <DocumentTextIcon className="w-5 h-5"/>
                            عرض ملف PDF المرفق
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseDetailView;