import React, { useState, useEffect } from 'react';
import { Reel } from '../../types';
import { getPublishedReels } from '../../services/storageService';
import Loader from '../common/Loader';
import { ReelsIcon } from '../common/Icons';

// Helper to extract video ID from various YouTube URL formats
const parseYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const ReelsView: React.FC = () => {
    const [reels, setReels] = useState<Reel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const data = await getPublishedReels();
                setReels(data);
            } catch (error) {
                console.error("Failed to fetch reels:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReels();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-center">
                <Loader />
                <p className="mt-4 text-[var(--text-secondary)]">جاري تحميل الريلز...</p>
            </div>
        );
    }
    
    // The parent <main> has padding. Use negative margins to fill the space for an immersive experience.
    return (
        <div className="h-full -m-4 md:-m-6">
            {reels.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center bg-black rounded-lg md:rounded-b-2xl">
                    <ReelsIcon className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-300">لا توجد ريلز متاحة</h3>
                    <p className="text-gray-500 mt-1">ترقبوا المزيد من المحتوى قريباً!</p>
                </div>
            ) : (
                <div className="h-full w-full overflow-y-auto snap-y snap-mandatory bg-black rounded-lg md:rounded-b-2xl">
                    {reels.map((reel) => {
                        const videoId = parseYouTubeVideoId(reel.youtubeUrl);
                        if (!videoId) return null;

                        return (
                            <div key={reel.id} className="h-full w-full snap-center flex items-center justify-center relative">
                                <iframe
                                    className="w-auto h-full max-w-full aspect-[9/16]"
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3`}
                                    title={reel.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                ></iframe>
                                <div className="absolute bottom-[6.5rem] md:bottom-10 left-4 right-4 text-white p-3 bg-black/40 rounded-lg backdrop-blur-sm pointer-events-none">
                                    <h3 className="font-bold text-center">{reel.title}</h3>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReelsView;
