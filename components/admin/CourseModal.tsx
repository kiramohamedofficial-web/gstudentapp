import React, { useState, useEffect } from 'react';
import { Course, CourseVideo, Teacher, ToastType } from '../../types';
import { createCourse, updateCourse } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import ImageUpload from '../common/ImageUpload';
import { PlusIcon, PencilIcon, TrashIcon, VideoCameraIcon } from '../common/Icons';
import VideoModal from './VideoModal';

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    course: Course | null;
    teachers: Teacher[];
}

const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, onSave, course, teachers }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Course>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isVidoModalOpen, setIsVideoModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<{ video: CourseVideo, index: number } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(course || { isFree: false, price: 0, videos: [] });
        }
    }, [course, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked, price: checked ? 0 : prev.price }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSave = async () => {
        if (!formData.title || !formData.teacherId) {
            addToast('الرجاء ملء العنوان واختيار المدرس.', ToastType.ERROR);
            return;
        }

        setIsSaving(true);
        try {
            if (course) { // Editing
                const { error } = await updateCourse(course.id, formData);
                if (error) throw error;
                addToast('تم تحديث الكورس بنجاح!', ToastType.SUCCESS);
            } else { // Creating
                const { error } = await createCourse(formData as Omit<Course, 'id'>);
                 if (error) throw error;
                addToast('تم إنشاء الكورس بنجاح!', ToastType.SUCCESS);
            }
            onSave();
        } catch (error: any) {
            addToast(`حدث خطأ: ${error.message}`, ToastType.ERROR);
        } finally {
            setIsSaving(false);
        }
    };

    const handleVideoSave = (video: CourseVideo) => {
        setFormData(prev => {
            const videos = [...(prev.videos || [])];
            if (editingVideo) {
                videos[editingVideo.index] = video;
            } else {
                videos.push(video);
            }
            return { ...prev, videos };
        });
        setIsVideoModalOpen(false);
        setEditingVideo(null);
    };

    const handleVideoDelete = (index: number) => {
        setFormData(prev => {
            const videos = [...(prev.videos || [])];
            videos.splice(index, 1);
            return { ...prev, videos };
        });
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={course ? 'تعديل الكورس' : 'إضافة كورس جديد'}>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
                    <input type="text" name="title" placeholder="عنوان الكورس" value={formData.title || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" required />
                    <textarea name="description" placeholder="وصف الكورس" value={formData.description || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" rows={3}></textarea>
                    <select name="teacherId" value={formData.teacherId || ''} onChange={handleChange} required className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md">
                        <option value="">-- اختر المدرس --</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ImageUpload label="صورة الغلاف" value={formData.coverImage || ''} onChange={value => setFormData(prev => ({...prev, coverImage: value}))} />
                    <input type="text" name="pdfUrl" placeholder="رابط ملف PDF (اختياري)" value={formData.pdfUrl || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" />
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-[var(--border-primary)]">
                         <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} className="h-4 w-4 rounded text-purple-600" />
                            <span className="ml-2 text-[var(--text-secondary)]">كورس مجاني</span>
                        </label>
                        {!formData.isFree && (
                             <div className="relative flex-1">
                                <input type="number" name="price" placeholder="السعر" value={formData.price} onChange={handleChange} className="w-full p-2 pr-10 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]">ج.م</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4 border-t border-[var(--border-primary)]">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-lg">فيديوهات الكورس</h3>
                            <button type="button" onClick={() => { setEditingVideo(null); setIsVideoModalOpen(true); }} className="flex items-center gap-1 text-sm text-purple-400 font-semibold"><PlusIcon className="w-4 h-4"/> إضافة فيديو</button>
                        </div>
                        <div className="space-y-2">
                            {(formData.videos || []).map((video, index) => (
                                <div key={video.id || index} className="flex items-center justify-between p-2 bg-[var(--bg-tertiary)] rounded-md">
                                    <div className="flex items-center gap-2">
                                        <VideoCameraIcon className="w-5 h-5 text-[var(--text-secondary)]"/>
                                        <span className="text-sm">{video.title}</span>
                                        {video.isFree && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">مجاني</span>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => { setEditingVideo({video, index}); setIsVideoModalOpen(true); }} className="p-1 text-[var(--text-secondary)] hover:text-yellow-400"><PencilIcon className="w-4 h-4"/></button>
                                        <button type="button" onClick={() => handleVideoDelete(index)} className="p-1 text-[var(--text-secondary)] hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                             {(formData.videos || []).length === 0 && (
                                <p className="text-center text-sm text-[var(--text-secondary)] py-4">لم يتم إضافة فيديوهات بعد.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t border-[var(--border-primary)]">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-60">
                        {isSaving ? 'جاري الحفظ...' : 'حفظ الكورس'}
                    </button>
                </div>
            </Modal>
            
            <VideoModal
                isOpen={isVidoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                onSave={handleVideoSave}
                video={editingVideo?.video || null}
            />
        </>
    );
};

export default CourseModal;
