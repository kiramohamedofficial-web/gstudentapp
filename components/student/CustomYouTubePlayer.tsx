import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, ToastType } from '../../types';
import { useToast } from '../../useToast';
import CosmicLoader from '../common/Loader';
import {
  PlayIcon,
  PauseIcon,
  SpeakerphoneIcon,
  VolumeOffIcon,
  ArrowsExpandIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CogIcon,
  XCircleIcon,
  VideoCameraIcon,
  CheckIcon,
} from '../common/Icons';

// A single promise to ensure the YouTube API is loaded only once.
let youtubeApiPromise: Promise<void> | null = null;
const loadYouTubeApi = (): Promise<void> => {
    if (youtubeApiPromise) {
        return youtubeApiPromise;
    }
    youtubeApiPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            return resolve();
        }
        const scriptUrl = 'https://www.youtube.com/iframe_api';
        if (!window.onYouTubeIframeAPIReadyCallbacks) {
            window.onYouTubeIframeAPIReadyCallbacks = [];
            window.onYouTubeIframeAPIReady = () => {
                window.onYouTubeIframeAPIReadyCallbacks?.forEach(callback => callback());
                window.onYouTubeIframeAPIReadyCallbacks = [];
            };
        }
        window.onYouTubeIframeAPIReadyCallbacks.push(resolve);
        const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
        if (!existingScript) {
            const tag = document.createElement('script');
            tag.src = scriptUrl;
            document.head.appendChild(tag);
        }
    });
    return youtubeApiPromise;
};

interface CustomYouTubePlayerProps {
    initialLesson: Lesson;
    playlist: Lesson[];
    onLessonComplete: (lessonId: string) => void;
}

const PLAYER_CONTAINER_ID = 'youtube-player-container';
const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];


