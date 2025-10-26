import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, Subscription, ChatMessage, StudentView } from '../../types';
import { getChatUsage, incrementChatUsage } from '../../services/storageService';
import { getChatbotResponseStream, ChatMode } from '../../services/geminiService';
import { CreditCardIcon, BrainIcon, ChevronUpIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import { useSession } from '../../hooks/useSession';
import { useSubscription } from '../../hooks/useSubscription';

const LockedChatView: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[var(--bg-secondary)] rounded-2xl">
        <BrainIcon className="w-20 h-20 text-[var(--text-secondary)] opacity-30 mb-6" />
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">المساعد الذكي</h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md">
            هذه الميزة متاحة للمشتركين فقط. قم بتفعيل اشتراكك للوصول إلى المساعد الذكي وطرح أسئلتك والحصول على إجابات فورية.
        </p>
        <button onClick={onNavigate} className="flex items-center justify-center group px-6 py-3 font-bold text-white bg-[var(--accent-primary)] rounded-lg transition-transform transform hover:scale-105">
            <span>اذهب لصفحة الاشتراك</span>
            <CreditCardIcon className="w-5 h-5 mr-2" />
        </button>
    </div>
);

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    <BrainIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
            )}
            <div className={`max-w-xl p-4 rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-lg'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-end gap-3 justify-start">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
            <BrainIcon className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div className="max-w-xl p-4 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-lg">
            <div className="flex items-center space-x-1 space-x-reverse">
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse"></span>
            </div>
        </div>
    </div>
);


const ChatbotView: React.FC<{ onNavigate: (view: StudentView) => void }> = ({ onNavigate }) => {
    const { currentUser: user } = useSession();
    const { subscription } = useSubscription();
    const { addToast } = useToast();
    
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'model', content: 'أهلاً بك! أنا مساعد Gstudent الذكي. كيف يمكنني مساعدتك في دراستك اليوم؟' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<ChatMode>('normal');
    const [remaining, setRemaining] = useState(50);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const hasActiveSubscription = useMemo(() => {
        if (!subscription || subscription.status !== 'Active') return false;
        return new Date(subscription.endDate) >= new Date();
    }, [subscription]);

    useEffect(() => {
        if (user) {
            const usage = getChatUsage(user.id);
            setRemaining(usage.remaining);
        }
    }, [user]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || isLoading || !user) return;
        if (remaining <= 0) {
            addToast('لقد وصلت إلى الحد الأقصى للرسائل اليومية (50 رسالة).', 'error');
            return;
        }

        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        incrementChatUsage(user.id);
        setRemaining(prev => prev - 1);

        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));
        
        const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: '' };
        setMessages(prev => [...prev, modelMessage]);

        try {
            const stream = await getChatbotResponseStream(history, userMessage.content, mode);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse } : m));
            }
        } catch (error: any) {
            setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, content: `عذراً، حدث خطأ: ${error.message}` } : m));
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, remaining, addToast, user, messages, mode]);
    
    if (!user) return null;

    if (!hasActiveSubscription) {
        return <LockedChatView onNavigate={() => onNavigate('subscription')} />;
    }

    return (
        <div className="h-full flex flex-col bg-[var(--bg-secondary)] rounded-2xl overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-3"><BrainIcon className="w-6 h-6 text-purple-400"/> المساعد الذكي</h1>
                <div className="text-sm font-semibold text-[var(--text-secondary)]">الرسائل المتبقية: <span className="text-purple-400 font-bold">{remaining}</span></div>
            </header>
            
            {/* Mode Toggles */}
            <div className="flex-shrink-0 p-3 bg-[var(--bg-tertiary)]/50 flex justify-center gap-2">
                {(Object.keys({normal: 'متوازن', fast: 'سريع', thinking: 'عميق'}) as ChatMode[]).map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === m ? 'bg-purple-600 text-white shadow-md' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
                        { {normal: 'متوازن', fast: 'سريع', thinking: 'عميق'}[m] }
                    </button>
                ))}
            </div>

            {/* Chat Body */}
            <div ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
                {isLoading && <TypingIndicator />}
            </div>

            {/* Input Form */}
            <div className="flex-shrink-0 p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder="اكتب سؤالك هنا..."
                        rows={1}
                        className="w-full p-3 resize-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-500 placeholder:text-[var(--text-secondary)]"
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-purple-600 text-white rounded-lg disabled:bg-gray-500 transition-colors">
                        <ChevronUpIcon className="w-6 h-6"/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotView;
