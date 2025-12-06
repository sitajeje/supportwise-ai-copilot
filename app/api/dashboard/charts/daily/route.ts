// app/api/dashboard/charts/daily/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as vega from "vega";
import * as vegaLite from "vega-lite";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // 1) Load daily ticket volume from RPC
        const { data, error } = await supabase.rpc("ticket_volume_daily");
        if (error || !data) {
            console.error("ticket_volume_daily error:", error);
            return NextResponse.json(
                { error: "Failed to load daily volume" },
                { status: 500 }
            );
        }
        // data: [{ day: '2024-02-01', count: 12 }, ...]
        const values = data.map((row: any) => ({
        day: row.day,
        count: Number(row.count),
        }));

        // 2) Define a Vega-Lite spec for a line chart
        const vlSpec: vegaLite.TopLevelSpec = {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            description: "Daily ticket volume",
            width: 800,
            height: 300,
            data: { values },
            mark: { type: "line", point: true },
            encoding: {
                x: {
                field: "day",
                type: "temporal",
                title: "Day",
                },
                y: {
                field: "count",
                type: "quantitative",
                title: "Ticket count",
                },
                tooltip: [
                { field: "day", type: "temporal" },
                { field: "count", type: "quantitative" },
                ],
            },
        };

        // 3) Compile Vega-Lite spec to Vega spec
        const compiled = vegaLite.compile(vlSpec);
        const vegaSpec = compiled.spec;

        // 4) Create a Vega View and render to SVG
        const view = new vega.View(vega.parse(vegaSpec), {
        renderer: "svg",
        }).width(800).height(300);

        const svg = await view.toSVG();

        return new NextResponse(svg, {
        status: 200,
        headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "no-store",
            "Content-Disposition": "inline; filename=daily_ticket_volume.svg",
        },
        });
    } catch (err: any) {
        console.error("Error generating daily SVG chart:", err);
        return NextResponse.json(
            { error: "Failed to generate SVG chart" },
            { status: 500 }
        );
    }

}
