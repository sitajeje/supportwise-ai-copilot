//app/api/agent/ask/route.ts

import { NextResponse } from "next/server";
import { createAgent } from "langchain";
import { ChatGoogle } from "@langchain/google";
import { getSupportWiseTools } from "../../../../lib/agent/tools";
import { SUPPORTWISE_AGENT_SYSTEM_PROMPT } from "../../../../lib/agent/system-prompt";

export const runtime = "nodejs";

function extractTextFromAgentResult(result: unknown): string {
  if (!result || typeof result !== "object") {
    return "No answer generated.";
  }

  const maybeResult = result as {
    messages?: Array<{
      content?: unknown;
    }>;
  };

  const messages = maybeResult.messages ?? [];
  const finalMessage = messages[messages.length - 1];

  if (!finalMessage) {
    return "No answer generated.";
  }

  const content = finalMessage.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "No answer generated.";
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("message" in body) ||
      typeof body.message !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid 'message'" },
        { status: 400 }
      );
    }

    const message = body.message;

    const model = new ChatGoogle({
      model: "gemini-2.5-flash",
      temperature: 0.2,
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    });

    const agent = createAgent({
      model,
      tools: getSupportWiseTools(),
      systemPrompt: SUPPORTWISE_AGENT_SYSTEM_PROMPT,
    });

    const result = await (agent as any).invoke({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const answer = extractTextFromAgentResult(result);

    return NextResponse.json({
      route: "agent",
      answer,
      meta: {
        model: "gemini-2.5-flash",
        toolNames: getSupportWiseTools().map((toolDef) => toolDef.name),
      },
    });
  } catch (error) {
    console.error("Error in /api/agent/ask:", error);

    return NextResponse.json(
      { error: "Internal server error in agent route" },
      { status: 500 }
    );
  }
}
