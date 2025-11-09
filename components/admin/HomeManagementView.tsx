import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Book, ToastType, Teacher } from '../../types';
import { 
    getFeaturedCourses, addFeaturedCourse, updateFeaturedCourse, deleteFeaturedCourse,
    getFeaturedBooks, addFeaturedBook, updateFeaturedBook, deleteFeaturedBook, getAllTeachers
} from '../../services/storageService';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon, TrashIcon, BookBookmarkIcon, TemplateIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import ImageUpload from '../common/ImageUpload';

const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">تأكيد الحذف</button>
        </div>
    </Modal>
);

const FormInput: React.FC<{label: string, name: string, type?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, name, type="text", value, onChange}) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
        <input name={name} id={name} type={type} value={value} onChange={onChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-purple-500 focus:border-purple-500" />
    </div>
);

const HomeManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const { addToast } = useToast();
    const [modalState, setModalState] = useState<{ type: string | null; data: any }>({ type: null, data: {} });
    const [formData, setFormData] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'courses' | 'books'>('courses');
    
    const [courses, setCourses] = useState<any[]>([]);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        getFeaturedCourses().then(data => setCourses(data));
        getFeaturedBooks().then(data => setBooks(data as Book[]));
    }, [dataVersion]);
    
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    useEffect(() => {
        const fetchTeachers = async () => {
            const teacherData = await getAllTeachers();
            setTeachers(teacherData);
        };
        fetchTeachers();
    }, [dataVersion]);

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
    
    const openModal = (type: string, data = {}) => {
        setFormData(data);
        setModalState({ type, data });
    };
    const closeModal = () => {
        setModalState({ type: null, data: {} });
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const isNumber = e.target.type === 'number';
        setFormData((prev: any) => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };
     const handleImageChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const { type, data } = modalState;
        switch(type) {
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
            case 'delete-course': deleteFeaturedCourse(data.id); break;
            case 'delete-book': deleteFeaturedBook(data.id); break;
        }
        addToast('تم الحذف بنجاح', ToastType.SUCCESS);
        refreshData();
        closeModal();
    };


    const renderCourses = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
                <div key={course.id} className="bg-[var(--bg-tertiary)] rounded-xl shadow-md border border-[var(--border-primary)] flex flex-col overflow-hidden">
                    <img src={course.coverImage} alt={course.title} className="w-full h-40 object-cover" />
                    <div className="p-4 flex-grow flex flex-col">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{course.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] flex-grow">{course.description}</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => openModal('edit-course', course)} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-md"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => openModal('delete-course', course)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderBooks = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map(book => (
                <div key={book.id} className="bg-[var(--bg-tertiary)] rounded-xl shadow-md border border-[var(--border-primary)] flex flex-col overflow-hidden p-4">
                     <img src={book.coverImage} alt={book.title} className="w-full h-56 object-contain rounded-md mb-4"/>
                     <div className="flex-grow flex flex-col">
                         <h3 className="font-bold text-lg text-[var(--text-primary)]">{book.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] flex-grow">{book.teacherName}</p>
                         <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => openModal('edit-book', book)} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-md"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => openModal('delete-book', book)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                     </div>
                </div>
            ))}
        </div>
    );


    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الصفحة الرئيسية</h1>
                    <p className="text-[var(--text-secondary)] mt-1">التحكم في الكورسات والكتب التي تظهر في صفحة الترحيب.</p>
                </div>
                <button 
                    onClick={() => openModal(activeTab === 'courses' ? 'add-course' : 'add-book')} 
                    className="flex items-center justify-center space-x-2 space-x-reverse px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5"/> 
                    <span>{activeTab === 'courses' ? 'إضافة كورس' : 'إضافة كتاب'}</span>
                </button>
            </div>
            
            <div className="mb-6 border-b border-[var(--border-primary)] flex space-x-4 space-x-reverse">
                <button onClick={() => setActiveTab('courses')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${activeTab === 'courses' ? 'text-purple-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                   <TemplateIcon className="w-5 h-5" /> الكورسات المميزة
                   {activeTab === 'courses' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"></div>}
                </button>
                 <button onClick={() => setActiveTab('books')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${activeTab === 'books' ? 'text-purple-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                   <BookBookmarkIcon className="w-5 h-5" /> الكتب والملازم
                   {activeTab === 'books' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"></div>}
                </button>
            </div>
            
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                {activeTab === 'courses' ? renderCourses() : renderBooks()}
            </div>
            
            <Modal isOpen={['add-course', 'edit-course'].includes(modalState.type || '')} onClose={closeModal} title={modalState.type === 'add-course' ? 'إضافة كورس جديد' : 'تعديل كورس'}>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <FormInput label="العنوان" name="title" value={formData.title || ''} onChange={handleFormChange} />
                    <FormInput label="العنوان الفرعي" name="description" value={formData.description || ''} onChange={handleFormChange} />
                    <div>
                        <label htmlFor="teacherId" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">المدرس</label>
                        <select name="teacherId" id="teacherId" value={formData.teacherId || ''} onChange={handleFormChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-purple-500 focus:border-purple-500">
                            <option value="">اختر المدرس</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <ImageUpload label="صورة الغلاف" value={formData.coverImage || ''} onChange={(value) => handleImageChange('coverImage', value)} />
                    <FormInput label="السعر" name="price" type="number" value={formData.price ?? 0} onChange={handleFormChange} />
                    <div className="grid grid-cols-3 gap-4">
                        <FormInput label="ملفات" name="fileCount" type="number" value={formData.fileCount ?? 0} onChange={handleFormChange} />
                        <FormInput label="فيديوهات" name="videoCount" type="number" value={formData.videoCount ?? 0} onChange={handleFormChange} />
                        <FormInput label="اختبارات" name="quizCount" type="number" value={formData.quizCount ?? 0} onChange={handleFormChange} />
                    </div>
                    <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={['add-book', 'edit-book'].includes(modalState.type || '')} onClose={closeModal} title={modalState.type === 'add-book' ? 'إضافة كتاب جديد' : 'تعديل كتاب'}>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <FormInput label="العنوان" name="title" value={formData.title || ''} onChange={handleFormChange} />
                    <FormInput label="اسم المدرس" name="teacherName" value={formData.teacherName || ''} onChange={handleFormChange} />
                    <ImageUpload label="صورة المدرس" value={formData.teacherImage || ''} onChange={(value) => handleImageChange('teacherImage', value)} />
                    <ImageUpload label="صورة الغلاف" value={formData.coverImage || ''} onChange={(value) => handleImageChange('coverImage', value)} />
                    <FormInput label="السعر" name="price" type="number" value={formData.price ?? 0} onChange={handleFormChange} />
                    <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ</button></div>
                </form>
            </Modal>

            <ConfirmationModal isOpen={modalState.type?.startsWith('delete-') || false} onClose={closeModal} onConfirm={handleDelete} title="تأكيد الحذف" message={`هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.`}/>
        </div>
    );
};

export default HomeManagementView;