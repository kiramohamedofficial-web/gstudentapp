
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FeaturedTeacher, Course, Book, ToastType } from '../../types';
import { 
    getFeaturedTeachers, addFeaturedTeacher, updateFeaturedTeacher, deleteFeaturedTeacher,
    getFeaturedCourses, addFeaturedCourse, updateFeaturedCourse, deleteFeaturedCourse,
    getFeaturedBooks, addFeaturedBook, updateFeaturedBook, deleteFeaturedBook
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon } from '../common/Icons';
import { useToast } from '../../useToast';

const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-700 transition-colors">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">تأكيد الحذف</button>
        </div>
    </Modal>
);

const FormInput: React.FC<{label: string, id: string, type?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, id, type="text", value, onChange}) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input id={id} type={type} value={value} onChange={onChange} required className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500" />
    </div>
)

const HomeManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: {} });
    const [formData, setFormData] = useState<any>({});

    const teachers = useMemo(() => getFeaturedTeachers(), [dataVersion]);
    const courses = useMemo(() => getFeaturedCourses(), [dataVersion]);
    const books = useMemo(() => getFeaturedBooks(), [dataVersion]);

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
    
    const openModal = (type: string, data = {}) => {
        setFormData(data);
        setModalState({ type, data });
    };
    const closeModal = () => {
        setModalState({ type: null, data: {} });
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData((prev: any) => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
    };

    // Generic Handlers
    const handleSave = () => {
        const { type, data } = modalState;
        switch(type) {
            case 'edit-teacher': updateFeaturedTeacher({ ...data, ...formData }); break;
            case 'add-teacher': addFeaturedTeacher(formData); break;
            case 'edit-course': updateFeaturedCourse({ ...data, ...formData }); break;
            case 'add-course': addFeaturedCourse(formData); break;
            case 'edit-book': updateFeaturedBook({ ...data, ...formData }); break;
            case 'add-book': addFeaturedBook(formData); break;
        }
        addToast('تم حفظ التغييرات بنجاح', ToastType.SUCCESS);
        refreshData();
        closeModal();
    };

    const handleDelete = () => {
        const { type, data } = modalState;
         switch(type) {
            case 'delete-teacher': deleteFeaturedTeacher(data.id); break;
            case 'delete-course': deleteFeaturedCourse(data.id); break;
            case 'delete-book': deleteFeaturedBook(data.id); break;
        }
        addToast('تم الحذف بنجاح', ToastType.SUCCESS);
        refreshData();
        closeModal();
    };


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الصفحة الرئيسية</h1>
            
            {/* Featured Teachers Section */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">المدرسون المميزون</h2>
                    <button onClick={() => openModal('add-teacher')} className="flex items-center text-sm px-3 py-2 bg-cyan-600/80 hover:bg-cyan-600 rounded-md text-white transition-colors">
                        <PlusIcon className="w-5 h-5 ml-1"/> إضافة مدرس
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-[var(--border-primary)] text-sm text-[var(--text-secondary)]">
                                <th className="p-2">الصورة</th>
                                <th className="p-2">الاسم</th>
                                <th className="p-2">المادة</th>
                                <th className="p-2 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                <tr key={t.id} className="border-b border-[var(--border-primary)]/50">
                                    <td className="p-2"><img src={t.imageUrl} alt={t.name} className="w-12 h-12 rounded-full object-cover"/></td>
                                    <td className="p-2 font-semibold">{t.name}</td>
                                    <td className="p-2 text-[var(--text-secondary)]">{t.subject}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => openModal('edit-teacher', t)} className="text-yellow-400 hover:text-yellow-300 p-1"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('delete-teacher', t)} className="text-red-400 hover:text-red-300 p-1 mr-2"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Featured Courses Section */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">الكورسات المميزة</h2>
                    <button onClick={() => openModal('add-course')} className="flex items-center text-sm px-3 py-2 bg-cyan-600/80 hover:bg-cyan-600 rounded-md text-white transition-colors">
                        <PlusIcon className="w-5 h-5 ml-1"/> إضافة كورس
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-[var(--border-primary)] text-sm text-[var(--text-secondary)]">
                                <th className="p-2">الغلاف</th>
                                <th className="p-2">العنوان</th>
                                <th className="p-2">العنوان الفرعي</th>
                                <th className="p-2 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map(c => (
                                <tr key={c.id} className="border-b border-[var(--border-primary)]/50">
                                    <td className="p-2"><img src={c.coverImage} alt={c.title} className="w-24 h-14 rounded-md object-cover"/></td>
                                    <td className="p-2 font-semibold">{c.title}</td>
                                    <td className="p-2 text-[var(--text-secondary)]">{c.subtitle}</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => openModal('edit-course', c)} className="text-yellow-400 hover:text-yellow-300 p-1"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('delete-course', c)} className="text-red-400 hover:text-red-300 p-1 mr-2"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Featured Books Section */}
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">الكتب المميزة</h2>
                    <button onClick={() => openModal('add-book')} className="flex items-center text-sm px-3 py-2 bg-cyan-600/80 hover:bg-cyan-600 rounded-md text-white transition-colors">
                        <PlusIcon className="w-5 h-5 ml-1"/> إضافة كتاب
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-[var(--border-primary)] text-sm text-[var(--text-secondary)]">
                                <th className="p-2">الغلاف</th>
                                <th className="p-2">العنوان</th>
                                <th className="p-2">اسم المدرس</th>
                                <th className="p-2">السعر</th>
                                <th className="p-2 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map(b => (
                                <tr key={b.id} className="border-b border-[var(--border-primary)]/50">
                                    <td className="p-2"><img src={b.coverImage} alt={b.title} className="w-14 h-20 rounded-md object-contain bg-slate-700 p-1"/></td>
                                    <td className="p-2 font-semibold">{b.title}</td>
                                    <td className="p-2 text-[var(--text-secondary)]">{b.teacherName}</td>
                                    <td className="p-2 text-[var(--text-secondary)]">{b.price} ج.م</td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => openModal('edit-book', b)} className="text-yellow-400 hover:text-yellow-300 p-1"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal('delete-book', b)} className="text-red-400 hover:text-red-300 p-1 mr-2"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Modals */}
            <Modal isOpen={['add-teacher', 'edit-teacher'].includes(modalState.type || '')} onClose={closeModal} title={modalState.type === 'add-teacher' ? 'إضافة مدرس جديد' : 'تعديل مدرس'}>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <FormInput label="اسم المدرس" id="name" value={formData.name || ''} onChange={handleFormChange} />
                    <FormInput label="المادة" id="subject" value={formData.subject || ''} onChange={handleFormChange} />
                    <FormInput label="رابط الصورة" id="imageUrl" value={formData.imageUrl || ''} onChange={handleFormChange} />
                    <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">حفظ</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={['add-course', 'edit-course'].includes(modalState.type || '')} onClose={closeModal} title={modalState.type === 'add-course' ? 'إضافة كورس جديد' : 'تعديل كورس'}>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <FormInput label="العنوان" id="title" value={formData.title || ''} onChange={handleFormChange} />
                    <FormInput label="العنوان الفرعي" id="subtitle" value={formData.subtitle || ''} onChange={handleFormChange} />
                    <FormInput label="رابط صورة الغلاف" id="coverImage" value={formData.coverImage || ''} onChange={handleFormChange} />
                    <FormInput label="عدد الملفات" id="fileCount" type="number" value={formData.fileCount ?? 0} onChange={handleFormChange} />
                    <FormInput label="عدد الفيديوهات" id="videoCount" type="number" value={formData.videoCount ?? 0} onChange={handleFormChange} />
                    <FormInput label="عدد الاختبارات" id="quizCount" type="number" value={formData.quizCount ?? 0} onChange={handleFormChange} />
                    <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">حفظ</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={['add-book', 'edit-book'].includes(modalState.type || '')} onClose={closeModal} title={modalState.type === 'add-book' ? 'إضافة كتاب جديد' : 'تعديل كتاب'}>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <FormInput label="العنوان" id="title" value={formData.title || ''} onChange={handleFormChange} />
                    <FormInput label="اسم المدرس" id="teacherName" value={formData.teacherName || ''} onChange={handleFormChange} />
                    <FormInput label="رابط صورة المدرس" id="teacherImage" value={formData.teacherImage || ''} onChange={handleFormChange} />
                    <FormInput label="رابط صورة الغلاف" id="coverImage" value={formData.coverImage || ''} onChange={handleFormChange} />
                    <FormInput label="السعر" id="price" type="number" value={formData.price ?? 0} onChange={handleFormChange} />
                    <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700">حفظ</button></div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={modalState.type?.startsWith('delete-') || false}
                onClose={closeModal}
                onConfirm={handleDelete}
                title="تأكيد الحذف"
                message={`هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.`}
            />
        </div>
    );
};

export default HomeManagementView;
