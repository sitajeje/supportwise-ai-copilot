import { geminiModel } from "../server/gemini";
import { ISSUE_GROUPING_PROMPT } from "./grouping-prompt";

type TicketForGrouping = {
    ticket_id: string;
    subject: string;
    description: string;
};

type IssueGroup = {
    category: string;
    summary: string;
    ticketIds: string[];
};

type IssueGroupingResult = {
    groups: IssueGroup[];
};

function safeParseGroupingResult(text: string): IssueGroupingResult {
    try {
        const parsed = JSON.parse(text) as IssueGroupingResult;

        if (!parsed.groups || !Array.isArray(parsed.groups)) {
        return { groups: [] };
        }

        return parsed;
    } catch {
        return { groups: [] };
    }
}

export async function groupIssuesWithLLM(
    tickets: TicketForGrouping[]
): Promise<IssueGroupingResult> {
    const payload = {
        tickets: tickets.map((ticket) => ({
        ticket_id: ticket.ticket_id,
        subject: ticket.subject,
        description: ticket.description,
        })),
    };

    const prompt = `${ISSUE_GROUPING_PROMPT}

    Input:
    ${JSON.stringify(payload, null, 2)}
    `;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();

    return safeParseGroupingResult(text);
}
