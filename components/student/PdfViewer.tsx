import React from 'react';
import { ArrowRightIcon } from '../common/Icons';

interface PdfViewerProps {
    pdfUrl: string;
    title: string;
    onBack: () => void;
}

const getEmbedUrl = (url: string): string | null => {
    const regex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return null; // Return null if it's not a valid Google Drive file URL
};

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, title, onBack }) => {
    const embedUrl = getEmbedUrl(pdfUrl);

    return (
        <div className="h-full w-full flex flex-col bg-[var(--bg-secondary)]">
            <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-[var(--border-primary)]">
                <h1 className="text-lg font-bold truncate">{title}</h1>
                <button 
                    onClick={onBack} 
                    className="flex items-center space-x-2 space-x-reverse text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                    <span>العودة</span>
                </button>
            </header>
            <div className="flex-grow">
                {embedUrl ? (
                    <iframe 
                        src={embedUrl}
                        className="w-full h-full border-0"
                        allow="fullscreen"
                        title={title}
                    ></iframe>
                ) : (
                    <div className="flex items-center justify-center h-full text-center p-8">
                        <p className="text-red-500">
                            رابط الملف غير صالح. يرجى التأكد من أنه رابط ملف Google Drive صالح.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfViewer;
