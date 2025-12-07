// app/chat/page.tsx

"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    route?: "metrics" | "semantic";
};

type ChatResponse = {
    route: "metrics" | "semantic";
    answer: string;
};

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: ChatMessage = {
            id: uuidv4(),
            role: "user",
            content: text,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: text,
                    // history: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const json = (await res.json()) as ChatResponse & { error?: string };

            if (json.error) {
                const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: "assistant",
                content: `Error: ${json.error}`,
                };
                setMessages((prev) => [...prev, errorMsg]);
            } else {
                const assistantMsg: ChatMessage = {
                id: uuidv4(),
                role: "assistant",
                content: json.answer,
                route: json.route,
                };
                setMessages((prev) => [...prev, assistantMsg]);
            }
        } catch (err: any) {
            const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: "assistant",
                content: "Error: failed to contact the chat API.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            <h1 className="text-2xl font-bold mb-4">SupportWise Chat</h1>

            {/* Chat window */}
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-sm text-slate-500">
                        Ask anything about your support tickets, for example:
                        <ul className="list-disc list-inside mt-2">
                        <li>“How many tickets did we get last week?”</li>
                        <li>“Why are refund tickets spiking this month?”</li>
                        <li>“What are the main complaints about login issues?”</li>
                        </ul>
                    </div>
                )}
                {messages.map((m) => (
                <div
                    key={m.id}
                    className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                    <div
                    className={`max-w-xl rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                        m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-slate-900 rounded-bl-sm"
                    }`}
                    >
                    {m.role === "assistant" && m.route && (
                        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
                        [{m.route}]
                        </div>
                    )}
                    {m.content}
                    </div>
                </div>
                ))}
            </div>

            {/* Input area */}
            <div className="mt-4 flex gap-3 items-center">
                <input
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your question about tickets…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                    }
                }}
                />
                <button
                onClick={sendMessage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                {loading ? "Thinking…" : "Send"}
                </button>
            </div>
        </div>   
    );
}