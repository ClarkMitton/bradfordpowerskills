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

const TEACHING_CATEGORIES = `
Five Key Teaching Strength Categories for Audio-Based Feedback:

1. Questioning Techniques
The quality, variety, and distribution of questions asked during instruction. This includes open vs. closed questions, wait time after asking, and whether questions genuinely probe understanding or simply check for recall.

2. Clarity of Explanation
How clearly the teacher articulates concepts, instructions, and expectations. This encompasses speech pace, use of precise vocabulary, logical sequencing of ideas, and whether explanations build systematically from simple to complex.

3. Tone and Emotional Climate
The warmth, enthusiasm, and emotional tenor conveyed through voice. This includes whether the teacher sounds encouraging, patient, and genuinely interested in student contributions, creating a psychologically safe learning environment.

4. Student Participation and Voice Distribution
The balance of teacher talk versus student talk, and whether participation is equitably distributed or dominated by a few voices. This reveals whether the classroom is teacher-centered or genuinely interactive.

5. Responsive Listening and Feedback
The quality of the teacher's responses to student contributions—whether they truly listen, build on student ideas, provide specific feedback, and create dialogue rather than simply evaluating answers as correct or incorrect.
`;

const FEEDBACK_FRAMEWORK = `
FEEDBACK STRUCTURE - Follow this EXACTLY for each category:

Section 1: "What's Working Well" (marked with ✓)
- Start with a specific observable behavior with timestamp [MM:SS]
- Explain the pedagogical principle behind why this is effective
- Include pedagogical terms with brief explanations, e.g., "wait time (the pause after asking a question)"
- Keep it to 2-3 sentences maximum
- Example: "At [3:45], you paused for 5 seconds after asking 'What patterns do you notice?' This demonstrates excellent wait time (the pause after asking a question that allows students to think). Research shows this increases both response quality and participation."

Section 2: "To Make It Even Stronger" (marked with →)
- Identify a specific moment with timestamp [MM:SS] where enhancement could occur
- Suggest ONE concrete, actionable technique with pedagogical justification in parentheses
- Include research-based reasoning where relevant
- Keep it focused on ONE clear action
- Example: "At [8:20], when three students answered consecutively, consider using cold calling (randomly selecting students to respond) to distribute participation more equitably. Research shows this increases engagement by 40% compared to voluntary responses."

Section 3: "Try This Next Time" (marked with 💡)
- Provide a concrete, practical strategy they can implement immediately
- Make it specific enough that they know exactly what to do
- Frame as building on their existing strength, not fixing a deficit
- Example: "Build on your strong questioning by adding think-pair-share (students think alone, discuss with a partner, then share with class) before whole-class discussion. This gives every student processing time and a voice."

CRITICAL FORMATTING REQUIREMENTS:
- Always use timestamps in format [MM:SS]
- Maximum 4-5 sentences per section
- Use pedagogical terms but ALWAYS add plain language explanations in parentheses when first introduced
- Maintain an encouraging, developmental tone throughout
- Frame growth areas as opportunities to build on strengths

PEDAGOGICAL TERMS TO INCLUDE WITH EXPLANATIONS:
When using these terms, always explain them in parentheses:
- Wait time (the pause after asking a question to allow thinking)
- Cold calling (randomly selecting students to respond)
- Think-pair-share (students think alone, discuss with partner, then share)
- Scaffolding (breaking complex tasks into manageable steps)
- Bloom's taxonomy (hierarchy of thinking skills from remembering to creating)
- Multiple entry points (different ways for students to access the same content)
- Cognitive load (the mental effort required to process information)
- Formative assessment (checking understanding during learning, not just at the end)
- Higher-order questioning (questions requiring analysis, evaluation, or creation)
- Distributed practice (spreading learning over time rather than cramming)
`;

const STAR_FRAMEWORK = `
Growth-Oriented Rating System: The STAR Framework

Rating Levels (for each category):

⭐⭐⭐⭐ Exemplary Strength
This aspect of your practice is a real asset to your students' learning. You're modeling excellence here.

⭐⭐⭐ Solid Foundation
You're doing well in this area. There's an opportunity to refine or extend this practice.

⭐⭐ Developing Skill
You're building capacity in this area. This is a prime area for growth and experimentation.

⭐ Emerging Focus
This represents an important opportunity for development. Small adjustments here could unlock significant improvements.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, selectedPhases, lessonPlan, scaffolding, studentWork, mode, learnerLevel, subject, selectedCategories } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build phase context based on selection
    let phaseContext = "";
    if (selectedPhases.includes("full")) {
      phaseContext = "Analyze ALL four LEAD phases: Launch, Establish, Apply, and Demonstrate.";
    } else {
      const phases = selectedPhases.map((p: string) => LEAD_PHASES[p as keyof typeof LEAD_PHASES]).filter(Boolean);
      phaseContext = `Only analyze these specific LEAD phases: ${selectedPhases.join(", ")}. Do NOT provide feedback on phases not selected.`;
    }

    // Build category filter
    let categoryContext = "";
    if (selectedCategories && selectedCategories.length > 0 && selectedCategories.length < 5) {
      categoryContext = `\n\nONLY provide feedback for these specific categories: ${selectedCategories.join(", ")}. Do NOT include feedback for other categories.`;
    }

    // Build learner context
    let learnerContext = "";
    if (learnerLevel || subject) {
      learnerContext = "\n\nADDITIONAL CONTEXT:\n";
      if (learnerLevel) learnerContext += `Learner Level: ${learnerLevel}\n`;
      if (subject) learnerContext += `Subject/Topic: ${subject}\n`;
      learnerContext += "Consider this context when providing feedback - tailor suggestions appropriately for this audience and subject matter.";
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
3. EVERY observation MUST include a specific timestamp [MM:SS] AND ideally a direct quote from the transcript
4. Focus on growth and celebration of strengths, not criticism
5. Use warm, encouraging language throughout
6. Be specific and actionable - vague feedback is not helpful
7. When using pedagogical terms, ALWAYS add a plain language explanation in parentheses

${TEACHING_CATEGORIES}

${FEEDBACK_FRAMEWORK}

${STAR_FRAMEWORK}

${phaseContext}
${categoryContext}
${learnerContext}
${additionalContext}

Respond with valid JSON matching this exact structure:
{
  "categories": [
    {
      "name": "Category name (one of the five teaching strength categories)",
      "rating": 1-4 (number of stars),
      "whatsWorking": "Specific positive observation with timestamp and pedagogical principle. Max 2-3 sentences.",
      "toMakeStronger": "One specific moment with timestamp + ONE actionable technique with research backing. Max 3-4 sentences.",
      "tryThisNext": "Concrete, immediately implementable strategy building on their strength. Max 2-3 sentences."
    }
  ],
  "leadPhases": [
    {
      "phase": "Phase name (only include if selected)",
      "rating": "exemplary" | "solid" | "developing" | "emerging",
      "observations": ["observation 1 with timestamp", "observation 2 with timestamp"],
      "suggestions": ["suggestion 1"]
    }
  ],
  "overallSummary": "Brief 2-3 sentence summary of the session highlighting key strengths",
  "topStrength": "The single biggest strength observed with specific evidence",
  "priorityGrowthArea": "The single most impactful area for development, framed positively"
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
      JSON.stringify({ error: "Unable to process request. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
