import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, ArrowsExpandIcon, CogIcon, ShieldExclamationIcon } from '../common/Icons';
import Loader from '../common/Loader';

// Global promise to load YouTube API script only once
let youtubeApiPromise: Promise<void> | null = null;
const loadYouTubeApi = (): Promise<void> => {
    if (youtubeApiPromise) {
        return youtubeApiPromise;
    }
    youtubeApiPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }
        if (window.onYouTubeIframeAPIReadyCallbacks) {
            window.onYouTubeIframeAPIReadyCallbacks.push(resolve);
            return;
        }
        window.onYouTubeIframeAPIReadyCallbacks = [resolve];
        window.onYouTubeIframeAPIReady = () => {
            window.onYouTubeIframeAPIReadyCallbacks?.forEach(cb => cb());
            window.onYouTubeIframeAPIReadyCallbacks = [];
        };
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    });
    return youtubeApiPromise;
};

const formatTime = (seconds: number): string => {
    const date = new Date(0);
    date.setSeconds(seconds || 0);
    const timeString = date.toISOString().substring(11, 19);
    if (timeString.startsWith('00:0')) return timeString.substring(4);
    if (timeString.startsWith('00:')) return timeString.substring(3);
    if (timeString.startsWith('0')) return timeString.substring(1);
    return timeString;
};

const qualityLabels: Record<string, string> = {
  highres: 'أعلى جودة', hd2880: '4K', hd2160: '4K', hd1440: '1440p', hd1080: '1080p',
  hd720: '720p', large: '480p', medium: '360p', small: '240p', tiny: '144p', auto: 'تلقائي',
};
const getQualityLabel = (quality: string) => qualityLabels[quality] || quality.toUpperCase();

interface CustomYouTubePlayerProps {
    videoId: string;
    onLessonComplete: (videoId: string) => void;
    onAutoPlayNext?: () => void;
    nextVideoTitle?: string;
    isDataSaverEnabled: boolean;
}