const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({ initialLesson, playlist, onLessonComplete }) => {
    const playerRef = useRef<any>(null);
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson);
    const [playerState, setPlayerState] = useState<number>(-1);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(100);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [isMouseInPlayer, setIsMouseInPlayer] = useState(true);
    
    const { addToast } = useToast();
    const progressIntervalRef = useRef<number | null>(null);
    const controlsTimeoutRef = useRef<number | null>(null);

    const onLessonCompleteRef = useRef(onLessonComplete);
    useEffect(() => { onLessonCompleteRef.current = onLessonComplete; }, [onLessonComplete]);
    
    const currentPlaylistIndex = playlist.findIndex(l => l.id === currentLesson.id);
    const isPlaying = playerState === window.YT?.PlayerState?.PLAYING;
    const isPaused = playerState === window.YT?.PlayerState?.PAUSED || playerState === window.YT?.PlayerState?.ENDED || playerState === -1;

    useEffect(() => {
        setCurrentLesson(initialLesson);
    }, [initialLesson]);

    const playVideoByIndex = useCallback((index: number) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentLesson(playlist[index]);
        }
    }, [playlist]);

    const playNextVideo = useCallback(() => {
        let nextIndex = currentPlaylistIndex + 1;
        if (nextIndex >= playlist.length) {
          // Do nothing, just stop at the end. Or loop: nextIndex = 0;
          return;
        }
        playVideoByIndex(nextIndex);
    }, [currentPlaylistIndex, playlist.length, playVideoByIndex]);
    
    const playPreviousVideo = useCallback(() => {
        let prevIndex = currentPlaylistIndex - 1;
        if (prevIndex < 0) {
          // Do nothing. Or go to end: prevIndex = playlist.length - 1;
          return;
        }
        playVideoByIndex(prevIndex);
    }, [currentPlaylistIndex, playVideoByIndex]);

    useEffect(() => {
        let isMounted = true;
        
        const initPlayer = async () => {
            try {
                await loadYouTubeApi();
                if (!isMounted || !document.getElementById(PLAYER_CONTAINER_ID) || playerRef.current) return;

                playerRef.current = new window.YT.Player(PLAYER_CONTAINER_ID, {
                    height: '100%',
                    width: '100%',
                    playerVars: { 
                        'playsinline': 1, 
                        'controls': 0, 
                        'modestbranding': 1, 
                        'rel': 0,
                        'iv_load_policy': 3,
                        'enablejsapi': 1,
                        'origin': window.location.origin,
                    },
                    events: {
                        'onReady': () => {
                           if(isMounted) setIsPlayerReady(true);
                        },
                        'onStateChange': (event: any) => {
                            if (!isMounted) return;
                            setPlayerState(event.data);
                        },
                        'onError': (event: any) => {
                            console.error('YouTube Player Error:', event.data);
                            if (!isMounted) return;
                            let errorMessage = `حدث خطأ في تحميل الفيديو (كود: ${event.data}).`;
                            if (event.data === 101 || event.data === 150) {
                                errorMessage = "هذا الفيديو محمي من قبل المالك ولا يمكن تشغيله هنا. حاول تشغيل فيديو آخر من القائمة.";
                            }
                            setPlayerError(errorMessage);
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to initialize YouTube player:", error);
                if (isMounted) addToast('فشل تحميل مشغل الفيديو.', ToastType.ERROR);
            }
        };

        initPlayer();

        return () => {
            isMounted = false;
            progressIntervalRef.current && clearInterval(progressIntervalRef.current);
            controlsTimeoutRef.current && clearTimeout(controlsTimeoutRef.current);
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }
            playerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (isPlayerReady && playerRef.current && currentLesson.content) {
            setPlayerError(null);
            playerRef.current.loadVideoById(currentLesson.content);
        }
    }, [isPlayerReady, currentLesson.content]);

    useEffect(() => {
        const player = playerRef.current;
        if (!isPlayerReady || !player) return;

        if (playerState === window.YT?.PlayerState?.CUED) {
            player.playVideo();
        }

        if (playerState === window.YT?.PlayerState?.ENDED) {
            onLessonCompleteRef.current(currentLesson.id);
            playNextVideo();
        }
        
        if (playerState === window.YT?.PlayerState?.PLAYING) {
            setDuration(player.getDuration() || 0);
            setVolume(player.getVolume() || 100);
            setIsMuted(player.isMuted() || false);

            progressIntervalRef.current = window.setInterval(() => {
                setCurrentTime(player.getCurrentTime() || 0);
            }, 500);
        } else {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPlayerReady, playerState, playNextVideo, currentLesson.id]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const handlePlayPause = () => playerRef.current && (playerState === window.YT?.PlayerState?.PLAYING ? playerRef.current.pauseVideo() : playerRef.current.playVideo());
    const handleToggleMute = () => {
        if (!playerRef.current) return;
        playerRef.current.isMuted() ? playerRef.current.unMute() : playerRef.current.mute();
        setIsMuted(playerRef.current.isMuted());
    };
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(e.target.value, 10);
        setVolume(newVolume);
        playerRef.current?.setVolume(newVolume);
    };
    const handleSpeedChange = (speed: number) => {
        setPlaybackRate(speed);
        playerRef.current?.setPlaybackRate(speed);
        setIsSettingsMenuOpen(false);
    };
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        playerRef.current.seekTo(duration * percent, true);
    };
    const handleFullscreen = () => {
        const elem = playerWrapperRef.current;
        if (!elem) return;

        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch((err) => {
                addToast(`خطأ في تفعيل وضع ملء الشاشة: ${err.message}`, ToastType.ERROR);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    const handleMouseMove = () => {
        setIsMouseInPlayer(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = window.setTimeout(() => setIsMouseInPlayer(false), 3000);
        }
    };

    const handleMouseLeave = () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) setIsMouseInPlayer(false);
    };

    const showControls = isPaused || isMouseInPlayer || isSettingsMenuOpen;
    
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div 
                className={`lg:flex-[2] min-w-0 ${isFullscreen ? 'fixed inset-0 z-[100] bg-black flex items-center justify-center' : 'relative'}`} 
                ref={playerWrapperRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div 
                  className={`${isFullscreen ? 'w-full h-full' : 'relative w-full shadow-2xl'} bg-black rounded-lg overflow-hidden transition-all duration-300`} 
                  style={!isFullscreen ? { aspectRatio: '16/9' } : {}}
                >
                    {(!isPlayerReady || playerError) && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 p-4 text-center">
                            {playerError ? (
                                <>
                                    <XCircleIcon className="w-12 h-12 text-red-500 mb-4" />
                                    <p className="text-white">{playerError}</p>
                                </>
                            ) : (
                                <>
                                    <CosmicLoader />
                                    <p className="mt-4 text-white">جاري تحميل الفيديو...</p>
                                </>
                            )}
                        </div>
                    )}
                    <div id={PLAYER_CONTAINER_ID} className="w-full h-full" />
                    
                     <div className={`video-player-overlay ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="video-player-top-bar">
                           <h3 className="text-lg font-bold flex items-center truncate">
                                <VideoCameraIcon className="w-5 h-5 ml-2 flex-shrink-0"/> 
                                <span className="truncate">{currentLesson.title}</span>
                            </h3>
                        </div>

                        <div 
                            className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center group"
                            onClick={handlePlayPause}
                            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                        >
                            <div className={`
                                w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center
                                transition-all duration-300 ease-in-out
                                ${isPaused ? 'opacity-100 scale-100' : 'opacity-0 scale-125 group-hover:opacity-100 group-hover:scale-100'}
                                pointer-events-none
                            `}>
                                {isPlaying ? (
                                    <PauseIcon className="w-10 h-10 text-white" />
                                ) : (
                                    <PlayIcon className="w-10 h-10 text-white ml-1" />
                                )}
                            </div>
                        </div>
                    
                        <div className="video-player-controls-bar">
                             <div className="custom-player-progress-container" onClick={handleSeek}>
                                <div className="custom-player-progress-bar" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}></div>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <button onClick={playPreviousVideo} className="custom-player-btn" disabled={!isPlayerReady || currentPlaylistIndex <= 0}><ChevronDoubleLeftIcon className="w-6 h-6"/></button>
                                    <button onClick={handlePlayPause} className="custom-player-btn" disabled={!isPlayerReady}>
                                        {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                                    </button>
                                    <button onClick={playNextVideo} className="custom-player-btn" disabled={!isPlayerReady || currentPlaylistIndex >= playlist.length - 1}><ChevronDoubleRightIcon className="w-6 h-6"/></button>
                                    
                                    <div className="volume-controls-container">
                                        <button onClick={handleToggleMute} className="custom-player-btn" disabled={!isPlayerReady}>
                                            {isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6"/> : <SpeakerphoneIcon className="w-6 h-6"/>}
                                        </button>
                                         <div className="volume-slider-wrapper">
                                            <input type="range" min="0" max="100" value={volume} className="custom-player-slider" onChange={handleVolumeChange} disabled={!isPlayerReady}/>
                                         </div>
                                    </div>
                                    
                                    <div className="text-sm font-mono tracking-tighter text-white/90">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className="relative">
                                        <button onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)} className="custom-player-btn" disabled={!isPlayerReady}>
                                            <CogIcon className="w-6 h-6"/>
                                        </button>
                                        {isSettingsMenuOpen && (
                                            <div className="settings-menu fade-in">
                                                <div className="settings-menu-header">سرعة التشغيل</div>
                                                {speedOptions.map(speed => (
                                                    <button key={speed} onClick={() => handleSpeedChange(speed)} className={`settings-menu-item ${playbackRate === speed ? 'active' : ''}`}>
                                                        {playbackRate === speed && <CheckIcon className="w-4 h-4 text-white" />}
                                                        <span>{speed === 1 ? 'عادي' : `${speed}x`}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleFullscreen} className="custom-player-btn" disabled={!isPlayerReady}>
                                        <ArrowsExpandIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isFullscreen && (
                <div className="youtube-playlist-container lg:flex-[1] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg lg:max-h-[75vh] flex flex-col">
                    <h3 className="text-lg font-bold p-4 border-b border-[var(--border-primary)] text-[var(--text-primary)]">الدروس في هذه الوحدة</h3>
                    <div className="overflow-y-auto flex-grow">
                        {playlist.map((item, index) => (
                            <div 
                                key={item.id} 
                                onClick={() => isPlayerReady && playVideoByIndex(index)}
                                className={`flex items-center p-3 border-b border-[var(--border-primary)] transition-all duration-200 ${isPlayerReady ? 'cursor-pointer hover:bg-[var(--bg-tertiary)]' : 'opacity-70'} ${item.id === currentLesson.id ? 'bg-[var(--bg-secondary)] border-r-4 border-[var(--accent-primary)]' : ''}`}
                            >
                                 <div className="w-16 h-9 bg-black rounded flex-shrink-0 ml-3">
                                    <img src={`https://img.youtube.com/vi/${item.content}/default.jpg`} alt={item.title} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm truncate ${item.id === currentLesson.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">{item.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomYouTubePlayer;