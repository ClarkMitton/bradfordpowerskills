import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LESSON_STRUCTURE = `
## Lesson Structure Guidance

Analyse the teaching session holistically, looking at how the lesson flows through its natural phases:
- **Opening**: How the lesson begins — student welcome, engagement hooks, gauging starting points
- **Core Teaching**: How new learning is introduced — explanations, modelling, guided practice
- **Application**: How students practise and apply learning — independent work, differentiated tasks
- **Closing**: How learning is consolidated — checking understanding, summarising, next steps

Identify which phases are present in the transcript and provide feedback on each.
`;


const DOMAIN_DEFINITIONS = `
## The Five Teaching Domains

### Domain 1: Questioning & Cognitive Challenge
Analyses the quality, variety, and distribution of questions. Includes:
- Question taxonomy: Bloom's levels (recall vs. comprehension vs. analysis vs. evaluation vs. creation)
- Distribution strategy: Who gets asked what type of question and why
- Scaffolding techniques: Pose-pause-pounce-bounce, think-pair-share, cold calling, no-hands-up
- Wait time: 3-5 seconds minimum after asking a question
- Response handling: How wrong answers are treated, how correct answers are extended
- Differentiation: Do different students get different levels of challenge/support?

### Domain 2: Explanation & Conceptual Clarity
Analyses how clearly concepts are articulated. Includes:
- Precision: Language clarity, accurate terminology
- Examples: Use of concrete examples, non-examples, analogies
- Scaffolding: Breaking complex ideas into manageable chunks
- Checking understanding: Pausing to verify comprehension before proceeding
- Misconception addressing: Proactive or reactive handling of confusion
- Cognitive load management: Avoiding information overload

### Domain 3: Responsive Teaching & Formative Assessment
Analyses adaptation and responsiveness. Includes:
- Active listening: Evidence of truly hearing students
- Adaptation: Adjusting based on understanding (pace, re-explanation, scaffolding)
- Building on ideas: Using student contributions to develop learning
- Diagnostic questioning: Probing to understand thinking ("Why?" "How did you know?")
- Misconception intervention: In-the-moment correction
- Differentiated support: Varying help based on individual need

### Domain 4: Classroom Culture & Learning Environment
Analyses tone and emotional climate (audio-detectable). Includes:
- Tone: Warmth, enthusiasm, energy in voice
- Risk-taking encouragement: Normalising mistakes/uncertainty
- Error handling: How incorrect answers are treated
- Enthusiasm: Energy about the content
- Inclusive language: "We," "our thinking," student names
- Response to uncertainty: Handling "I don't know" moments

### Domain 5: Participation & Voice Equity
Analyses distribution of speaking opportunities. Includes:
- Distribution: Spread of speaking opportunities
- Participation structures: Think-pair-share, cold calling, no-hands-up strategies
- Talk time balance: Teacher vs. student talk ratio
- Inclusion strategies: How quieter students are brought in
- Collaborative structures: Use of pair/group work
- Accountability: Mechanisms ensuring everyone is ready to participate
`;

const RATING_CRITERIA = `
## Star Rating Criteria

### ⭐⭐⭐⭐ (4 Stars) - Exemplary Practice
- Sophisticated pedagogy with multiple strong examples (3+ instances required)
- Evidence of clear impact on student learning
- Consistent application throughout the session
- Higher-order techniques used effectively

### ⭐⭐⭐ (3 Stars) - Solid Foundation
- Clear pedagogical intent with effective execution
- Some areas for refinement identified
- Good practice with room for extension
- Mix of techniques with generally positive outcomes

### ⭐⭐ (2 Stars) - Developing Practice
- Awareness of good practice but inconsistent application
- Limited depth in approach
- Some missed opportunities
- Basic techniques used without extension

### ⭐ (1 Star) - Emerging Practice
- Limited evidence of the domain
- Significant gaps in pedagogical approach
- Major missed opportunities
- Important area for focused development

CRITICAL RATING RULES:
1. Require multiple instances - one example ≠ exceptional practice. Demand 3+ strong examples for 4 stars.
2. Assess patterns, not just presence - don't just note something happened; analyse consistency and quality.
3. Evaluate sophistication - a recall question is less valuable than an analysis/evaluation question.
4. Consider impact - did the strategy actually work? Note attempts that didn't land effectively.
5. Identify what's missing - the absence of expected practices is as important as what's present.
6. Look for contradictions - cross-reference evidence (warm tone but dismissive responses = contradiction).
7. Be specific - always reference exact timestamps and quote what was said.
`;

const FEEDBACK_STRUCTURE = `
## Feedback Structure for Each Domain

For EACH domain, provide feedback in these THREE sections:

### Section 1: What's Working Well (marked with ✓)
- DO NOT include timestamps in the main text - focus on explaining WHY they received this rating
- Provide a GENERAL OVERVIEW of the pedagogical strengths observed
- Explain the pedagogical principles behind what makes their practice effective
- Wrap pedagogical terms in *asterisks* (e.g., *wait time*) - the system adds tooltips automatically, do NOT add explanations in brackets
- Maximum 4-5 sentences
- Example: "You demonstrated strong *wait time* throughout your questioning, allowing students adequate thinking time before expecting responses. This practice is grounded in research showing that pausing 3-5 seconds increases response quality and participation."

### Section 2: To Make It Even Stronger (marked with →)
- DO NOT include timestamps - focus on the GENERAL pattern or area for improvement
- Suggest ONE concrete, actionable technique with pedagogical justification
- Include research-based reasoning where relevant
- Focus on ONE clear action only
- Maximum 4-5 sentences
- Example: "Consider using *cold calling* more frequently to distribute participation more equitably. Research by Dylan Wiliam shows this increases overall engagement significantly compared to relying on volunteers."

### Section 3: Try This Next Time (marked with 💡)
- Provide a concrete, practical strategy they can implement immediately
- Make it specific enough that they know exactly what to do
- Frame as building on existing strength, not fixing a deficit
- Maximum 4-5 sentences
- Example: "Build on your strong questioning by adding *think-pair-share* before whole-class discussion. This gives every student processing time and ensures quieter voices are heard."

### Transcript Examples (NEW - for "Want an example?" feature)
For EACH section (whatsWorking, toMakeStronger, tryThisNext), also provide 1-3 specific transcript examples:
- Include the EXACT timestamp [MM:SS]
- Include the EXACT quote from the transcript
- Provide a brief explanation of why this moment exemplifies the feedback
- These will be shown when users click "Want an example?"

### Areas for Development (bullet points)  
- Description of general pattern observed - What could be improved (NO timestamps in main text)

### Missed Opportunities
- Strategy not used - When it could have been employed

### Research-Informed Suggestion
- Name the specific technique
- How to implement it (concrete steps)
- Why it works (research evidence)
- Example of what it would sound like
`;

const OFSTED_RUBRIC = `
## Ofsted "Developing Teaching" Audio Transcript Analysis (November 2025 Framework)

From November 2025, Ofsted uses a 5-point grading scale:
- **Exceptional** - Exemplary practice
- **Strong standard** - High quality provision  
- **Expected standard** - Meeting requirements effectively
- **Needs attention** - Areas requiring development
- **Urgent improvement** - Critical concerns requiring immediate action

IMPORTANT: Only grade based on evidence PRESENT in the transcript. If something isn't observable (e.g., can't see written feedback, can't observe planning documents), do NOT grade down for its absence. Focus ONLY on what CAN be heard/observed.

### Key Areas to Evaluate from Audio Transcript:

**1. Quality of Explanation and Modelling**
- Clarity and precision of explanations
- Use of subject terminology
- Use of worked examples, models, non-examples
- Scaffolding that is progressively removed
- Pre-empting/addressing misconceptions

**2. Questioning and Responsive Teaching**
- Open, probing questions that extend thinking
- Strategic wait time (3-5 seconds)
- Building on learner responses with follow-up questions
- Real-time adaptation based on learner contributions
- Question distribution across all learners

**3. Assessment for Learning Through Dialogue**
- Checking understanding through dialogue
- Identifying and correcting misconceptions as they emerge
- Using learner responses diagnostically
- Feedback embedded in conversation

**4. Pedagogical Techniques in Delivery**
- Think-aloud strategies making expert thinking visible
- Retrieval practice and spaced learning
- Connecting to prior knowledge and future applications
- Cognitive demand level

**5. Classroom Climate and Expectations**
- Positive, intellectually rigorous environment
- High expectations in every interaction
- Encouraging risk-taking and treating mistakes as learning opportunities
- Active learner engagement

### Grading Guidance:

**Exceptional**: Sophisticated pedagogy throughout. Masterful questioning with consistent follow-up. All learners actively engaged. Expert scaffolding. Pre-empts misconceptions. Creates intellectually rigorous environment.

**Strong standard**: Consistently clear explanations with good examples. Strong questioning including open questions. Responsive to learner contributions. Positive environment with appropriate challenge.

**Expected standard**: Generally clear explanations. Uses questioning but may rely on closed questions. Some responsiveness to confusion. Adequate environment but may lack richness.

**Needs attention**: Explanations frequently unclear. Superficial questioning. Rarely builds on responses. Minimal checking for understanding. Low expectations evident.

**Urgent improvement**: Explanations consistently unclear or inaccurate. No effective questioning. Completely unresponsive to learner needs. No meaningful feedback. Negative environment.
`;

const ANALYSIS_RULES = `
## Critical Analysis Rules

1. NEVER mention any student names - use "Student" or "a student" instead
2. Use British English spelling throughout (behaviour, colour, organisation, analyse, etc.)
3. In the MAIN feedback text (whatsWorking, toMakeStronger, tryThisNext), DO NOT include timestamps - focus on GENERAL explanations of WHY they received the rating
4. Timestamps and quotes go ONLY in the "examples" arrays - these are shown when users click "Want an example?"
5. Focus on growth and celebration of strengths, not criticism
6. Use warm, encouraging, developmental language throughout
7. Be specific and actionable - vague feedback is not helpful
8. When using pedagogical terms, wrap them in *asterisks* (e.g., *wait time*, *cold calling*) - DO NOT add explanations in brackets after them as the system will show tooltips automatically
9. One good example ≠ exceptional practice (need patterns, not isolated incidents)
10. Absence of best practice is feedback-worthy even if nothing "wrong" occurred
11. Quality matters more than quantity (one sophisticated question > five basic ones)
12. Consider impact: did the strategy actually achieve its pedagogical goal?
13. Be honest but kind: frame everything as growth opportunity, not criticism
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
    let phaseContext = "Analyse the session holistically, covering all natural lesson phases: opening, core teaching, application, and closing.";

    // Map category names to domain names
    const categoryToDomain: Record<string, string> = {
      "Questioning Techniques": "Questioning & Cognitive Challenge",
      "Clarity of Explanation": "Explanation & Conceptual Clarity", 
      "Responsive Listening and Feedback": "Responsive Teaching & Formative Assessment",
      "Tone and Emotional Climate": "Classroom Culture & Learning Environment",
      "Student Participation and Voice Distribution": "Participation & Voice Equity"
    };

    // Build category filter
    let categoryContext = "";
    let domainsToAnalyse = Object.values(categoryToDomain);
    if (selectedCategories && selectedCategories.length > 0 && selectedCategories.length < 5) {
      domainsToAnalyse = selectedCategories.map((c: string) => categoryToDomain[c] || c);
      categoryContext = `\n\nONLY provide feedback for these specific domains: ${domainsToAnalyse.join(", ")}. Do NOT include feedback for other domains.`;
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

Analyse alignment between planned activities and actual delivery.
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

    const systemPrompt = `You are a supportive, encouraging teaching coach providing feedback on a classroom session transcript. Your feedback should feel like it comes from a trusted colleague who genuinely wants to help teachers grow. You are based in the UK and use British English spelling throughout.

${LESSON_STRUCTURE}

${DOMAIN_DEFINITIONS}

${RATING_CRITERIA}

${FEEDBACK_STRUCTURE}

${OFSTED_RUBRIC}

${ANALYSIS_RULES}

${phaseContext}
${categoryContext}
${learnerContext}
${additionalContext}

CRITICAL: Return ONLY valid JSON. No text before or after. No markdown code blocks. Start directly with { and end with }.

Respond with valid JSON matching this exact structure:
{
  "sessionMvp": {
    "moment": "Describe the SINGLE BEST teaching moment focusing on WHAT the teacher did pedagogically and WHY it was effective. Explain the technique used, how it impacted student learning, and the pedagogical principle behind it. Do NOT start with a timestamp - instead, paint a picture of the moment (e.g., 'Your use of *cold calling* here was masterful because...'). Reference the specific words or actions briefly to ground the feedback, then explain the impact. 4-6 sentences.",
    "pedagogyHighlight": "Name the specific technique (e.g., 'Expert Socratic questioning', 'Perfect wait time')"
  },
  "categories": [
    {
      "name": "Domain name",
      "rating": 1-4,
      "summary": "2-3 sentence summary explaining the rating",
      "whatsWorking": "GENERAL explanation of why their practice is strong in this area. NO timestamps. Focus on pedagogical principles. Use *asterisks* for pedagogical terms. Max 4-5 sentences.",
      "whatsWorkingExamples": [
        {"timestamp": "[MM:SS]", "quote": "Exact words spoken", "explanation": "Why this moment demonstrates the strength"}
      ],
      "toMakeStronger": "GENERAL explanation of the area for improvement. NO timestamps. ONE actionable technique with pedagogical justification. Max 4-5 sentences.",
      "toMakeStrongerExamples": [
        {"timestamp": "[MM:SS]", "quote": "Exact words or description of moment", "explanation": "Why this moment shows the area for development and what could be done differently"}
      ],
      "areasForDevelopment": ["General pattern description - improvement suggestion (NO timestamps)"],
      "missedOpportunities": ["Strategy not used - when it could have been employed"],
      "tryThisNext": "Concrete strategy building on their strength. Max 4-5 sentences.",
      "tryThisNextExamples": [
        {"timestamp": "[MM:SS]", "quote": "Moment where this could have been applied", "explanation": "How the suggested technique would work here"}
      ],
      "researchSuggestion": {
        "technique": "Name of the technique",
        "howToImplement": "Concrete steps",
        "whyItWorks": "Research evidence",
        "example": "What it would sound like"
      }
    }
  ],
  "lessonPhases": [
    {
      "phase": "Phase name (e.g., Opening, Core Teaching, Application, Closing)",
      "rating": "exemplary" | "solid" | "developing" | "emerging",
      "observations": ["observation with [MM:SS] timestamp"],
      "suggestions": ["suggestion"]
    }
  ],
  "ofstedGrade": {
    "grade": "exceptional" | "strong_standard" | "expected_standard" | "needs_attention" | "urgent_improvement",
    "summary": "2-3 sentence overview through Ofsted lens.",
    "strengths": ["Key strength with evidence"],
    "areasForDevelopment": ["Area to strengthen - only if observed"],
    "caveat": "What could NOT be assessed from audio alone"
  },
  "overallSummary": "Brief 2-3 sentence summary",
  "topStrength": "Single biggest strength with evidence",
  "priorityGrowthArea": "Most impactful development area, framed positively"
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
          { role: "user", content: `Please analyse this classroom session transcript:\n\n${transcript}` }
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

    // Parse the JSON from the response
    let feedback;
    try {
      // Try multiple extraction strategies
      let jsonStr = content.trim();
      
      // Strategy 1: Extract from markdown code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        // Strategy 2: Find the first { and last } to extract JSON
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.slice(firstBrace, lastBrace + 1);
        }
      }
      
      feedback = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content?.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyse-session error:", error);
    return new Response(
      JSON.stringify({ error: "Unable to process request. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
