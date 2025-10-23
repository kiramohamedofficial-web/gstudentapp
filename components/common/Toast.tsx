
import React from 'react';
import { useToast } from '../../useToast';
import { ToastMessage, ToastType } from '../../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from './Icons';

const toastIcons: Record<ToastType, React.FC<{className?: string}>> = {
    [ToastType.SUCCESS]: CheckCircleIcon,
    [ToastType.ERROR]: XCircleIcon,
    [ToastType.INFO]: InformationCircleIcon,
};

const toastStyles: Record<ToastType, string> = {
    [ToastType.SUCCESS]: 'bg-green-500/80 text-white',
    [ToastType.ERROR]: 'bg-red-500/80 text-white',
    [ToastType.INFO]: 'bg-blue-500/80 text-white',
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const Icon = toastIcons[toast.type];

    return (
        <div className={`toast-item ${toastStyles[toast.type]}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="mr-3 ml-3 flex-1 text-right">
                    <p className="text-sm font-semibold">{toast.message}</p>
                </div>
                <div className="flex-shrink-0 flex">
                    <button onClick={() => onDismiss(toast.id)} className="inline-flex rounded-md text-white/70 hover:text-white focus:outline-none">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};