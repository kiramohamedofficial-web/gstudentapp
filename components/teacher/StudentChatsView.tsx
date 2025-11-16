
// NEW FILE
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Teacher, User, ToastType } from '../../types';
import { supabase } from '../../services/storageService';
import { useToast } from '../../useToast';
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, XIcon, ArrowRightIcon } from '../common/Icons';
import Loader from '../common/Loader';
import Modal from '../common/Modal';

interface TeacherChatMessage {
  id: string;
  created_at: string;
  student_id: string;
  teacher_id: string;
  sender_id: string;
  content: string;
}

interface Conversation {
    student: User;
    teacher: Teacher;
    lastMessage: TeacherChatMessage;
}

const SupervisorChatInterface: React.FC<{ conversation: Conversation; supervisorId: string; onBack: () => void; }> = ({ conversation, supervisorId, onBack }) => {
    const [messages, setMessages] = useState<TeacherChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    const fetchMessages = useCallback(async () => {
        if (!conversation) return;
        setIsLoading(true);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('teacher_chats')
            .select('*')
            .eq('student_id', conversation.student.id)
            .eq('teacher_id', conversation.teacher.id)
            .gte('created_at', threeDaysAgo)
            .order('created_at', { ascending: true });
        
        if (data) setMessages(data);
        setIsLoading(false);
    }, [conversation]);

    useEffect(() => {
        fetchMessages();
        if (!conversation) return;
        
        const channel = supabase
            .channel(`teacher-chat-supervisor-${conversation.student.id}-${conversation.teacher.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'teacher_chats',
                filter: `student_id=eq.${conversation.student.id},teacher_id=eq.${conversation.teacher.id}`
            }, payload => {
                const newMessage = payload.new as TeacherChatMessage;
                setMessages(prev => {
                    if (newMessage.sender_id === supervisorId) {
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
    }, [fetchMessages, conversation, supervisorId]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !conversation) return;

        const optimisticMessage: TeacherChatMessage = {
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            student_id: conversation.student.id,
            teacher_id: conversation.teacher.id,
            sender_id: supervisorId,
            content: content,
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        const { error } = await supabase.from('teacher_chats').insert({
            student_id: conversation.student.id,
            teacher_id: conversation.teacher.id,
            sender_id: supervisorId,
            content: content,
        });

        if (error) {
            addToast('فشل إرسال الرسالة.', ToastType.ERROR);
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(content);
        }
    };
    
    return (
        <div className="h-full flex flex-col bg-[var(--bg-secondary)] sm:rounded-2xl shadow-lg border border-[var(--border-primary)]">
             <header className="flex-shrink-0 p-3 border-b border-[var(--border-primary)] flex justify-between items-center sm:rounded-t-2xl">
                <div>
                    <p className="font-bold text-lg">محادثة: {conversation.student.name}</p>
                    <p className="font-semibold text-sm text-[var(--text-secondary)]">بخصوص: {conversation.teacher.name}</p>
                </div>
                <button onClick={onBack} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full"><ArrowRightIcon className="w-6 h-6"/></button>
             </header>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[var(--bg-primary)]">
                {isLoading && <div className="flex justify-center items-center h-full"><Loader /></div>}
                {!isLoading && messages.map(msg => {
                    const isSupervisorMsg = msg.sender_id === supervisorId;
                    const isStudentMsg = msg.sender_id === conversation.student.id;
                    const isTeacherMsg = !isSupervisorMsg && !isStudentMsg;

                    return (
                        <div key={msg.id} className={`flex items-end gap-2.5 ${isSupervisorMsg ? 'justify-end' : 'justify-start'} fade-in`}>
                            {!isSupervisorMsg && (
                                 <img 
                                    src={isTeacherMsg ? conversation.teacher.imageUrl : 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png'} 
                                    alt={isTeacherMsg ? conversation.teacher.name : conversation.student.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                                />
                            )}
                            <div className={`max-w-md p-3 px-4 rounded-2xl shadow-sm ${
                                isSupervisorMsg 
                                    ? 'bg-purple-600 text-white rounded-br-none' 
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-none'
                            }`}>
                                 {!isSupervisorMsg && (
                                    <p className={`text-xs font-bold mb-1 ${isTeacherMsg ? 'text-purple-400' : 'text-blue-400'}`}>
                                        {isTeacherMsg ? conversation.teacher.name : conversation.student.name}
                                    </p>
                                )}
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1.5 text-left">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>
             <footer 
                className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] sm:rounded-b-2xl" 
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 1rem))' }}
             >
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اكتب ردك كمشرف..." className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full focus:ring-2 focus:ring-purple-500 transition-all" />
                    <button type="submit" className="w-12 h-12 flex-shrink-0 bg-purple-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 disabled:bg-gray-500 disabled:scale-100" disabled={!newMessage.trim()}>
                        <PaperAirplaneIcon className="w-6 h-6"/>
                    </button>
                </form>
            </footer>
        </div>
    );
};

interface StudentChatsViewProps {
    supervisedTeachers: Teacher[];
    supervisorId: string;
}

const StudentChatsView: React.FC<StudentChatsViewProps> = ({ supervisedTeachers, supervisorId }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const teacherIds = supervisedTeachers.map(t => t.id);
        if (teacherIds.length === 0) {
            setIsLoading(false);
            return;
        }

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: messages, error } = await supabase
            .from('teacher_chats')
            .select('*')
            .in('teacher_id', teacherIds)
            .gte('created_at', threeDaysAgo)
            .order('created_at', { ascending: false });

        if (error || !messages) {
            setIsLoading(false);
            return;
        }

        const studentIds = [...new Set(messages.map(m => m.student_id))];
        const { data: studentsData } = await supabase.from('profiles').select('*').in('id', studentIds);
        
        const studentsMap = new Map<string, User>(studentsData?.map(s => [s.id, {
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            guardianPhone: s.guardian_phone,
            grade: s.grade_id,
            track: s.track,
            role: s.role,
            subscriptionId: s.subscription_id,
            teacherId: s.teacher_id,
        }]));
        const teachersMap: Map<string, Teacher> = new Map<string, Teacher>(supervisedTeachers.map(t => [t.id, t]));

        const convos: Record<string, Conversation> = {};
        for (const msg of messages) {
            const key = `${msg.student_id}-${msg.teacher_id}`;
            if (!convos[key]) {
                const student = studentsMap.get(msg.student_id);
                const teacher = teachersMap.get(msg.teacher_id);
                if (student && teacher) {
                    convos[key] = { student: student, teacher: teacher, lastMessage: msg };
                }
            }
        }
        setConversations(Object.values(convos));
        setIsLoading(false);
    }, [supervisedTeachers]);

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel(`all-teacher-chats`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'teacher_chats',
            }, payload => {
                fetchData();
            })
            .subscribe();
        
        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    if (selectedConversation) {
        return (
            <div className="h-full -m-4 md:-m-6">
                <SupervisorChatInterface
                    conversation={selectedConversation}
                    supervisorId={supervisorId}
                    onBack={() => setSelectedConversation(null)}
                />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">رسائل الطلاب</h1>
            {isLoading ? (
                <div className="flex justify-center p-10"><Loader /></div>
            ) : conversations.length > 0 ? (
                <div className="space-y-4">
                    {conversations.map(convo => (
                        <button key={`${convo.student.id}-${convo.teacher.id}`} onClick={() => setSelectedConversation(convo)} className="w-full text-right bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)] flex justify-between items-center transition-all duration-300 transform hover:scale-105 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{convo.student.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{convo.student.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">يسأل عن: {convo.teacher.name}</p>
                                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-1 max-w-md">
                                        <span className={`font-semibold ${convo.lastMessage.sender_id !== supervisorId ? 'text-purple-400' : 'text-[var(--text-secondary)]'}`}>
                                            {convo.lastMessage.sender_id === supervisorId ? 'أنت: ' : convo.lastMessage.sender_id === convo.student.id ? 'الطالب: ' : 'المدرس: '}
                                        </span>
                                        {convo.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-[var(--text-secondary)] mb-2">{new Date(convo.lastMessage.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                {convo.lastMessage.sender_id !== supervisorId && <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>}
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                    <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-20 mb-4"/>
                    <p className="text-[var(--text-secondary)]">لا توجد رسائل جديدة من الطلاب.</p>
                </div>
            )}
        </div>
    );
};

export default StudentChatsView;
