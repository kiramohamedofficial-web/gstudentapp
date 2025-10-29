import React, { useState, useEffect } from 'react';
import { CourseVideo } from '../../types';
import Modal from '../common/Modal';

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (video: CourseVideo) => void;
    video: CourseVideo | null;
}

const parseYouTubeVideoId = (url: any): string | null => {
    if (typeof url !== 'string' || !url) return null;
    // This regex should handle standard, short, and embed URLs
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    
    if (match) {
        return match[1];
    }

    // Check if the input is already a valid 11-character ID
    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }

    return null;
};

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, onSave, video }) => {
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isFree, setIsFree] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(video?.title || '');
            setVideoUrl(video?.videoUrl || '');
            setIsFree(video?.isFree || false);
            setError('');
        }
    }, [video, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('عنوان الفيديو مطلوب.');
            return;
        }

        const videoId = parseYouTubeVideoId(videoUrl);
        if (!videoId) {
            setError('رابط يوتيوب غير صالح. الرجاء استخدام رابط الفيديو الكامل أو معرف الفيديو.');
            return;
        }

        onSave({
            id: video?.id || `v-${Date.now()}`,
            title,
            videoUrl, // Save the full URL
            isFree,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={video ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="عنوان الفيديو" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required />
                <input type="text" placeholder="رابط يوتيوب" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required />
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="h-4 w-4 rounded text-purple-600" />
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">فيديو مجاني (يمكن مشاهدته قبل شراء الكورس)</span>
                </label>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">
                        حفظ الفيديو
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default VideoModal;
