//app/api/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ApexCharts needs dynamic import on client side
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

type MetricsResponse = {
    daily: { day: string; count: number }[];
    status: { status: string; count: number }[];
    priority: { priority: string; count: number }[];
    tags: { tag: string; count: number }[];
};

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    async function load() {
        const res = await fetch("../../api/dashboard/metrics");
        const data = await res.json();
        setMetrics(data);
        setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <p>Loading dashboard…</p>;
    }

    if (!metrics) {
        return <p>Failed to load metrics.</p>;
    }

    // Prepare data for charts
    const dailyCategories = metrics.daily.map((d) => d.day);
    const dailySeries = [
        {
        name: "Tickets",
        data: metrics.daily.map((d) => d.count),
        },
    ];

    const statusCategories = metrics.status.map((s) => s.status);
    const statusSeries = [
        {
        name: "Tickets",
        data: metrics.status.map((s) => s.count),
        },
    ];

    const priorityCategories = metrics.priority.map((p) => p.priority);
    const prioritySeries = [
        {
        name: "Tickets",
        data: metrics.priority.map((p) => p.count),
        },
    ];

    const tagCategories = metrics.tags.map((t) => t.tag);
    const tagSeries = [
        {
        name: "Tickets",
        data: metrics.tags.map((t) => t.count),
        },
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">SupportWise Dashboard</h1>
                <a
                href="../../api/dashboard/charts/daily"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-100"
                >
                Download Daily Volume SVG
                </a>
            </div>

            {/* Daily volume 3D chart */}
            <section className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-2">
                Ticket Volume Per Day (3D)
                </h2>
                <div className="w-full">
                <ReactApexChart
                    type="area"
                    height={320}
                    series={dailySeries}
                    options={{
                    chart: {
                        toolbar: {
                        show: true,
                        },
                    },
                    xaxis: {
                        categories: dailyCategories,
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    stroke: {
                        curve: "smooth",
                    },
                    fill: {
                        type: "gradient",
                    },
                    // pseudo "3D" effect with drop shadow & gradient
                    grid: {
                        show: true,
                    },
                    }}
                />
                </div>
            </section>

            {/* Status distribution */}
            <section className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-2">Tickets by Status</h2>
                <div className="w-full">
                <ReactApexChart
                    type="bar"
                    height={280}
                    series={statusSeries}
                    options={{
                    plotOptions: {
                        bar: {
                        horizontal: false,
                        columnWidth: "45%",
                        },
                    },
                    xaxis: {
                        categories: statusCategories,
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    }}
                />
                </div>
            </section>

            {/* Priority distribution */}
            <section className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-2">Tickets by Priority</h2>
                <div className="w-full">
                <ReactApexChart
                    type="bar"
                    height={280}
                    series={prioritySeries}
                    options={{
                    plotOptions: {
                        bar: {
                        horizontal: false,
                        columnWidth: "45%",
                        distributed: true,
                        },
                    },
                    xaxis: {
                        categories: priorityCategories,
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    }}
                />
                </div>
            </section>

            {/* Top tags */}
            <section className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-2">Top Ticket Tags</h2>
                <div className="w-full">
                <ReactApexChart
                    type="bar"
                    height={320}
                    series={tagSeries}
                    options={{
                    plotOptions: {
                        bar: {
                        horizontal: true,
                        barHeight: "60%",
                        },
                    },
                    xaxis: {
                        categories: tagCategories,
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    }}
                />
                </div>
            </section>
        </div>
    );
}