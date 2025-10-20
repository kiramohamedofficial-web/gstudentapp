import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, ArrowsExpandIcon } from '../common/Icons';
import Loader from '../common/Loader';

// Global promise to load YouTube API script only once
let youtubeApiPromise: Promise<void> | null = null;
const loadYouTubeApi = (): Promise<void> => {
    if (youtubeApiPromise) return youtubeApiPromise;
    youtubeApiPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) return resolve();
        
        // Handle cases where the script is already on the page but API is not yet ready
        if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
             const interval = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
            return;
        }
        
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
             if(window.onYouTubeIframeAPIReadyCallbacks) {
                window.onYouTubeIframeAPIReadyCallbacks.forEach(cb => cb());
             }
             resolve();
        };

        if (!window.onYouTubeIframeAPIReadyCallbacks) {
            window.onYouTubeIframeAPIReadyCallbacks = [];
        }
        window.onYouTubeIframeAPIReadyCallbacks.push(resolve);
    });
    return youtubeApiPromise;
};

const formatTime = (seconds: number): string => {
    const date = new Date(0);
    date.setSeconds(seconds || 0);
    const timeString = date.toISOString().substring(14, 19);
    return timeString.startsWith('0') ? timeString.substring(1) : timeString;
};

interface CustomYouTubePlayerProps {
    videoId: string;
    onLessonComplete: (videoId: string) => void;
    onAutoPlayNext: () => void;
}

const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({ videoId, onLessonComplete, onAutoPlayNext }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLInputElement>(null);
    const hideControlsTimeoutRef = useRef<number | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const onLessonCompleteRef = useRef(onLessonComplete);
    useEffect(() => { onLessonCompleteRef.current = onLessonComplete; }, [onLessonComplete]);

    const onAutoPlayNextRef = useRef(onAutoPlayNext);
    useEffect(() => { onAutoPlayNextRef.current = onAutoPlayNext; }, [onAutoPlayNext]);

    useEffect(() => {
        let playerInstance: any;
        let progressInterval: number;

        loadYouTubeApi().then(() => {
            if (!containerRef.current) return;
            const playerContainerId = `yt-player-${videoId}`;
            if (!document.getElementById(playerContainerId)) {
                const div = document.createElement('div');
                div.id = playerContainerId;
                containerRef.current.insertBefore(div, containerRef.current.firstChild);
            }
            
            playerInstance = new window.YT.Player(playerContainerId, {
                videoId,
                playerVars: {
                    playsinline: 1,
                    controls: 0,
                    rel: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    autoplay: 1
                },
                events: {
                    onReady: (event: any) => {
                        setIsReady(true);
                        setDuration(event.target.getDuration());
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        const playerState = event.data;
                        setIsPlaying(playerState === window.YT.PlayerState.PLAYING);
                        if (playerState === window.YT.PlayerState.ENDED) {
                            onLessonCompleteRef.current(videoId);
                            onAutoPlayNextRef.current();
                        }
                    },
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
        };
    }, [videoId]);

    const hideControls = useCallback(() => {
        if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }, []);

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
    
    useEffect(() => {
        if (isPlaying) hideControls();
    }, [isPlaying, hideControls]);

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return (
        <div ref={containerRef} className="yt-player-container" onMouseMove={handleMouseMove} onMouseLeave={() => setShowControls(false)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader />
                </div>
            )}

            {!isPlaying && isReady && (
                <button className="yt-center-play-button" onClick={handlePlayPause}>
                    <PlayIcon className="w-10 h-10 text-white pl-2" />
                </button>
            )}

            <div className={`yt-controls-overlay ${showControls || !isPlaying ? 'visible' : ''}`}>
                <div className="yt-controls-bar">
                    <input
                        ref={progressRef}
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
                        <div className="flex items-center">
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