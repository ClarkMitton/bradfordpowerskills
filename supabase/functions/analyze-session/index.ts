import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEAD_PHASES = {
  launch: "Launch Phase - Opening hook, learning intentions, success criteria, prior knowledge activation",
  establish: "Establish Phase - Direct instruction, modeling, guided practice, checking understanding",
  apply: "Apply Phase - Independent practice, differentiated tasks, extending learning",
  demonstrate: "Demonstrate Phase - Assessment for learning, student demonstrations, exit tickets, plenaries"
};

const FEEDBACK_CATEGORIES = `
Seven Key Categories for Audio-Based Teacher Feedback:

1. Questioning Techniques
The quality, variety, and distribution of questions asked during instruction. This includes open vs. closed questions, wait time after asking, and whether questions genuinely probe understanding or simply check for recall.

2. Clarity of Explanation
How clearly the teacher articulates concepts, instructions, and expectations. This encompasses speech pace, use of precise vocabulary, logical sequencing of ideas, and whether explanations build systematically from simple to complex.

3. Tone and Emotional Climate
The warmth, enthusiasm, and emotional tenor conveyed through voice. This includes whether the teacher sounds encouraging, patient, and genuinely interested in student contributions, creating a psychologically safe learning environment.

4. Student Participation and Voice Distribution
The balance of teacher talk versus student talk, and whether participation is equitably distributed or dominated by a few voices. This reveals whether the classroom is teacher-centered or genuinely interactive.

5. Behavioral Management Language
How the teacher addresses off-task behavior, maintains focus, and sets boundaries through verbal means. This includes the use of positive redirection, clear expectations, and whether corrections are respectful and constructive.

6. Responsive Listening and Feedback
The quality of the teacher's responses to student contributions—whether they truly listen, build on student ideas, provide specific feedback, and create dialogue rather than simply evaluating answers as correct or incorrect.

7. Pacing and Transitions
The rhythm and flow of the lesson, including how smoothly the teacher moves between activities, whether instructions are efficient, and if there's appropriate balance between different phases of learning.
`;

const STAR_FRAMEWORK = `
Growth-Oriented Rating System: The STAR Framework

Rating Levels (for each category):

⭐⭐⭐⭐ Exemplary Strength
This aspect of your practice is a real asset to your students' learning. You're modeling excellence here that creates powerful learning moments. Consider how you might share this strength with colleagues.

⭐⭐⭐ Solid Foundation
You're doing well in this area and students are benefiting from your approach. There's an opportunity to refine or extend this practice to make it even more impactful.

⭐⭐ Developing Skill
You're building capacity in this area. With focused attention and practice, this could become a real strength. This is a prime area for growth and experimentation.

⭐ Emerging Focus
This represents an important opportunity for development. Small adjustments here could unlock significant improvements in student engagement and learning.

CRITICAL EVIDENCE REQUIREMENTS - YOU MUST FOLLOW THESE:
Every piece of feedback MUST include EITHER:
1. A timestamp in format [MM:SS] - e.g., "At [3:45], you asked..."
2. A direct quote from the transcript in quotation marks - e.g., When you said "Can anyone build on that idea?"...

Feedback Format for Each Category:

What's Working:
- MUST include at least one timestamp OR direct quote as evidence
- Example: "At [3:45], your use of 'Can anyone build on that idea?' created excellent student dialogue"
- Example: "When you said 'Let me show you another way to think about this...', you effectively scaffolded the concept"
- Be specific about the positive impact observed

Growth Edge:
- MUST reference a specific moment with timestamp OR quote
- One specific, actionable next step to enhance this area
- Framed as an opportunity rather than a deficit
- Example: "Around [8:20], when explaining the concept, there's an opportunity to..."

Try This:
- A concrete technique, phrase, or approach to experiment with
- Audio-specific strategies that can be immediately implemented
- Provide example phrases they could use
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, selectedPhases, lessonPlan, scaffolding, studentWork, mode } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build phase context based on selection
    let phaseContext = "";
    if (selectedPhases.includes("full")) {
      phaseContext = "Analyze ALL four LEAD phases: Launch, Establish, Apply, and Demonstrate.";
    } else {
      const phases = selectedPhases.map((p: string) => LEAD_PHASES[p as keyof typeof LEAD_PHASES]).filter(Boolean);
      phaseContext = `Only analyze these specific LEAD phases: ${selectedPhases.join(", ")}. Do NOT provide feedback on phases not selected.`;
    }

    // Build additional context based on mode
    let additionalContext = "";
    if (mode === "deep-dive" && lessonPlan) {
      additionalContext = `
Compare the delivery against the lesson plan provided:
${lessonPlan}

Analyze alignment between planned activities and actual delivery.
`;
    }
    
    if (mode === "full-review") {
      if (lessonPlan) {
        additionalContext += `
Lesson Plan:
${lessonPlan}
`;
      }
      if (scaffolding) {
        additionalContext += `
Scaffolding Materials:
${scaffolding}
`;
      }
      if (studentWork) {
        additionalContext += `
Student Work Analysis Context:
${studentWork}
`;
      }
    }

    const systemPrompt = `You are a supportive, encouraging teaching coach analyzing a classroom session transcript. Your feedback should feel like it comes from a trusted colleague who genuinely wants to help teachers grow.

CRITICAL RULES:
1. NEVER mention any student names - use "Student" or "a student" instead
2. Only provide feedback for the phases the user selected
3. EVERY observation MUST include a specific timestamp [MM:SS] OR a direct quote from the transcript in quotation marks - this is NON-NEGOTIABLE
4. Focus on growth and celebration of strengths, not criticism
5. Use warm, encouraging language throughout - teachers work incredibly hard
6. Be specific and actionable - vague feedback is not helpful

${FEEDBACK_CATEGORIES}

${STAR_FRAMEWORK}

${phaseContext}

${additionalContext}

Respond with valid JSON matching this exact structure:
{
  "categories": [
    {
      "name": "Category name",
      "rating": 1-4 (number of stars),
      "whatsWorking": "Specific positive observations",
      "growthEdge": "One actionable next step",
      "tryThis": "Concrete technique to experiment with"
    }
  ],
  "leadPhases": [
    {
      "phase": "Phase name (only include if selected)",
      "rating": "exemplary" | "solid" | "developing" | "emerging",
      "observations": ["observation 1", "observation 2"],
      "suggestions": ["suggestion 1"]
    }
  ],
  "overallSummary": "Brief 2-3 sentence summary of the session",
  "topStrength": "The single biggest strength observed",
  "priorityGrowthArea": "The single most impactful area for development"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this classroom session transcript:\n\n${transcript}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
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

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    // Parse the JSON from the response
    let feedback;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      feedback = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
