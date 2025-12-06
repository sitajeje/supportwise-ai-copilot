"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    async function load() {
        const res = await fetch("/api/dashboard/metrics");
        const data = await res.json();
        setMetrics(data);
        setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <p>Loading dashboard…</p>;
    }

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* Daily volume */}
            <section>
                <h2 className="text-xl font-semibold mb-3">Ticket Volume Per Day</h2>
                <pre className="bg-slate-100 p-4 rounded text-sm">
                {JSON.stringify(metrics.daily, null, 2)}
                </pre>
            </section>

            {/* Status */}
            <section>
                <h2 className="text-xl font-semibold mb-3">By Status</h2>
                <pre className="bg-slate-100 p-4 rounded text-sm">
                {JSON.stringify(metrics.status, null, 2)}
                </pre>
            </section>

            {/* Priority */}
            <section>
                <h2 className="text-xl font-semibold mb-3">By Priority</h2>
                <pre className="bg-slate-100 p-4 rounded text-sm">
                {JSON.stringify(metrics.priority, null, 2)}
                </pre>
            </section>

            {/* Tags */}
            <section>
                <h2 className="text-xl font-semibold mb-3">Top Tags</h2>
                <pre className="bg-slate-100 p-4 rounded text-sm">
                {JSON.stringify(metrics.tags, null, 2)}
                </pre>
            </section>
        </div>
    );
}