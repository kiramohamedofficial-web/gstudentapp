import React from 'react';
import { Notification, StudentView } from '../../types';
import { CreditCardIcon, XIcon, BellIcon, DocumentTextIcon, CheckBadgeIcon } from '../common/Icons';

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNavigate: (view: StudentView) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'subscription':
            return <CreditCardIcon className="w-5 h-5 text-white" />;
        case 'content':
            return <DocumentTextIcon className="w-5 h-5 text-white" />;
        default:
            return <BellIcon className="w-5 h-5 text-white" />;
    }
};

const iconBgClassMap: Record<Notification['type'], string> = {
    subscription: 'icon-subscription',
    content: 'icon-content',
    general: 'icon-general',
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
    interval = seconds / 2592000;
    if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
    interval = seconds / 86400;
    if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
    interval = seconds / 3600;
    if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
    interval = seconds / 60;
    if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
    return 'الآن';
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigate,
}) => {

    const handleItemClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            onNavigate(notification.link.view);
        }
        onClose();
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notifications-panel glass-effect fade-in-up">
            <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">الإشعارات</h3>
                <div className="flex items-center gap-4">
                    {unreadCount > 0 && (
                        <button onClick={onMarkAllAsRead} className="flex items-center space-x-1 space-x-reverse text-sm text-[var(--text-accent)] hover:underline">
                            <CheckBadgeIcon className="w-5 h-5"/>
                            <span>تحديد الكل كمقروء</span>
                        </button>
                    )}
                </div>
            </header>
            
            <div className="flex-grow overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div 
                            key={notification.id} 
                            className={`notification-item group ${!notification.isRead ? 'notification-item-unread' : 'notification-item-read'}`}
                        >
                            <div 
                                className="relative flex-1 min-w-0 cursor-pointer flex gap-3 items-start"
                                onClick={() => handleItemClick(notification)}
                            >
                                <div className={`notification-item-icon ${iconBgClassMap[notification.type]}`}>
                                    <NotificationIcon type={notification.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-[var(--text-primary)]">{notification.title}</p>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">{notification.message}</p>
                                    <p className="text-xs text-[var(--text-secondary)]/70 mt-2">{formatTimeAgo(notification.createdAt)}</p>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }} 
                                className="absolute top-2 left-2 p-1.5 rounded-full text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                                aria-label="حذف الإشعار"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[var(--text-secondary)]">
                        <BellIcon className="w-20 h-20 text-[var(--border-primary)] notification-empty-icon mb-4" />
                        <p className="font-semibold text-lg text-[var(--text-primary)]">لا توجد إشعارات</p>
                        <p className="max-w-xs mx-auto">ستظهر التحديثات المهمة والرسائل هنا.</p>
                    </div>
                )}
            </div>
             <footer className="p-2 border-t border-[var(--border-primary)] text-center flex-shrink-0">
                <button onClick={onClose} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full py-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors">
                    إغلاق
                </button>
            </footer>
        </div>
    );
};

export default NotificationsPanel;