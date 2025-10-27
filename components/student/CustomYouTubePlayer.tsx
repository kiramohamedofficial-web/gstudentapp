import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, ArrowsExpandIcon, CogIcon } from '../common/Icons';
import Loader from '../common/Loader';

// Global promise to load YouTube API script only once
let youtubeApiPromise: Promise<void> | null = null;
const loadYouTubeApi = (): Promise<void> => {
    if (youtubeApiPromise) {
        return youtubeApiPromise;
    }

    youtubeApiPromise = new Promise((resolve) => {
        // If API is already ready, resolve immediately.
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }

        // If the script is already being loaded, just add our resolver to the callback queue.
        if (window.onYouTubeIframeAPIReadyCallbacks) {
            window.onYouTubeIframeAPIReadyCallbacks.push(resolve);
            return;
        }

        // Otherwise, we are the first to load the script.
        window.onYouTubeIframeAPIReadyCallbacks = [resolve];
        window.onYouTubeIframeAPIReady = () => {
            window.onYouTubeIframeAPIReadyCallbacks?.forEach(cb => cb());
            // Clear the callbacks after they've been called.
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
    const timeString = date.toISOString().substring(14, 19);
    // For videos less than 10 minutes, show m:ss, for more, show mm:ss
    const durationInMinutes = (seconds || 0) / 60;
    if (durationInMinutes < 10 && timeString.startsWith('0')) {
        return timeString.substring(1);
    }
    return timeString;
};

const qualityLabels: Record<string, string> = {
  highres: 'High Res',
  hd2880: '4K',
  hd2160: '4K',
  hd1440: '1440p HD',
  hd1080: '1080p HD',
  hd720: '720p HD',
  large: '480p',
  medium: '360p',
  small: '240p',
  tiny: '144p',
  auto: 'تلقائي',
};
const getQualityLabel = (quality: string) => qualityLabels[quality] || quality.toUpperCase();


interface CustomYouTubePlayerProps {
    videoId: string;
    onLessonComplete: (videoId: string) => void;
    onAutoPlayNext: () => void;
}

const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({ videoId, onLessonComplete, onAutoPlayNext }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null); // Stable container for the YT player
    const qualityMenuRef = useRef<HTMLDivElement>(null);
    const qualityButtonRef = useRef<HTMLButtonElement>(null);
    const hideControlsTimeoutRef = useRef<number | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [availableQualities, setAvailableQualities] = useState<string[]>([]);
    const [currentQuality, setCurrentQuality] = useState<string>('auto');
    const [isQualityMenuOpen, setQualityMenuOpen] = useState(false);

    const onLessonCompleteRef = useRef(onLessonComplete);
    useEffect(() => { onLessonCompleteRef.current = onLessonComplete; }, [onLessonComplete]);

    const onAutoPlayNextRef = useRef(onAutoPlayNext);
    useEffect(() => { onAutoPlayNextRef.current = onAutoPlayNext; }, [onAutoPlayNext]);

    const hideControls = useCallback(() => {
        if (isPlaying && !isQualityMenuOpen) {
            if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
            hideControlsTimeoutRef.current = window.setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying, isQualityMenuOpen]);

    useEffect(() => {
        if (!playerContainerRef.current) return;

        // Manually create the div that the YouTube API will replace.
        // This isolates it from React's VDOM and prevents issues on re-render.
        const playerDiv = document.createElement('div');
        playerContainerRef.current.innerHTML = ''; // Clean up previous player
        playerContainerRef.current.appendChild(playerDiv);

        let progressInterval: number;
        let qualityLevelsLoaded = false;

        loadYouTubeApi().then(() => {
            // Ensure the container and div still exist (e.g., component hasn't unmounted)
            if (!playerContainerRef.current?.contains(playerDiv)) return;
            
            const playerInstance = new window.YT.Player(playerDiv, {
                videoId,
                playerVars: {
                    playsinline: 1, controls: 0, rel: 0, iv_load_policy: 3, modestbranding: 1, autoplay: 1
                },
                events: {
                    onReady: (event: any) => {
                        setIsReady(true);
                        setDuration(event.target.getDuration());
                        setCurrentQuality(event.target.getPlaybackQuality());
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        const playerState = event.data;
                        const isPlayingNow = playerState === window.YT.PlayerState.PLAYING;
                        setIsPlaying(isPlayingNow);

                        if (isPlayingNow && !qualityLevelsLoaded) {
                            const qualities = event.target.getAvailableQualityLevels();
                            if (qualities && qualities.length > 0) {
                                setAvailableQualities(['auto', ...qualities]);
                                qualityLevelsLoaded = true;
                            }
                        }
                        
                        if (playerState === window.YT.PlayerState.ENDED) {
                            onLessonCompleteRef.current(videoId);
                        }
                    },
                    onPlaybackQualityChange: (event: any) => {
                        setCurrentQuality(event.data);
                    }
                },
            });
            playerRef.current = playerInstance;

            progressInterval = window.setInterval(() => {
                if (playerInstance && typeof playerInstance.getCurrentTime === 'function') {
                    setCurrentTime(playerInstance.getCurrentTime());
                }
            }, 250);
        });

        return () => {
            clearInterval(progressInterval);
            playerRef.current?.destroy();
            if (playerContainerRef.current) {
                playerContainerRef.current.innerHTML = '';
            }
        };
    }, [videoId]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node) &&
                qualityButtonRef.current && !qualityButtonRef.current.contains(event.target as Node)
            ) {
                setQualityMenuOpen(false);
            }
        };
        if (isQualityMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isQualityMenuOpen]);

    useEffect(() => {
        if (isQualityMenuOpen) {
            if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
        } else {
            hideControls();
        }
    }, [isQualityMenuOpen, hideControls]);

    const handleMouseMove = () => {
        setShowControls(true);
        hideControls();
    };

    const handlePlayPause = () => playerRef.current?.getPlayerState() === 1 ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo();
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        playerRef.current?.seekTo(time, true);
    };
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (isMuted) setIsMuted(false);
        playerRef.current?.setVolume(newVolume * 100);
    };
    const handleMute = () => {
        if (isMuted) {
            playerRef.current?.unMute();
        } else {
            playerRef.current?.mute();
        }
        setIsMuted(!isMuted);
    };
    const handleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current?.requestFullscreen();
        }
    };
    const handleSetQuality = useCallback((quality: string) => {
        const player = playerRef.current;
        if (player && typeof player.getCurrentTime === 'function' && typeof player.seekTo === 'function') {
            const currentTime = player.getCurrentTime();
            player.setPlaybackQuality(quality);
            player.seekTo(currentTime, true);
        }
        setQualityMenuOpen(false);
    }, []);
    
    useEffect(() => {
        if (isPlaying) hideControls();
        else if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    }, [isPlaying, hideControls]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return (
        <div ref={containerRef} className="yt-player-container" onMouseMove={handleMouseMove} onMouseLeave={hideControls}>
            {/* This div is the stable mount point for the YouTube player */}
            <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" />

            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader />
                </div>
            )}
            
            <div className="yt-click-shield" onDoubleClick={handleFullscreen} onClick={handlePlayPause}></div>

            {!isPlaying && isReady && (
                <button className="yt-center-play-button" onClick={handlePlayPause}>
                    <PlayIcon className="w-10 h-10 text-white pl-1" />
                </button>
            )}

            <div className={`yt-controls-overlay ${showControls || !isPlaying || isQualityMenuOpen ? 'visible' : ''}`}>
                <div className="yt-controls-bar">
                    <input
                        type="range"
                        className="yt-progress-bar"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ background: `linear-gradient(to right, var(--accent-primary) ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)` }}
                    />
                    <div className="yt-bottom-controls">
                        <div className="flex items-center gap-4">
                            <button onClick={handlePlayPause} className="yt-control-button">
                                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                            </button>
                            <div className="yt-volume-container">
                                <button onClick={handleMute} className="yt-control-button">
                                    {isMuted || volume === 0 ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
                                </button>
                                <input
                                    type="range"
                                    className="yt-volume-slider"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                />
                            </div>
                        </div>
                        <span className="yt-time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        <div className="flex items-center gap-2">
                             <div className="relative">
                                {isQualityMenuOpen && availableQualities.length > 1 && (
                                    <div ref={qualityMenuRef} className="yt-quality-menu fade-in-up">
                                        {availableQualities.map(q => (
                                            <button 
                                                key={q} 
                                                className={`yt-quality-item ${currentQuality === q ? 'active' : ''}`}
                                                onClick={() => handleSetQuality(q)}
                                            >
                                                {getQualityLabel(q)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {availableQualities.length > 1 && (
                                    <button ref={qualityButtonRef} onClick={() => setQualityMenuOpen(p => !p)} className="yt-control-button text-sm font-semibold">
                                        <span>{getQualityLabel(currentQuality)}</span>
                                        <CogIcon className="w-5 h-5" />
                                    </button>
                                )}
                             </div>
                             <button onClick={handleFullscreen} className="yt-control-button">
                                <ArrowsExpandIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomYouTubePlayer;
