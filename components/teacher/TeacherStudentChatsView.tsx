
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
    lastMessage: TeacherChatMessage;
}

const ChatModal: React.FC<{ conversation: Conversation | null; teacher: Teacher; teacherId: string; onClose: () => void; }> = ({ conversation, teacher, teacherId, onClose }) => {
    const [messages, setMessages] = useState<TeacherChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async () => {
        if (!conversation) return;
        setIsLoading(true);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('teacher_chats')
            .select('*')
            .eq('student_id', conversation.student.id)
            .eq('teacher_id', teacher.id)
            .gte('created_at', threeDaysAgo)
            .order('created_at', { ascending: true });
        
        if (data) setMessages(data);
        setIsLoading(false);
    }, [conversation, teacher.id]);

    useEffect(() => {
        fetchMessages();
        if (!conversation) return;
        
        const channel = supabase
            .channel(`teacher-chat-teacher-${conversation.student.id}-${teacher.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'teacher_chats',
                filter: `student_id=eq.${conversation.student.id},teacher_id=eq.${teacher.id}`
            }, payload => {
                setMessages(prev => [...prev, payload.new as TeacherChatMessage]);
            })
            .subscribe();
        
        return () => { supabase.removeChannel(channel); };
    }, [fetchMessages, conversation, teacher.id]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;
        const messageData = {
            student_id: conversation.student.id,
            teacher_id: teacher.id,
            sender_id: teacherId,
            content: newMessage.trim(),
        };
        await supabase.from('teacher_chats').insert(messageData);
        setNewMessage('');
    };
    
    if (!conversation) return null;

    return (
        <Modal isOpen={true} onClose={onClose} title={`محادثة مع ${conversation.student.name}`}>
            <div className="flex flex-col h-[70vh] bg-[var(--bg-primary)] -m-4 sm:-m-6">
                 <header className="flex-shrink-0 p-3 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-secondary)]">
                    <p className="font-semibold text-sm">طالب في: {conversation.student.gradeData?.name || 'غير محدد'}</p>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full"><XIcon className="w-5 h-5"/></button>
                 </header>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {isLoading && <div className="flex justify-center items-center h-full"><Loader /></div>}
                    {!isLoading && messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2.5 ${msg.sender_id === teacherId ? 'justify-end' : 'justify-start'}`}>
                             {msg.sender_id !== teacherId && <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>}
                            <div className={`max-w-md p-3 px-4 rounded-2xl ${msg.sender_id === teacherId ? 'bg-purple-600 text-white rounded-br-lg' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-lg'}`}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1.5 text-right">{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                 <footer className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اكتب ردك..." className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full focus:ring-2 focus:ring-purple-500 transition-all" />
                        <button type="submit" className="w-12 h-12 flex-shrink-0 bg-purple-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 disabled:bg-gray-500 disabled:scale-100" disabled={!newMessage.trim()}>
                            <PaperAirplaneIcon className="w-6 h-6"/>
                        </button>
                    </form>
                </footer>
            </div>
        </Modal>
    );
};

interface TeacherStudentChatsViewProps {
    teacher: Teacher;
    teacherId: string;
}

const TeacherStudentChatsView: React.FC<TeacherStudentChatsViewProps> = ({ teacher, teacherId }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: messages, error } = await supabase
            .from('teacher_chats')
            .select('*')
            .eq('teacher_id', teacher.id)
            .gte('created_at', threeDaysAgo)
            .order('created_at', { ascending: false });

        if (error || !messages) {
            setIsLoading(false);
            return;
        }

        const studentIds = [...new Set(messages.map(m => m.student_id))];
        const { data: studentsData } = await supabase.from('profiles').select('*, gradeData:grades(*)').in('id', studentIds);
        
        const studentsMap = new Map<string, User>(studentsData?.map(s => [s.id, {
            id: s.id, name: s.name, email: s.email, phone: s.phone,
            guardianPhone: s.guardian_phone, grade: s.grade_id, track: s.track,
            role: s.role, subscriptionId: s.subscription_id, teacherId: s.teacher_id,
            gradeData: s.gradeData
        }]));

        const convos: Record<string, Conversation> = {};
        for (const msg of messages) {
            const studentId = msg.student_id;
            if (!convos[studentId]) {
                const student = studentsMap.get(studentId);
                if (student) {
                    convos[studentId] = { student, lastMessage: msg };
                }
            }
        }
        setConversations(Object.values(convos));
        setIsLoading(false);
    }, [teacher.id]);

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel(`teacher-chats-for-${teacher.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'teacher_chats',
                filter: `teacher_id=eq.${teacher.id}`
            }, payload => {
                fetchData();
            })
            .subscribe();
        
        return () => { supabase.removeChannel(channel); };
    }, [fetchData, teacher.id]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">رسائل الطلاب</h1>
            {isLoading ? (
                <div className="flex justify-center p-10"><Loader /></div>
            ) : conversations.length > 0 ? (
                <div className="space-y-4">
                    {conversations.map(convo => (
                        <button key={convo.student.id} onClick={() => setSelectedConversation(convo)} className="w-full text-right bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)] flex justify-between items-center transition-all duration-300 transform hover:scale-105 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{convo.student.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold text-lg">{convo.student.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-1 max-w-md">
                                        <span className={`font-semibold ${convo.lastMessage.sender_id !== teacherId ? 'text-purple-400' : 'text-[var(--text-secondary)]'}`}>
                                            {convo.lastMessage.sender_id !== teacherId ? 'الطالب: ' : 'أنت: '}
                                        </span>
                                        {convo.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-[var(--text-secondary)] mb-2">{new Date(convo.lastMessage.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                                {convo.lastMessage.sender_id !== teacherId && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
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
            
            {selectedConversation && (
                <ChatModal conversation={selectedConversation} teacher={teacher} teacherId={teacherId} onClose={() => setSelectedConversation(null)} />
            )}
        </div>
    );
};

export default TeacherStudentChatsView;
