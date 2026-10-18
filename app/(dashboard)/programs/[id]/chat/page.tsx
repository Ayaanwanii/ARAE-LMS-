/**
 * Program Chat Page
 * Real-time discussion for program participants
 */

'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChatMessages, useSendMessage } from '@/lib/hooks/useChat';
import { useHasJoinedProgram } from '@/lib/hooks/usePrograms';
import { getRelativeTime } from '@/lib/utils/date';
import Button from '@/components/ui/Button';

import { toast } from '@/lib/stores/toastStore';
import { Filter } from 'bad-words';

// Initialize filter instance
const filter = new Filter();

export default function ProgramChatPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user, profile } = useAuth();
    const { data: hasJoined, isLoading: joinLoading } = useHasJoinedProgram(id);
    const { messages, loading } = useChatMessages(hasJoined ? id : '');
    const sendMessage = useSendMessage();
    const [newMessage, setNewMessage] = useState('');
    const [lastSent, setLastSent] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Rate Limiting (2 seconds)
        const now = Date.now();
        if (now - lastSent < 2000) {
            toast.warning('Please wait a moment before sending another message.');
            return;
        }

        // Profanity Filter
        if (filter.isProfane(newMessage)) {
            toast.error('Please keep the discussion respectful. inappropriate language is not allowed.');
            return;
        }

        try {
            await sendMessage.mutateAsync({
                programId: id,
                message: newMessage.trim(),
            });
            setNewMessage('');
            setLastSent(now);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        }
    };

    if (joinLoading || (hasJoined && loading)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
            </div>
        );
    }

    if (!hasJoined) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 transition-colors">
                <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl dark:border dark:border-slate-800/60 p-8 rounded-xl shadow-md dark:shadow-2xl dark:shadow-black/30 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4.118-2.882A5.002 5.002 0 0014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647zM12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">
                        You must join this program to participate in the discussion.
                    </p>
                    <Button onClick={() => window.history.back()} fullWidth>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl shadow-sm dark:shadow-black/20 border-b border-gray-200 dark:border-slate-800/60 p-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Program Discussion</h1>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-slate-500 py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="mt-2">No messages yet</p>
                        <p className="text-sm dark:text-slate-600">Be the first to start the discussion!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.userRef === user?.uid;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                                    {!isOwn && (
                                        <div className="flex items-center gap-2 mb-1">
                                            {msg.userImage ? (
                                                <img src={msg.userImage} alt={msg.userName} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="w-6 h-6 bg-gray-300 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs text-white">
                                                    {msg.userName?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{msg.userName}</span>
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${isOwn
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                            : 'bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-slate-200'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.message}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 px-2">
                                        {getRelativeTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl border-t border-gray-200 dark:border-slate-800/60 p-4">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-colors"
                    />
                    <Button type="submit" isLoading={sendMessage.isPending} disabled={!newMessage.trim()}>
                        Send
                    </Button>
                </form>
            </div>
        </div>
    );
}
