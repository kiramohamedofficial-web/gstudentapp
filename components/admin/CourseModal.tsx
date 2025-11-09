

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
    
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.teacherId) {
            addToast('الرجاء ملء العنوان واختيار المدرس.', ToastType.ERROR);
            return;
        }

        setIsSaving(true);
        try {
            if (course) { // Editing
                const result = await updateCourse(course.id, formData);
                if ((result as any).error) throw (result as any).error;
                addToast('تم تحديث الكورس بنجاح!', ToastType.SUCCESS);
            } else { // Creating
                const result = await createCourse(formData as Omit<Course, 'id'>);
                 if ((result as any).error) throw (result as any).error;
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
            <Modal isOpen={isOpen} onClose={onClose} title={course ? 'تعديل الكورس' : 'إضافة كورس جديد'} maxWidth="max-w-4xl">
                <form onSubmit={handleFormSubmit}>
                    <div className="max-h-[65vh] overflow-y-auto p-1 -m-1 pr-2 -mr-2">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                            {/* Left Column */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)] space-y-4">
                                    <h3 className="font-semibold text-lg">المعلومات الأساسية</h3>
                                    <input type="text" name="title" placeholder="عنوان الكورس" value={formData.title || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" required />
                                    <textarea name="description" placeholder="وصف الكورس" value={formData.description || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" rows={3}></textarea>
                                    <select name="teacherId" value={formData.teacherId || ''} onChange={handleChange} required className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md">
                                        <option value="">-- اختر المدرس --</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)] space-y-4">
                                    <h3 className="font-semibold text-lg">التسعير</h3>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-white/5">
                                            <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} className="h-4 w-4 rounded text-purple-600" />
                                            <span className="mr-2 text-sm text-[var(--text-secondary)]">كورس مجاني</span>
                                        </label>
                                        {!formData.isFree && (
                                            <div className="relative flex-1">
                                                <input type="number" name="price" placeholder="السعر" value={formData.price} onChange={handleChange} className="w-full p-2 pr-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]">ج.م</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                                     <h3 className="font-semibold text-lg">المرفقات</h3>
                                     <input type="text" name="pdfUrl" placeholder="رابط ملف PDF (اختياري)" value={formData.pdfUrl || ''} onChange={handleChange} className="w-full p-2 mt-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                                    <h3 className="font-semibold text-lg mb-2">صورة الغلاف</h3>
                                    <ImageUpload label="" value={formData.coverImage || ''} onChange={value => setFormData(prev => ({...prev, coverImage: value}))} />
                                </div>

                                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-lg">فيديوهات الكورس</h3>
                                        <button type="button" onClick={() => { setEditingVideo(null); setIsVideoModalOpen(true); }} className="flex items-center gap-1 text-sm text-purple-400 font-semibold"><PlusIcon className="w-4 h-4"/> إضافة</button>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {(formData.videos || []).map((video, index) => (
                                            <div key={video.id || index} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-md">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <VideoCameraIcon className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0"/>
                                                    <span className="text-sm truncate">{video.title}</span>
                                                    {video.isFree && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full flex-shrink-0">مجاني</span>}
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
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

                        </div>
                    </div>
                    <div className="flex justify-end pt-4 mt-4 border-t border-[var(--border-primary)]">
                        <button type="submit" disabled={isSaving} className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-60">
                            {isSaving ? 'جاري الحفظ...' : 'حفظ الكورس'}
                        </button>
                    </div>
                </form>
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