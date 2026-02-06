
'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Insight {
    id: string;
    query: string;
    insight: string;
    timestamp: string;
}

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    metadata?: {
        memory?: Insight[];
        search?: SearchResult[];
        new_insight?: Insight;
    };
}

export default function ChatInterface() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'searching' | 'processing' | 'learning'>('idle');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setStatus('searching');

        let previousQuestion = undefined;
        if (input.trim().toLowerCase().startsWith("the answer is:")) {
            const userMessages = messages.filter(m => m.role === 'user');
            if (userMessages.length > 0) {
                previousQuestion = userMessages[userMessages.length - 1].content;
            }
        }

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    previousQuestion
                }),
            });

            if (!res.ok) throw new Error('Failed to fetch response');

            const data = await res.json();
            setStatus('processing');

            // Simulate a small delay for "Thinking" effect if needed, but we have real data now
            // Let's transition to learning visualization if a new insight was found
            if (data.context.new_insight) {
                setStatus('learning');
                await new Promise(resolve => setTimeout(resolve, 800)); // Show learning state briefly
            }

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.answer,
                    metadata: data.context
                }
            ]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to my brain." }]);
        } finally {
            setIsLoading(false);
            setStatus('idle');
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Persistent Researcher
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Powered by You.com & AkashML • Learns from every interaction
                    </p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-medium border ${status !== 'idle' ? 'border-green-500/50 text-green-400 bg-green-500/10 animate-pulse' : 'border-gray-700 text-gray-500'
                    }`}>
                    {status === 'idle' && 'Ready'}
                    {status === 'searching' && 'Searching Web...'}
                    {status === 'processing' && 'Thinking...'}
                    {status === 'learning' && 'Saving Insight...'}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 max-w-md">
                            Ask me anything. I search the web, process with AI, and <strong>remember key insights</strong> for next time.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 md:p-6 ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-tr-none'
                            : 'bg-gray-800/50 border border-gray-700 text-gray-100 shadow-xl backdrop-blur-sm rounded-tl-none'
                            }`}>
                            {/* Message Content */}
                            <div className="prose prose-invert prose-sm max-w-none">
                                {msg.content.split('\n').map((line, i) => (
                                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                                ))}
                            </div>

                            {/* Components for Assistant Metadata */}
                            {msg.role === 'assistant' && msg.metadata && (
                                <div className="mt-6 space-y-4 border-t border-gray-700/50 pt-4">

                                    {/* Memory Used */}
                                    {msg.metadata.memory && msg.metadata.memory.length > 0 && (
                                        <div className="text-xs">
                                            <div className="flex items-center gap-2 text-purple-400 font-semibold mb-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                                Recalled from Memory
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.metadata.memory.map((m) => (
                                                    <div key={m.id} className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-2 text-purple-200">
                                                        &quot;{m.insight}&quot;
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sources Used */}
                                    {msg.metadata.search && msg.metadata.search.length > 0 && (
                                        <div className="text-xs">
                                            <div className="flex items-center gap-2 text-blue-400 font-semibold mb-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Sources
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {msg.metadata.search.map((s, i) => (
                                                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                                        className="block truncate hover:text-blue-300 transition-colors bg-blue-900/20 px-2 py-1 rounded border border-blue-800/30">
                                                        {s.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Insight Learned */}
                                    {msg.metadata.new_insight && (
                                        <div className="relative group overflow-hidden rounded-lg bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 p-3 mt-2">
                                            <div className="absolute inset-0 bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                                            <div className="relative flex items-start gap-3">
                                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">New Insight Learned</div>
                                                    <div className="text-emerald-100 text-sm italic">&quot;{msg.metadata.new_insight.insight}&quot;</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>

                        {/* Timestamp/Role Label */}
                        <div className="mt-2 text-xs text-gray-500 px-2">
                            {msg.role === 'user' ? 'You' : 'Persistent Researcher'}
                        </div>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex flex-col items-start animate-fade-in">
                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-gray-400 text-sm">
                                {status === 'searching' && 'Scanning the web...'}
                                {status === 'processing' && 'Synthesizing answer...'}
                                {status === 'learning' && 'Committing to memory...'}
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-2xl opacity-30 blur group-focus-within:opacity-75 transition duration-1000"></div>
                <form onSubmit={handleSubmit} className="relative bg-gray-900 rounded-2xl flex items-center p-2 shadow-2xl ring-1 ring-white/10">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Need help handling Swift concurrency?"
                        className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-4 py-3 text-sm md:text-base"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className={`p-3 rounded-xl transition-all duration-200 ${isLoading || !input.trim()
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-purple-500/30'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Footer / Hint */}
            <div className="text-center mt-4 text-xs text-gray-600">
                Try asking the same question twice to see the memory in action.
            </div>
        </div>
    );
}
