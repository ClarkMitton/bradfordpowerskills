import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ITTECFIndicator {
  standard: string;
  subCode: string;
  statement: string;
  status: "demonstrated" | "not_yet_evidenced";
}

interface CategoryData {
  name: string;
  toMakeStronger: string;
  rating: string | number;
}

interface ReportData {
  mvpMoment: string;
  overallSummary: string;
  ittecfIndicators: ITTECFIndicator[];
  categories: CategoryData[];
  standardEnglishFeedback: string;
}

const formatReport = (report: ReportData, label: string): string => {
  const lines: string[] = [];

  lines.push(`### ${label}`);
  lines.push(`**MVP Moment:** ${report.mvpMoment}`);
  lines.push(`**Overall Summary:** ${report.overallSummary}`);

  if (report.ittecfIndicators && report.ittecfIndicators.length > 0) {
    lines.push("\n**ITTECF Indicators:**");
    for (const ind of report.ittecfIndicators) {
      const statusLabel = ind.status === "demonstrated" ? "✓ demonstrated" : "○ not yet evidenced";
      lines.push(`- ${ind.standard} ${ind.subCode}: "${ind.statement}" — ${statusLabel}`);
    }
  }

  if (report.categories && report.categories.length > 0) {
    lines.push("\n**Domain Growth Areas (To Make It Even Stronger):**");
    for (const cat of report.categories) {
      if (cat.toMakeStronger) {
        lines.push(`- ${cat.name} [stage: ${cat.rating}]: "${cat.toMakeStronger}"`);
      }
    }
  }

  if (report.standardEnglishFeedback) {
    lines.push(`\n**Standard English Feedback:** "${report.standardEnglishFeedback}"`);
  }

  return lines.join("\n");
};

const COMPARISON_PROMPT = `You are an expert teaching coach writing a "Your Teaching Journey" development summary for a teacher who has shared two session reports. Session A is their EARLIER session. Session B is their LATER session.

Your tone must be coaching, developmental, and encouraging throughout. You are helping them see their professional growth, not evaluating them.

Generate the following comparison sections. Return ONLY the sections where you have real, clear evidence from the data — never fabricate or force patterns. If a section has insufficient evidence, return null for that field.

**Embedding** — ITTECF indicators or skills demonstrated in BOTH sessions. Frame as practice becoming part of their consistent repertoire. Example: "Standard 2 2b appeared in both sessions, suggesting that building on prior knowledge is becoming a consistent habit in your teaching."

**Growth** — ITTECF indicators present in Session B but NOT in Session A, or domain areas where Session B shows notably different or improved practice. Frame as genuine new development. Example: "In your more recent session you demonstrated Standard 4 4e for the first time, showing growth in how you prompt pupils to elaborate."

**Resolved** — Themes from Session A's "To Make It Even Stronger" areas that do NOT appear as growth areas in Session B. Frame carefully and positively as patterns that may have been addressed, without overclaiming. Use phrases like "appears to have shifted" or "is no longer a prominent area."

**Persistent** — Themes appearing in BOTH sessions' "To Make It Even Stronger" areas. Name honestly as areas worth continued deliberate focus. Never frame as failure — frame as a development priority worth consistent attention.

**Standard English Trajectory** — The direction of change between the two Standard English sections. Note improvement, consistency, or continued area for focus. Do NOT compare scores or numbers — focus on the qualitative direction. If no Standard English data is available, return null.

CRITICAL RULES:
- Do not fabricate comparisons or force patterns where the data does not clearly support them
- If sessions are too different in context to draw meaningful comparisons, skip that section (return null)
- Each section should be 2-4 sentences of fluent, coaching prose — not bullet points
- Use British English spelling throughout
- Reference specific indicators or domain names where relevant to make it concrete
- If there are no ITTECF indicators in either report, return null for embedding and growth`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both old structured format and new raw text format
    let reportAText: string;
    let reportBText: string;
    let mvpA = "Teaching session";
    let mvpB = "Teaching session";

    if (body.reportAText && body.reportBText) {
      // New PDF-based flow: raw extracted text
      reportAText = `### Session A (Earlier)\n\n${body.reportAText}`;
      reportBText = `### Session B (Later)\n\n${body.reportBText}`;
      // Try to extract MVP moments from text
      const mvpMatchA = body.reportAText.match(/MVP\s*Moment[:\s]*([^\n.]+)/i) || body.reportAText.match(/Session\s*MVP[:\s]*([^\n.]+)/i);
      const mvpMatchB = body.reportBText.match(/MVP\s*Moment[:\s]*([^\n.]+)/i) || body.reportBText.match(/Session\s*MVP[:\s]*([^\n.]+)/i);
      if (mvpMatchA) mvpA = mvpMatchA[1].trim();
      if (mvpMatchB) mvpB = mvpMatchB[1].trim();
    } else if (body.reportA && body.reportB) {
      // Legacy structured format
      reportAText = formatReport(body.reportA, "Session A (Earlier)");
      reportBText = formatReport(body.reportB, "Session B (Later)");
      mvpA = body.reportA.mvpMoment || mvpA;
      mvpB = body.reportB.mvpMoment || mvpB;
    } else {
      return new Response(
        JSON.stringify({ error: "Two reports are required for comparison" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Here are the two teaching session reports to compare:

${reportAText}

---

${reportBText}

---

Please generate the "Your Teaching Journey" comparison following the instructions provided.`;

    const jsonSchema = `
Respond with valid JSON matching this exact structure. For any section where you do not have sufficient evidence, use null.

{
  "sessionA": {
    "mvpMoment": "${mvpA.replace(/"/g, '\\"')}"
  },
  "sessionB": {
    "mvpMoment": "${mvpB.replace(/"/g, '\\"')}"
  },
  "embedding": "2-4 sentence paragraph about indicators/skills present in both sessions, OR null if insufficient evidence",
  "growth": "2-4 sentence paragraph about new developments in Session B not present in Session A, OR null",
  "resolved": "2-4 sentence paragraph about Session A growth areas that appear addressed in Session B, OR null",
  "persistent": "2-4 sentence paragraph about themes in both sessions' growth areas, OR null",
  "standardEnglishTrajectory": "1-3 sentence paragraph about the direction of Standard English development, OR null"
}

CRITICAL: Return ONLY valid JSON. No text before or after. No markdown code blocks. Start directly with { and end with }.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: COMPARISON_PROMPT + "\n\n" + jsonSchema },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseText = await response.text();
    let aiResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI gateway response:", responseText?.slice(0, 500));
      return new Response(JSON.stringify({ error: "Invalid response from AI. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(aiResponse).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned an empty response. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let comparison;
    try {
      let jsonStr = content.trim();
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.slice(firstBrace, lastBrace + 1);
        }
      }
      comparison = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content?.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(comparison), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
