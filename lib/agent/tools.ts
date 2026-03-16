//lib/agent/tools.ts

import { tool } from "langchain";
import { z } from "zod";
import { supabaseAdmin } from "../server/supabase";
import { embedText } from "../server/embedder";
import { groupIssuesWithLLM } from "./groupIssues";


type TicketMatch = {
    ticket_id: string;
    subject: string;
    description: string;
    similarity: number;
};

type DailyVolumeRow = {
    day: string;
    count: number;
};

const groupIssuesSchema = z.object({
    query: z.string().describe("Issue theme to retrieve related tickets before grouping"),
    limit: z.number().min(3).max(12).default(8),
});

const detectTrendsSchema = z.object({
    lastDays: z.number().min(6).max(60).default(14),
});


export const searchTicketsTool = tool(
    async ({ query, limit }) => {
        const queryEmbedding = await embedText(query);

        const { data, error } = await supabaseAdmin.rpc("match_tickets", {
            query_embedding: queryEmbedding,
            match_count: limit,
        });

        if (error) {
            throw new Error(`Semantic search failed: ${error.message}`);
        }

        const matches = (data || []) as TicketMatch[];

        return JSON.stringify({
            query,
            total: matches.length,
            matches: matches.map((ticket) => ({
                ticket_id: ticket.ticket_id,
                subject: ticket.subject,
                description: ticket.description,
                similarity: ticket.similarity,
            })),
        });
    },
    {
        name: "search_tickets",
        description:
        "Search semantically similar support tickets for complaint analysis and issue discovery.",
        schema: z.object({
            query: z.string().describe("Semantic search query for support issues"),
            limit: z.number().min(1).max(10).default(5),
        }),
    }
);

export const getDailyVolumeTool = tool(
    async ({ lastDays }) => {
        const { data, error } = await supabaseAdmin.rpc("ticket_volume_daily");

        if (error) {
            throw new Error(`Daily volume lookup failed: ${error.message}`);
        }

        const rows = (data || []) as DailyVolumeRow[];

        return JSON.stringify({
            lastDays,
            rows: rows.slice(-lastDays),
        });
    },
    {
        name: "get_daily_volume",
        description:
        "Get daily support ticket volume to analyze workload and recent ticket trends.",
        schema: z.object({
            lastDays: z.number().min(3).max(30).default(14),
        }),
    }
);

export const getStatusDistributionTool = tool(
    async () => {
        const { data, error } = await supabaseAdmin.rpc("ticket_by_status");

        if (error) {
            throw new Error(`Status distribution failed: ${error.message}`);
        }

        return JSON.stringify({
            rows: data || [],
        });
    },
    {
        name: "get_status_distribution",
        description:
        "Get current support ticket distribution by status for operational analysis.",
        schema: z.object({}),
    }
);

export const groupIssuesTool = tool(
    async (input) => {
        const { query, limit } = groupIssuesSchema.parse(input);

        const queryEmbedding = await embedText(query);

        const { data, error } = await supabaseAdmin.rpc("match_tickets", {
            query_embedding: queryEmbedding,
            match_count: limit,
        });

        if (error) {
            throw new Error(`Issue grouping retrieval failed: ${error.message}`);
        }

        const matches = (data || []) as TicketMatch[];

        const grouping = await groupIssuesWithLLM(
            matches.map((ticket) => ({
                ticket_id: ticket.ticket_id,
                subject: ticket.subject,
                description: ticket.description,
            }))
        );

        return JSON.stringify({
            query,
            total: matches.length,
            groups: grouping.groups,
            sourceTickets: matches.map((ticket) => ({
                ticket_id: ticket.ticket_id,
                subject: ticket.subject,
                similarity: ticket.similarity,
            })),
        });
    },
    {
        name: "group_issues",
        description:
        "Retrieve related tickets and group them into semantic issue categories.",
        schema: groupIssuesSchema,
    }
);

export const detectTrendsTool = tool(
    async (input) => {
        const { lastDays } = detectTrendsSchema.parse(input);

        const { data, error } = await supabaseAdmin.rpc("ticket_volume_last_n_days", {
            p_days: lastDays,
        });

        if (error) {
            throw new Error(`Trend detection failed: ${error.message}`);
        }

        const rows = (data || []) as DailyVolumeRow[];

        const midpoint = Math.floor(rows.length / 2);
        const previousWindow = rows.slice(0, midpoint);
        const currentWindow = rows.slice(midpoint);

        const previousTotal = previousWindow.reduce((sum, row) => sum + row.count, 0);
        const currentTotal = currentWindow.reduce((sum, row) => sum + row.count, 0);

        const change =
        previousTotal === 0
            ? null
            : ((currentTotal - previousTotal) / previousTotal) * 100;

        return JSON.stringify({
            lastDays,
            previousTotal,
            currentTotal,
            changePercent: change,
            rows,
        });
    },
    {
        name: "detect_trends",
        description:
        "Compare recent support ticket volume against the previous time window.",
        schema: detectTrendsSchema,
    }
);

export function getSupportWiseTools() {
    return [
        searchTicketsTool,
        getDailyVolumeTool,
        getStatusDistributionTool,
        groupIssuesTool,
        detectTrendsTool,
    ];
}
