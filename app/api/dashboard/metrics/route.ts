import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const [daily, status, priority, tags] = await Promise.all([
            supabase.rpc("ticket_volume_daily"),
            supabase.rpc("ticket_by_status"),
            supabase.rpc("ticket_by_priority"),
            supabase.rpc("ticket_by_tag")
        ]);;

        return NextResponse.json({
            daily: daily.data || [],
            status: status.data || [],
            priority: priority.data || [],
            tags: tags.data || [],
        });
    } catch (err: any) {
        console.error("Dashboard metrics error:", err);
        return NextResponse.json(
            { error: "failed to load metrics" },
            { status: 500 }
        );
    }
}