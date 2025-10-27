import React, { useState, useEffect } from 'react';
import { useToast } from '../../useToast';
import { ToastType } from '../../types';
import { PhotoIcon } from './Icons';

interface ImageUploadProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange }) => {
    const { addToast } = useToast();
    const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
    const [urlInput, setUrlInput] = useState('');

    useEffect(() => {
        // If the initial value is a URL, set the component state accordingly.
        if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
            setUploadType('url');
            setUrlInput(value);
        } else {
            setUploadType('file');
            setUrlInput('');
        }
    }, []); // Run only once on mount to set initial state based on value


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                addToast('حجم الصورة يجب ألا يتجاوز 2 ميجابايت.', ToastType.ERROR);
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setUrlInput(newUrl);
        // Basic validation before setting the value
        if (newUrl.startsWith('http://') || newUrl.startsWith('https://')) {
            onChange(newUrl);
        } else if (newUrl === '') {
            onChange('');
        }
    };
    
    const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-purple-600 text-white' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-4">
                <div className="flex items-center gap-4">
                    {value ? (
                        <img src={value} alt="معاينة" className="w-20 h-20 object-cover rounded-md border border-[var(--border-primary)] flex-shrink-0" />
                    ) : (
                        <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-md flex items-center justify-center border border-dashed border-[var(--border-primary)] flex-shrink-0">
                            <PhotoIcon className="w-8 h-8 text-[var(--text-secondary)]" />
                        </div>
                    )}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                            <TabButton active={uploadType === 'file'} onClick={() => setUploadType('file')}>رفع ملف</TabButton>
                            <TabButton active={uploadType === 'url'} onClick={() => setUploadType('url')}>استخدام رابط</TabButton>
                        </div>
                        {uploadType === 'file' ? (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                        ) : (
                            <input
                                type="url"
                                placeholder="https://example.com/image.png"
                                value={urlInput}
                                onChange={handleUrlChange}
                                className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
