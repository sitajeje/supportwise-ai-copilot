import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";

// ---- Supabase client (server-side, using service role) ----
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---- Local embedding model (Xenova) ----
let embedderPromise: any = null;
async function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    return embedderPromise;
}

// ---- Gemini client ----
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

// Helper to build a concise prompt from results
function buildPrompt(query: string, results: any[]) {
    const ticketsText = results
        .map(
        (t, idx) =>
            `Ticket #${idx + 1} [${t.ticket_id}]\nSubject: ${t.subject}\nDescription: ${t.description}\nSimilarity: ${t.similarity}`
        )
        .join("\n\n");

    return `
You are an AI assistant helping a customer support manager understand patterns in support tickets.

User question:
"${query}"

Here are the top related tickets from the last period (with similarity scores):

${ticketsText}

Tasks:
1. Summarize what customers are mainly complaining about.
2. Identify likely root causes or patterns.
3. Suggest 2–3 concrete actions the support team could take.

Answer in concise bullet points. Do not repeat the full ticket texts.
`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const query: string = body.query;
        const k: number = body.k ?? 5;

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid 'query'" },
                { status: 400 }
            );
        }

        // 1) Get local embedding for the query
        const embedder = await getEmbedder();
        const output = await embedder(query, { pooling: "mean", normalize: true });
        const queryEmbedding: number[] = output.data;

        // 2) Call Supabase RPC to get similar tickets
        const { data: matches, error } = await supabase.rpc("match_tickets", {
            query_embedding: queryEmbedding,
            match_count: k,
        });

        if (error) {
            console.error("Supabase RPC error:", error);
            return NextResponse.json(
                { error: "Error querying similar tickets" },
                { status: 500 }
            );
        }

        // 3) Call Gemini to summarize and extract insights
        const prompt = buildPrompt(query, matches || []);

        const geminiResponse = await geminiModel.generateContent({
            contents: [
                {
                role: "user",
                parts: [{ text: prompt }],
                },
            ],
        });

        const geminiText =
            geminiResponse.response.candidates?.[0]?.content?.parts?.[0]?.text ??
            "No summary generated.";

        return NextResponse.json({
            query,
            matches,
            summary: geminiText,
        });
    } catch (err: any) {
        console.error("Unexpected error in /api/search/insights:", err);
        return NextResponse.json(
        { error: "Unexpected server error" },
        { status: 500 }
        );
    }
}