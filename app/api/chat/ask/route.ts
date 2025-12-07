// app/api/chat/ask/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

// Cache local embedder for semantic search branch
let embedderPromise: any = null;
async function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return embedderPromise;
}

// ---- Intent classification (very simple rule-based router) ----
type RouteType = "metrics" | "semantic";

function classifyIntent(message: string): RouteType {
    const q = message.toLowerCase();

    const metricsKeywords = [
        "how many",
        "number of",
        "count",
        "volume",
        "trend",
        "per day",
        "per week",
        "per month",
        "distribution",
        "by status",
        "by priority",
        "by tag",
        "sla",
        "average response time",
        "tickets last",
        "tickets this month",
    ];

    const isMetrics = metricsKeywords.some((kw) => q.includes(kw));

    return isMetrics ? "metrics" : "semantic";
}

// ---- Metrics branch: uses dashboard RPCs + Gemini summary ----
async function handleMetricsQuestion(message: string) {
    const [daily, status, priority, tags] = await Promise.all([
        supabase.rpc("ticket_volume_daily"),
        supabase.rpc("ticket_by_status"),
        supabase.rpc("ticket_by_priority"),
        supabase.rpc("ticket_by_tag"),
    ]);

    if (daily.error || status.error || priority.error || tags.error) {
        throw new Error("Error loading metrics for chat");
    }

    const dailyData = (daily.data || []) as { day: string; count: number }[];
    const statusData = (status.data || []) as { status: string; count: number }[];
    const priorityData = (priority.data || []) as {
        priority: string;
        count: number;
    }[];
    const tagsData = (tags.data || []) as { tag: string; count: number }[];

    // Build a compact metrics summary for Gemini
    const metricsText = `
    Daily ticket volume (sample):
    ${dailyData
    .slice(0, 10)
    .map((d) => `- ${d.day}: ${d.count} tickets`)
    .join("\n")}

    By status:
    ${statusData.map((s) => `- ${s.status}: ${s.count}`).join("\n")}

    By priority:
    ${priorityData.map((p) => `- ${p.priority}: ${p.count}`).join("\n")}

    Top tags:
    ${tagsData.map((t) => `- ${t.tag}: ${t.count}`).join("\n")}
    `;

    const prompt = `
    You are an analytics co-pilot for a customer support team.

    User question:
    "${message}"

    Here are some aggregated metrics from the ticket system:
    ${metricsText}

    Tasks:
    1. Answer the user's question as precisely as possible using the metrics above.
    2. Highlight any interesting trends or anomalies (if any).
    3. Suggest 1–2 follow-up questions or next analyses the manager could run.

    Be concise, use bullet points, and avoid repeating raw numbers unnecessarily.
    `;

    const response = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const answer =
        response.response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No answer generated.";

    return {
        route: "metrics" as RouteType,
        answer,
        metrics: {
        daily: dailyData,
        status: statusData,
        priority: priorityData,
        tags: tagsData,
        },
    };
}

// ---- Semantic branch: reuse match_tickets + Gemini summary ----
async function handleSemanticQuestion(message: string) {
    const embedder = await getEmbedder();
    const output = await embedder(message, {
        pooling: "mean",
        normalize: true,
    });
    const queryEmbedding: number[] = Array.from(output.data as Float32Array);

    const { data: matches, error } = await supabase.rpc("match_tickets", {
        query_embedding: queryEmbedding,
        match_count: 5,
    });

    if (error) {
        throw new Error("Error querying similar tickets");
    }

    const promptTickets = (matches || [])
        .map(
        (t: any, idx: number) =>
            `Ticket #${idx + 1} [${t.ticket_id}]\nSubject: ${
            t.subject
            }\nDescription: ${t.description}\nSimilarity: ${t.similarity}`
        )
        .join("\n\n");

    const prompt = `
    You are an AI assistant helping a support manager understand patterns in support tickets.

    User question:
    "${message}"

    Here are the top related tickets:
    ${promptTickets}

    Tasks:
    1. Summarize what is going on in these tickets in relation to the user's question.
    2. Suggest likely root causes or underlying issues.
    3. Propose 2–3 concrete actions the support team should take.

    Use concise bullet points, do not repeat the full ticket texts.
    `;

    const response = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const answer =
        response.response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No answer generated.";

    return {
        route: "semantic" as RouteType,
        answer,
        matches: matches || [],
    };
}

// ---- Main chat handler ----
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message: string = body.message;
        // optional: history = body.history

        if (!message || typeof message !== "string") {
        return NextResponse.json(
            { error: "Missing or invalid 'message'" },
            { status: 400 }
        );
        }

        const route = classifyIntent(message);

        if (route === "metrics") {
        const result = await handleMetricsQuestion(message);
        return NextResponse.json(result);
        } else {
        const result = await handleSemanticQuestion(message);
        return NextResponse.json(result);
        }
    } catch (err: any) {
        console.error("Error in /api/chat/ask:", err);
        return NextResponse.json(
        { error: "Internal server error in chat API" },
        { status: 500 }
        );
    }
}