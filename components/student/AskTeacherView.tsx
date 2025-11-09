
// NEW FILE
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../../hooks/useSession';
import { useSubscription } from '../../hooks/useSubscription';
import { getAllTeachers, supabase } from '../../services/storageService';
import { Teacher, ToastType, User } from '../../types';
import { ArrowRightIcon, InformationCircleIcon, PaperAirplaneIcon } from '../common/Icons';
import Loader from '../common/Loader';
import { useToast } from '../../useToast';

interface TeacherChatMessage {
  id: string;
  created_at: string;
  student_id: string;
  teacher_id: string;
  sender_id: string;
  content: string;
}

const TeacherChatView: React.FC<{ student: User, teacher: Teacher, onBack: () => void }> = ({ student, teacher, onBack }) => {
    const [messages, setMessages] = useState<TeacherChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const fetchMessages = useCallback(async () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('teacher_chats')
            .select('*')
            .eq('student_id', student.id)
            .eq('teacher_id', teacher.id)
            .gte('created_at', threeDaysAgo)
            .order('created_at', { ascending: true });
        
        if (data) setMessages(data as TeacherChatMessage[]);
        setIsLoading(false);
    }, [student.id, teacher.id]);

    useEffect(() => {
        fetchMessages();
        const channel = supabase
            .channel(`teacher-chat-${student.id}-${teacher.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'teacher_chats',
                filter: `student_id=eq.${student.id},teacher_id=eq.${teacher.id}`
            }, payload => {
                const newMessage = payload.new as TeacherChatMessage;
                setMessages(prev => {
                    if (newMessage.sender_id === student.id) {
                        const tempMessageIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.content === newMessage.content);
                        if (tempMessageIndex > -1) {
                            const newMessages = [...prev];
                            newMessages[tempMessageIndex] = newMessage;
                            return newMessages;
                        }
                    }
                    if (!prev.some(m => m.id === newMessage.id)) {
                        return [...prev, newMessage];
                    }
                    return prev;
                });
            })
            .subscribe();
        
        return () => { supabase.removeChannel(channel); };
    }, [fetchMessages, student.id, teacher.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content) return;

        const optimisticMessage: TeacherChatMessage = {
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            student_id: student.id,
            teacher_id: teacher.id,
            sender_id: student.id,
            content: content,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        const { error } = await supabase.from('teacher_chats').insert({
            student_id: student.id,
            teacher_id: teacher.id,
            sender_id: student.id,
            content: content,
        });
        
        if (error) {
            addToast('فشل إرسال الرسالة.', ToastType.ERROR);
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(content);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)]">
            <header className="flex-shrink-0 p-3 border-b border-[var(--border-primary)] flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full"><ArrowRightIcon className="w-6 h-6"/></button>
                <img src={teacher.imageUrl} alt={teacher.name} className="w-11 h-11 rounded-full object-cover" />
                <div>
                    <h2 className="font-bold text-lg text-[var(--text-primary)]">{teacher.name}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{teacher.subject}</p>
                </div>
            </header>
            
            <div className="p-3 bg-blue-900/20 text-blue-200 text-xs flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                <p>هذه محادثة مؤقتة، سيتم حذف جميع الرسائل تلقائيًا بعد 3 أيام لضمان خصوصيتك.</p>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto bg-[var(--bg-primary)]">
                {isLoading && <div className="flex justify-center items-center h-full"><Loader /></div>}
                {!isLoading && messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${msg.sender_id === student.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender_id !== student.id && <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex-shrink-0"></div>}
                        <div className={`max-w-xl p-3 px-4 rounded-2xl ${msg.sender_id === student.id ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-lg'}`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1.5 text-left">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
                 <div ref={chatEndRef} />
            </div>
            
            <footer className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full focus:ring-2 focus:ring-purple-500 transition-all" />
                    <button type="submit" className="w-12 h-12 flex-shrink-0 bg-purple-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 disabled:bg-gray-500 disabled:scale-100" disabled={!newMessage.trim()}>
                        <PaperAirplaneIcon className="w-6 h-6"/>
                    </button>
                </form>
            </footer>
        </div>
    );
};


const AskTeacherView: React.FC = () => {
    const { currentUser } = useSession();
    const { activeSubscriptions, isComprehensive } = useSubscription();
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    useEffect(() => {
        getAllTeachers().then(data => {
            setAllTeachers(data);
            setIsLoading(false);
        });
    }, []);

    const subscribedTeachers = useMemo(() => {
        if (isComprehensive) {
            return allTeachers;
        }
        const subscribedIds = new Set(activeSubscriptions.map(s => s.teacherId).filter(Boolean));
        return allTeachers.filter(t => subscribedIds.has(t.id));
    }, [activeSubscriptions, allTeachers, isComprehensive]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }
    
    if (selectedTeacher && currentUser) {
        return <div className="h-full -m-4 md:-m-6"><TeacherChatView student={currentUser} teacher={selectedTeacher} onBack={() => setSelectedTeacher(null)} /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">اسأل مدرسك</h1>
            <p className="text-[var(--text-secondary)] mb-8">اختر أحد مدرسيك المشترك معهم لبدء محادثة خاصة.</p>
            
            {subscribedTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscribedTeachers.map(teacher => (
                        <button key={teacher.id} onClick={() => setSelectedTeacher(teacher)} className="w-full text-right bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)] flex items-center gap-4 transition-all duration-300 transform hover:scale-105 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 group">
                            <img src={teacher.imageUrl} alt={teacher.name} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-secondary)] group-hover:border-purple-400 transition-colors" />
                            <div>
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{teacher.name}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{teacher.subject}</p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                    <InformationCircleIcon className="w-12 h-12 mx-auto text-[var(--text-secondary)] opacity-30 mb-4"/>
                    <p className="text-[var(--text-secondary)]">يجب أن تكون مشتركاً مع مدرس على الأقل لاستخدام هذه الميزة.</p>
                </div>
            )}
        </div>
    );
};

export default AskTeacherView;