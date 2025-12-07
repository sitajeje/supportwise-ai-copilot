// app/search/page.tsx

"use client";

import { useState } from "react";

type TicketResult = {
    id: string;
    ticket_id: string;
    subject: string;
    description: string;
    similarity: number;
};

type InsightsResponse = {
    query: string;
    matches: TicketResult[];
    summary: string;
};

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [data, setData] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleSearch() {
        if (!query.trim()) return;

        setLoading(true);
        setErrorMsg(null);
        setData(null);

        try {
            const res = await fetch("../../api/search/insights", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, k: 5 }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Request failed");
            }

            const json = (await res.json()) as InsightsResponse;
            setData(json);

        } catch (err: any) {
            setErrorMsg(err.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-4xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold mb-2">
                    SupportWise – Semantic Search & AI Insights
                </h1>
                <p className="text-sm text-slate-600 mb-6">
                    Ask a question about your support workload (e.g. “Why are refund
                    tickets spiking this month?”) and let the system retrieve similar
                    tickets plus an AI-generated summary.
                </p>

                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-3">
                    <input
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your question about tickets…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? "Thinking…" : "Ask SupportWise"}
                    </button>
                </div>
                {errorMsg && (
                    <div className="mb-4 text-sm text-red-600">
                        Error: {errorMsg}
                    </div>
                )}

                {data && (
                    <div className="space-y-6">
                        {/* AI Summary block */}
                        <section className="bg-white rounded-xl shadow-sm p-4">
                            <h2 className="text-lg font-semibold mb-2">
                                AI Insights
                            </h2>
                            <p className="text-xs text-slate-500 mb-3">
                                User query: <span className="italic">“{data.query}”</span>
                            </p>
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-800">
                                {data.summary}
                            </div>
                        </section>

                        {/* Raw tickets block */}
                        <section className="bg-white rounded-xl shadow-sm p-4">
                            <h2 className="text-lg font-semibold mb-2">
                                Retrieved Tickets (Top {data.matches.length})
                            </h2>
                            <ul className="space-y-3">
                                {data.matches.map((t) => (
                                    <li
                                        key={t.id}
                                        className="border border-slate-100 rounded-lg p-3"
                                    >
                                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                        <span>Ticket: {t.ticket_id}</span>
                                        <span>
                                            Similarity: {t.similarity.toFixed(3)}
                                        </span>
                                        </div>
                                        <h3 className="text-sm font-semibold">
                                        {t.subject}
                                        </h3>
                                        <p className="text-sm text-slate-700 mt-1">
                                        {t.description}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}