const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({ videoId, onLessonComplete, onAutoPlayNext, nextVideoTitle, isDataSaverEnabled }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const qualityMenuRef = useRef<HTMLDivElement>(null);
    const qualityButtonRef = useRef<HTMLButtonElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hideControlsTimeoutRef = useRef<number | null>(null);

    const [isApiReady, setIsApiReady] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loadedFraction, setLoadedFraction] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [availableQualities, setAvailableQualities] = useState<string[]>([]);
    const [currentQuality, setCurrentQuality] = useState<string>('auto');
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [isQualityMenuOpen, setQualityMenuOpen] = useState(false);
    
    const [showUpNext, setShowUpNext] = useState(false);
    const [upNextCountdown, setUpNextCountdown] = useState(5);

    const onLessonCompleteRef = useRef(onLessonComplete);
    useEffect(() => { onLessonCompleteRef.current = onLessonComplete; }, [onLessonComplete]);

    const onAutoPlayNextRef = useRef(onAutoPlayNext);
    useEffect(() => { onAutoPlayNextRef.current = onAutoPlayNext; }, [onAutoPlayNext]);
    
    useEffect(() => {
        if (showUpNext && onAutoPlayNextRef.current) {
            if (upNextCountdown > 0) {
                const timer = setTimeout(() => setUpNextCountdown(c => c - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                onAutoPlayNextRef.current();
            }
        }
    }, [showUpNext, upNextCountdown]);


    const hideControls = useCallback(() => {
        if (isPlaying && !isQualityMenuOpen) {
            if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
            hideControlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying, isQualityMenuOpen]);

    useEffect(() => {
        loadYouTubeApi().then(() => setIsApiReady(true));

        const handleFullscreenChange = () => {
          if (!document.fullscreenElement) setShowControls(true);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (!isApiReady || !playerContainerRef.current) return;
        
        setPlayerError(null);
        setIsPlayerReady(false);
        setIsBuffering(true);
        setShowUpNext(false);
        setCurrentTime(0);
        setDuration(0);
        setLoadedFraction(0);
        
        const playerDiv = document.createElement('div');
        playerContainerRef.current.innerHTML = '';
        playerContainerRef.current.appendChild(playerDiv);

        let progressInterval: number;
        
        const playerInstance = new window.YT.Player(playerDiv, {
            videoId,
            playerVars: { playsinline: 1, controls: 0, rel: 0, iv_load_policy: 3, modestbranding: 1, autoplay: 1 },
            events: {
                onReady: (e: any) => {
                    setIsPlayerReady(true);
                    setIsBuffering(false);
                    setDuration(e.target.getDuration());
                    if (isDataSaverEnabled) {
                        e.target.setPlaybackQuality('small'); 
                        setCurrentQuality('small');
                    } else {
                        setCurrentQuality(e.target.getPlaybackQuality());
                    }
                    e.target.playVideo();
                },
                onStateChange: (e: any) => {
                    if (!window.YT?.PlayerState) return; // Defensive check for stability
                    const state = e.data;
                    setIsPlaying(state === window.YT.PlayerState.PLAYING);
                    setIsBuffering(state === window.YT.PlayerState.BUFFERING);
                    
                    if (state === window.YT.PlayerState.PLAYING) {
                         if (isDataSaverEnabled) {
                            e.target.setPlaybackQuality('small');
                         } else {
                             const qualities = e.target.getAvailableQualityLevels();
                             if (qualities && qualities.length > 0) {
                                setAvailableQualities(['auto', ...qualities.filter(q => q !== 'auto')]);
                             }
                         }
                    }
                    if (state === window.YT.PlayerState.ENDED) {
                        onLessonCompleteRef.current(videoId);
                        if(onAutoPlayNextRef.current) {
                            setUpNextCountdown(5); 
                            setShowUpNext(true);
                        }
                    }
                },
                onPlaybackQualityChange: (e: any) => {
                    const newQuality = e.data;
                    if (isDataSaverEnabled && newQuality !== 'small') {
                        e.target.setPlaybackQuality('small');
                        setCurrentQuality('small');
                    } else {
                        setCurrentQuality(newQuality);
                    }
                },
                onError: (e: any) => {
                    console.error('YouTube Player Error:', e.data);
                    let errorMessage = 'هذا الفيديو غير متاح حاليًا أو حدث خطأ أثناء تحميله.';
                    switch(e.data) {
                        case 2:
                            errorMessage = 'رابط الفيديو غير صالح أو يحتوي على خطأ. يرجى إبلاغ الدعم الفني.';
                            break;
                        case 5:
                             errorMessage = 'حدث خطأ في مشغل الفيديو. يرجى تحديث الصفحة والمحاولة مرة أخرى.';
                            break;
                        case 100:
                            errorMessage = 'الفيديو المطلوب غير موجود. قد يكون تم حذفه أو تم تعيينه كخاص.';
                            break;
                        case 101:
                        case 150:
                        case 153:
                             errorMessage = 'صاحب الفيديو لا يسمح بتشغيله على مواقع خارجية. يرجى إبلاغ الدعم الفني لاستبدال الفيديو.';
                            break;
                    }
                    setPlayerError(errorMessage);
                    setIsBuffering(false);
                }
            },
        });
        playerRef.current = playerInstance;

        progressInterval = window.setInterval(() => {
            if (playerInstance && typeof playerInstance.getCurrentTime === 'function') {
                setCurrentTime(playerInstance.getCurrentTime());
                setLoadedFraction(playerInstance.getVideoLoadedFraction());
            }
        }, 250);

        return () => {
            clearInterval(progressInterval);
            playerRef.current?.destroy();
        };
    }, [videoId, isApiReady, isDataSaverEnabled]);
    
    useEffect(() => {
        if (isPlaying) hideControls();
        else if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    }, [isPlaying, hideControls]);

    const handleMouseMove = () => {
        setShowControls(true);
        hideControls();
    };

    const handlePlayPause = useCallback(() => {
        if (!isPlayerReady) return;
        if (isPlaying) {
            playerRef.current?.pauseVideo();
        } else {
            playerRef.current?.playVideo();
        }
    }, [isPlayerReady, isPlaying]);
    
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const scrubTime = ((e.clientX - rect.left) / rect.width) * duration;
        setCurrentTime(scrubTime);
        playerRef.current?.seekTo(scrubTime, true);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (isMuted && newVolume > 0) setIsMuted(false);
        playerRef.current?.setVolume(newVolume * 100);
    };

    const handleMute = useCallback(() => {
        if (isMuted) playerRef.current?.unMute();
        else playerRef.current?.mute();
        setIsMuted(!isMuted);
    }, [isMuted]);

    const handleFullscreen = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen();
        else containerRef.current?.requestFullscreen();
    }, []);
    
    const handleSetQuality = useCallback((quality: string) => {
        playerRef.current?.setPlaybackQuality(quality);
        setQualityMenuOpen(false);
    }, []);
    
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div ref={containerRef} className="yt-player-container" onMouseMove={handleMouseMove} onMouseLeave={hideControls}>
            <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />
            
            {playerError && (
                <div className="yt-error-overlay">
                    <ShieldExclamationIcon className="w-16 h-16 text-red-500 mb-4" />
                    <h3 className="text-xl font-bold">حدث خطأ</h3>
                    <p className="text-gray-300 mt-2">{playerError}</p>
                </div>
            )}
            
            {showUpNext && (
                <div className="yt-upnext-overlay">
                    <p className="text-lg text-gray-300 mb-2">الدرس التالي يبدأ خلال</p>
                    <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                       <svg className="yt-upnext-countdown-circle" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="22" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="transparent" />
                            <circle cx="25" cy="25" r="22" stroke="white" strokeWidth="3" fill="transparent"
                                strokeDasharray={2 * Math.PI * 22}
                                strokeDashoffset={(2 * Math.PI * 22) * (1 - upNextCountdown / 5)}
                            />
                        </svg>
                        <span className="absolute text-2xl font-bold">{upNextCountdown}</span>
                    </div>
                    {nextVideoTitle && <p className="font-bold text-xl truncate max-w-full">{nextVideoTitle}</p>}
                    <button onClick={() => setShowUpNext(false)} className="mt-6 px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20">إلغاء</button>
                </div>
            )}

            {isBuffering && <div className="yt-buffering-spinner"></div>}
            
            <div className="yt-player-overlay" onDoubleClick={handleFullscreen} onClick={handlePlayPause}></div>

            {!isPlaying && isPlayerReady && !isBuffering && !playerError && (
                <button aria-label="تشغيل" className="yt-center-play-button" onClick={handlePlayPause}>
                    <PlayIcon className="w-10 h-10 text-white pl-1" />
                </button>
            )}

            <div className={`yt-controls-overlay ${showControls || !isPlaying || isQualityMenuOpen ? 'visible' : ''}`}>
                <div className="yt-progress-bar-container" ref={progressRef} onClick={handleSeek}>
                    <div className="yt-progress-bar-bg"></div>
                    <div className="yt-progress-bar-bg yt-progress-bar-loaded" style={{ width: `${loadedFraction * 100}%`, left: 0 }}></div>
                    <div className="yt-progress-bar-bg yt-progress-bar-played" style={{ width: `${progressPercent}%`, left: 0 }}></div>
                    <div className="yt-progress-thumb" style={{ left: `${progressPercent}%` }}></div>
                </div>
                <div className="yt-bottom-controls">
                    <div className="flex items-center gap-4">
                        <button aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"} onClick={handlePlayPause} className="yt-control-button">
                            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                        </button>
                        <div className="yt-volume-container">
                            <button aria-label={isMuted || volume === 0 ? "إلغاء كتم الصوت" : "كتم الصوت"} onClick={handleMute} className="yt-control-button">
                                {isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                            </button>
                            <input
                                type="range" className="yt-volume-slider" min="0" max="1" step="0.05"
                                value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                                aria-label="التحكم في مستوى الصوت"
                            />
                        </div>
                    </div>
                    <span className="yt-time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    <div className="flex items-center gap-2">
                         {!isDataSaverEnabled && (
                             <div className="relative">
                                {isQualityMenuOpen && availableQualities.length > 1 && (
                                    <div ref={qualityMenuRef} className="yt-quality-menu fade-in-up">
                                        {availableQualities.map(q => (
                                            <button key={q} className={`yt-quality-item ${currentQuality === q ? 'active' : ''}`} onClick={() => handleSetQuality(q)}>
                                                {getQualityLabel(q)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {availableQualities.length > 1 && (
                                    <button ref={qualityButtonRef} onClick={() => setQualityMenuOpen(p => !p)} className="yt-control-button text-sm font-semibold" aria-label={`الجودة الحالية: ${getQualityLabel(currentQuality)}`}>
                                        <span>{getQualityLabel(currentQuality)}</span>
                                        <CogIcon className="w-5 h-5" />
                                    </button>
                                )}
                             </div>
                         )}
                         <button onClick={handleFullscreen} className="yt-control-button" aria-label="ملء الشاشة">
                            <ArrowsExpandIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomYouTubePlayer;