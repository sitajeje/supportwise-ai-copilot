"use client";
// app/agent/page.tsx

import { useState } from "react";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

const SUGGESTED_PROMPTS = [
    "What are the main support issues this week?",
    "What should the support team prioritize right now?",
    "Why are customers frustrated about login issues?",
    "Summarize the current support workload using available evidence.",
];

function createMessage(role: "user" | "assistant", content: string): Message {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content,
    };
}

export default function AgentPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function submitMessage(preset?: string) {
        const content = (preset ?? input).trim();

        if (!content || loading) {
        return;
        }

        const userMessage = createMessage("user", content);

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
        const response = await fetch("/api/agent/ask", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            message: content,
            }),
        });

        const data = await response.json();

        const assistantMessage = createMessage(
            "assistant",
            data.answer || data.error || "No answer generated."
        );

        setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            const errorMessage = createMessage(
                "assistant",
                "Error: failed to contact the AI Analyst API."
            );

            setMessages((prev) => [...prev, errorMessage]);
            } finally {
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
            SupportWise AI Analyst
            </h1>
            <p className="mt-3 text-sm text-slate-600">
            Ask operational questions in natural language. The agent can combine
            semantic ticket search and analytics tools before answering.
            </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
            {SUGGESTED_PROMPTS.map((prompt) => (
            <button
                key={prompt}
                type="button"
                onClick={() => submitMessage(prompt)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
                {prompt}
            </button>
            ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 max-h-[520px] space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Start with a suggested prompt or ask your own support analytics
                question.
                </div>
            )}

            {messages.map((message) => (
                <div
                key={message.id}
                className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${
                    message.role === "user"
                    ? "ml-auto max-w-[80%] bg-slate-900 text-white"
                    : "mr-auto max-w-[85%] bg-slate-100 text-slate-900"
                }`}
                >
                {message.content}
                </div>
            ))}
            </div>

            <div className="flex gap-3">
            <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage();
                }
                }}
                rows={3}
                placeholder="Ask a support operations question..."
                className="min-h-[88px] flex-1 rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
            />
            <button
                type="button"
                onClick={() => submitMessage()}
                disabled={loading}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
                {loading ? "Thinking..." : "Ask AI Analyst"}
            </button>
            </div>
        </div>
        </main>
    );
}
