import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, ToastType } from '../../types';
import { useToast } from '../../useToast';
import Loader from '../common/Loader';
import {
  PlayIcon,
  PauseIcon,
  VolumeOffIcon,
  ArrowsExpandIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CogIcon,
  XCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  SpeakerphoneIcon,
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
const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
const qualityLabelMap: { [key: string]: string } = {
    'hd2160': '2160p 4K',
    'hd1440': '1440p HD',
    'hd1080': '1080p HD',
    'hd720': '720p HD',
    'large': '480p',
    'medium': '360p',
    'small': '240p',
    'tiny': '144p',
    'auto': 'تلقائي',
};


const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({ initialLesson, playlist, onLessonComplete }) => {
    const playerRef = useRef<any>(null);
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const playlistRef = useRef<HTMLDivElement>(null);
    const activeItemRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);
    const lessonLoadedRef = useRef<boolean>(false);
    
    const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [playerState, setPlayerState] = useState<number>(-1);
    const [playerError, setPlayerError] = useState<string | null>(null);

    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentQuality, setCurrentQuality] = useState<string>('auto');
    const [availableQualities, setAvailableQualities] = useState<string[]>([]);


    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main');
    const [isVolumeSliderVisible, setVolumeSliderVisible] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [areControlsVisible, setAreControlsVisible] = useState(true);

    const { addToast } = useToast();
    const onLessonCompleteRef = useRef(onLessonComplete);
    useEffect(() => { onLessonCompleteRef.current = onLessonComplete; }, [onLessonComplete]);

    const isPlaying = playerState === window.YT?.PlayerState?.PLAYING;
    const isBuffering = playerState === window.YT?.PlayerState?.BUFFERING;
    const isPaused = !isPlaying && !isBuffering;

    const currentPlaylistIndex = playlist.findIndex(l => l.id === currentLesson.id);

    const playVideoByIndex = useCallback((index: number) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentLesson(playlist[index]);
            setPlayerError(null);
        }
    }, [playlist]);

    const playNextVideo = useCallback(() => {
        const nextIndex = currentPlaylistIndex + 1;
        if (nextIndex < playlist.length) playVideoByIndex(nextIndex);
    }, [currentPlaylistIndex, playlist.length, playVideoByIndex]);

    const playPreviousVideo = useCallback(() => {
        const prevIndex = currentPlaylistIndex - 1;
        if (prevIndex >= 0) playVideoByIndex(prevIndex);
    }, [currentPlaylistIndex, playVideoByIndex]);
    
    const reloadCurrentVideo = useCallback(() => {
        if (playerRef.current && currentLesson.content) {
            setPlayerError(null);
            playerRef.current.loadVideoById(currentLesson.content);
        }
    }, [currentLesson.content]);

    // Player Initialization
    useEffect(() => {
        let isMounted = true;
        const initPlayer = async () => {
            try {
                await loadYouTubeApi();
                if (!isMounted || !document.getElementById(PLAYER_CONTAINER_ID) || playerRef.current) return;

                playerRef.current = new window.YT.Player(PLAYER_CONTAINER_ID, {
                    videoId: initialLesson.content,
                    playerVars: { 'playsinline': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0, 'iv_load_policy': 3, 'enablejsapi': 1, 'origin': window.location.origin },
                    events: {
                        'onReady': (event: any) => {
                            if (!isMounted) return;
                            setIsPlayerReady(true);
                            event.target.setPlaybackRate(playbackRate);
                            setCurrentQuality(event.target.getPlaybackQuality());
                            const qualities = event.target.getAvailableQualityLevels();
                            if (qualities) {
                                setAvailableQualities(qualities);
                            }
                        },
                        'onStateChange': (event: any) => { if (isMounted) setPlayerState(event.data); },
                        'onPlaybackQualityChange': (event: any) => { if (isMounted) setCurrentQuality(event.data); },
                        'onError': (event: any) => {
                            if (!isMounted) return;
                            let msg = `حدث خطأ في تحميل الفيديو (كود: ${event.data}).`;
                            if (event.data === 101 || event.data === 150) msg = "هذا الفيديو محمي ولا يمكن تشغيله هنا.";
                            setPlayerError(msg);
                        },
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
            if (playerRef.current?.destroy) playerRef.current.destroy();
            playerRef.current = null;
        };
    }, [initialLesson.content, playbackRate, addToast]);
    
    // Video Change
    useEffect(() => {
        lessonLoadedRef.current = false;
        if (isPlayerReady && playerRef.current && playerRef.current.getVideoData()?.video_id !== currentLesson.content) {
            reloadCurrentVideo();
        }
    }, [isPlayerReady, currentLesson.content, reloadCurrentVideo]);

    // State Updates & Intervals
    useEffect(() => {
        const player = playerRef.current;
        if (!isPlayerReady || !player) return;

        const updateProgress = () => {
            setCurrentTime(player.getCurrentTime() || 0);
            const loaded = player.getVideoLoadedFraction() || 0;
            setDuration(player.getDuration() || 0);
            setBuffered(loaded * (player.getDuration() || 0));
        };
        
        if (isPlaying && !lessonLoadedRef.current) {
            lessonLoadedRef.current = true;
            const qualities = player.getAvailableQualityLevels();
            if (qualities) {
                setAvailableQualities(qualities);
            }
        }

        if (isPlaying) {
            const progressInterval = setInterval(updateProgress, 250);
            return () => clearInterval(progressInterval);
        }

        if (playerState === window.YT?.PlayerState?.ENDED) {
            onLessonCompleteRef.current(currentLesson.id);
            playNextVideo();
        }
    }, [isPlayerReady, isPlaying, playerState, playNextVideo, currentLesson.id]);

    // Fullscreen and Controls Visibility
    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const hideControls = useCallback(() => {
        if (isPlaying) setAreControlsVisible(false);
    }, [isPlaying]);

    const handleMouseMove = useCallback(() => {
        setAreControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
    }, [hideControls]);

    useEffect(() => {
        if (isPaused) {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            setAreControlsVisible(true);
        } else {
            handleMouseMove(); // Start timer on play
        }
    }, [isPaused, handleMouseMove]);
    
     // Scroll playlist to active item
    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentLesson]);

    // Player Actions
    const handlePlayPause = () => isPlaying ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo();
    const handleToggleMute = () => {
        if (!playerRef.current) return;
        const muted = playerRef.current.isMuted();
        muted ? playerRef.current.unMute() : playerRef.current.mute();
        setIsMuted(!muted);
    };
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(e.target.value, 10);
        setVolume(newVolume);
        if (playerRef.current) playerRef.current.setVolume(newVolume);
        if (newVolume > 0 && isMuted) handleToggleMute();
    };
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        playerRef.current?.seekTo(duration * percent, true);
    };
    const handleSpeedChange = (speed: number) => {
        playerRef.current?.setPlaybackRate(speed);
        setPlaybackRate(speed);
        setSettingsView('main');
    };
    const handleQualityChange = (quality: string) => {
        playerRef.current?.setPlaybackQuality(quality);
        setSettingsView('main');
    };
    const handleFullscreen = () => {
        if (!document.fullscreenElement) playerWrapperRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const date = new Date(seconds * 1000);
        return date.toISOString().substr(date.getUTCHours() > 0 ? 11 : 14, 5);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div ref={playerWrapperRef} onMouseMove={handleMouseMove} onMouseLeave={hideControls}
                 className={`lg:flex-[2] min-w-0 relative bg-black rounded-lg overflow-hidden shadow-2xl ${isFullscreen ? 'fixed inset-0 z-[100]' : 'aspect-video'}`}>
                
                <div id={PLAYER_CONTAINER_ID} className="w-full h-full" />
                
                {(isBuffering || !isPlayerReady) && !playerError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><Loader /></div>
                )}
                
                {playerError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-4 text-center">
                        <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">حدث خطأ في الفيديو</h3>
                        <p className="text-white/80">{playerError}</p>
                        <button onClick={reloadCurrentVideo} className="mt-6 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">إعادة المحاولة</button>
                    </div>
                )}

                <div className={`video-player-overlay ${!areControlsVisible && 'hidden'}`}>
                    <div className="video-player-gradient-bottom"/>
                    <div className="video-player-controls-bar">
                        <div className="custom-player-progress-container" onClick={handleSeek}>
                            <div className="custom-player-buffered-bar" style={{ width: `${(buffered / duration) * 100}%` }} />
                            <div className="custom-player-progress-bar" style={{ width: `${(currentTime / duration) * 100}%` }} />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1 md:gap-2">
                                <button onClick={playPreviousVideo} className="custom-player-btn" disabled={currentPlaylistIndex <= 0}><ChevronDoubleLeftIcon className="w-6 h-6"/></button>
                                <button onClick={handlePlayPause} className="custom-player-btn">{isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}</button>
                                <button onClick={playNextVideo} className="custom-player-btn" disabled={currentPlaylistIndex >= playlist.length - 1}><ChevronDoubleRightIcon className="w-6 h-6"/></button>
                                <div className="relative">
                                    <button onClick={() => setVolumeSliderVisible(p => !p)} className="custom-player-btn">
                                        {isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6"/> : <SpeakerphoneIcon className="w-6 h-6"/>}
                                    </button>
                                    {isVolumeSliderVisible && (
                                        <div className="volume-slider-container fade-in">
                                            <input type="range" min="0" max="100" value={isMuted ? 0 : volume} className="vertical-slider" onChange={handleVolumeChange}/>
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm font-mono tracking-tighter text-white/90 hidden md:block">{formatTime(currentTime)} / {formatTime(duration)}</div>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                                <div className="text-sm font-mono tracking-tighter text-white/90 md:hidden">{formatTime(currentTime)}</div>
                                <div className="relative">
                                    <button onClick={() => setIsSettingsMenuOpen(p => !p)} className="custom-player-btn"><CogIcon className="w-6 h-6"/></button>
                                </div>
                                <button onClick={handleFullscreen} className="custom-player-btn"><ArrowsExpandIcon className="w-6 h-6"/></button>
                            </div>
                        </div>
                    </div>

                    {isSettingsMenuOpen && (
                        <div className="settings-menu" onMouseLeave={() => {setIsSettingsMenuOpen(false); setSettingsView('main');}}>
                            <div className="relative w-full h-full overflow-hidden">
                                 {/* Main View */}
                                <div className="settings-menu-view" style={{ transform: settingsView === 'main' ? 'translateX(0)' : 'translateX(-100%)' }}>
                                    {availableQualities.length > 0 && (
                                        <button onClick={() => setSettingsView('quality')} className="settings-menu-item">
                                            <span>الجودة</span>
                                            <span className="value">{qualityLabelMap[currentQuality] || currentQuality} &rsaquo;</span>
                                        </button>
                                    )}
                                    <button onClick={() => setSettingsView('speed')} className="settings-menu-item">
                                        <span>السرعة</span>
                                        <span className="value">{playbackRate === 1 ? 'عادي' : `${playbackRate}x`} &rsaquo;</span>
                                    </button>
                                </div>
                                {/* Speed View */}
                                <div className="settings-menu-view absolute top-0 left-0 w-full" style={{ transform: settingsView === 'speed' ? 'translateX(0)' : 'translateX(100%)' }}>
                                    <div className="settings-menu-header"><button onClick={() => setSettingsView('main')}><ChevronLeftIcon className="w-5 h-5 ml-2"/></button> السرعة</div>
                                    {speedOptions.map(s => <button key={s} onClick={() => handleSpeedChange(s)} className={`settings-menu-item ${playbackRate === s ? 'active' : ''}`}>{playbackRate === s && <CheckIcon className="w-4 h-4"/>}<span>{s === 1 ? 'عادي' : `${s}x`}</span></button>)}
                                </div>
                                 {/* Quality View */}
                                <div className="settings-menu-view absolute top-0 left-0 w-full" style={{ transform: settingsView === 'quality' ? 'translateX(0)' : 'translateX(100%)' }}>
                                    <div className="settings-menu-header"><button onClick={() => setSettingsView('main')}><ChevronLeftIcon className="w-5 h-5 ml-2"/></button> الجودة</div>
                                    {(availableQualities || []).map(q => (
                                        <button key={q} onClick={() => handleQualityChange(q)} className={`settings-menu-item ${currentQuality === q ? 'active' : ''}`}>
                                            {currentQuality === q && <CheckIcon className="w-4 h-4"/>}
                                            <span>{qualityLabelMap[q] || q}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {!isFullscreen && (
                <div className="lg:flex-[1] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg h-96 lg:h-auto lg:max-h-[calc(100vh - 200px)] flex flex-col">
                    <h3 className="text-lg font-bold p-4 border-b border-[var(--border-primary)] text-[var(--text-primary)] flex-shrink-0">الدروس في هذه الوحدة</h3>
                    <div ref={playlistRef} className="overflow-y-auto flex-grow">
                        {playlist.map((item, index) => (
                            <div ref={item.id === currentLesson.id ? activeItemRef : null} key={item.id} onClick={() => playVideoByIndex(index)}
                                className={`flex items-center p-3 border-b border-[var(--border-primary)] transition-all duration-200 cursor-pointer hover:bg-[var(--bg-tertiary)] ${item.id === currentLesson.id ? 'bg-[var(--bg-secondary)] border-r-4 border-[var(--accent-primary)]' : ''}`}>
                                <span className="font-mono text-sm text-[var(--text-secondary)] ml-3">{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm truncate ${item.id === currentLesson.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{item.title}</p>
                                </div>
                                {item.id === currentLesson.id && isPlaying && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-auto flex-shrink-0"/>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomYouTubePlayer;
