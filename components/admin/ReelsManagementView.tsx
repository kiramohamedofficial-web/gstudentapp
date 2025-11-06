import React, { useState, useEffect, useCallback } from 'react';
import { Reel, ToastType } from '../../types';
import { getAllReels, addReel, updateReel, deleteReel } from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Loader from '../common/Loader';

const parseYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const ReelCard: React.FC<{ reel: Reel; onEdit: () => void; onDelete: () => void; }> = ({ reel, onEdit, onDelete }) => {
    const videoId = parseYouTubeVideoId(reel.youtubeUrl);
    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png';

    return (
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] flex flex-col overflow-hidden">
            <img src={thumbnailUrl} alt={reel.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{reel.title}</h3>
                <p className={`text-xs font-semibold rounded-full px-2 py-0.5 mt-2 self-start ${reel.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {reel.isPublished ? 'منشور' : 'مسودة'}
                </p>
                <div className="flex justify-end gap-2 mt-auto pt-4">
                    <button onClick={onEdit} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-md"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button type="button" onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-purple-600' : 'bg-[var(--bg-tertiary)]'}`} role="switch" aria-checked={enabled}>
        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}/>
    </button>
);

const ReelModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: Partial<Omit<Reel, 'id' | 'createdAt'>>) => void; reel: Partial<Reel> | null; }> = ({ isOpen, onClose, onSave, reel }) => {
    const [formData, setFormData] = useState<Partial<Omit<Reel, 'id' | 'createdAt'>>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(reel?.id ? reel : { isPublished: true });
        }
    }, [reel, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={reel?.id ? 'تعديل الريل' : 'إضافة ريل جديد'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <input type="text" name="title" placeholder="عنوان الريل" value={formData.title || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" required />
                <input type="text" name="youtubeUrl" placeholder="رابط فيديو اليوتيوب (Shorts)" value={formData.youtubeUrl || ''} onChange={handleChange} className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md" required />
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <label className="font-semibold text-[var(--text-primary)]">نشر الريل للطلاب</label>
                    <ToggleSwitch enabled={formData.isPublished ?? true} onChange={val => setFormData(p => ({...p, isPublished: val}))} />
                </div>
                
                <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button></div>
            </form>
        </Modal>
    );
};

const ReelsManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [reels, setReels] = useState<Reel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: {} });

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await getAllReels();
            setReels(data);
            setIsLoading(false);
        };
        fetchData();
    }, [dataVersion]);

    const openModal = (type: string, data = {}) => setModalState({ type, data });
    const closeModal = () => setModalState({ type: null, data: {} });

    const handleSave = async (data: Partial<Omit<Reel, 'id' | 'createdAt'>>) => {
        try {
            if (modalState.data.id) { // Editing
                const { error } = await updateReel(modalState.data.id, data);
                if (error) throw error;
                addToast("تم تحديث الريل بنجاح.", ToastType.SUCCESS);
            } else { // Adding
                const { error } = await addReel(data);
                if (error) throw error;
                addToast("تم إضافة الريل بنجاح.", ToastType.SUCCESS);
            }
            refreshData();
            closeModal();
        } catch(error: any) {
            addToast(`فشل حفظ الريل: ${error.message}`, ToastType.ERROR);
        }
    };

    const handleDelete = async () => {
        const { data } = modalState;
        try {
            await deleteReel(data.id);
            addToast("تم حذف الريل بنجاح.", ToastType.SUCCESS);
            refreshData();
            closeModal();
        } catch(error: any) {
            addToast(`حدث خطأ: ${error.message}`, ToastType.ERROR);
        }
    };

    return (
        <div className="fade-in">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الريلز</h1>
                    <p className="text-[var(--text-secondary)] mt-1">التحكم في فيديوهات الريلز القصيرة المعروضة للطلاب.</p>
                </div>
                <button 
                    onClick={() => openModal('add')} 
                    className="flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5"/> 
                    <span>إضافة ريل جديد</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20"><Loader /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {reels.map(reel => (
                        <ReelCard key={reel.id} reel={reel} onEdit={() => openModal('edit', reel)} onDelete={() => openModal('delete', reel)} />
                    ))}
                </div>
            )}
            
            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <ReelModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSave}
                    reel={modalState.data}
                />
            )}
            
            {modalState.type === 'delete' && (
                <Modal isOpen={true} onClose={closeModal} title="تأكيد الحذف">
                    <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد من رغبتك في حذف ريل "{modalState.data.title}"؟</p>
                    <div className="flex justify-end space-x-3 space-x-reverse">
                        <button onClick={closeModal} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                        <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، قم بالحذف</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ReelsManagementView;
