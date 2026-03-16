

# Implementation Plan: Role-Based Branching & ITTECF Integration

## Overview
Add a role selection screen ("Teacher Training Student" vs "Teaching Staff"), then branch the trainee path with new assessment model, ITTECF indicators, Standard English rating, and updated UI. Staff path stays unchanged.

---

## 1. Role Selection Screen
**File: `src/components/WelcomeScreen.tsx`**
- Add `UserRole = "trainee" | "staff"` type export
- Add `onSelectRole` prop and `selectedRole` prop
- After clicking "I Want Feedback", show a new intermediate screen with two circular cards before mode selection:
  - "I am a Teacher Training Student" (GraduationCap icon)
  - "I am a Teaching Member of Staff" (Briefcase icon)
- Only show mode selection after role is chosen

## 2. Pass `userRole` Through the Flow
**File: `src/pages/Index.tsx`**
- Add `userRole` state (`"trainee" | "staff" | null`)
- Pass `userRole` to `WelcomeScreen` and to `useSessionAnalysis`
- Pass `userRole` to `FeedbackReport` for conditional rendering
- Reset `userRole` on home/reset

**File: `src/hooks/useSessionAnalysis.ts`**
- Accept `userRole` parameter (or pass it through `generateFeedback`)
- Pass `userRole` in the body to the `analyze-session` edge function

## 3. Update Learner Levels & Session Duration
**File: `src/components/AudioRecorder.tsx`**
- Add to `LEARNER_LEVELS`: Primary, KS1, KS2 (before KS3)
- Change duration guidance text from "15-20 minutes" to "8-12 minutes"

**File: `src/components/SessionCapture.tsx`**
- Same duration text update if present

## 4. Trainee-Specific Edge Function Prompt
**File: `supabase/functions/analyze-session/index.ts`**
- When `userRole === "trainee"`:
  - Replace `RATING_CRITERIA` (star ratings) with **Progression Stages**: Developing, Establishing, Embedding
  - Remove `OFSTED_RUBRIC` entirely — no `ofstedGrade` in output
  - Remove `lessonPhases` from output schema
  - Add **Standard English Usage** section to prompt: rating out of 10, with `instances[]` containing `timestamp`, `original`, `corrected`, `explanation`
  - Add **ITTECF "Learn how to..." indicators** section: embed the key statements from Standards 1-8, request 6-10 indicators with `standard`, `subCode`, `statement`, `status` (demonstrated/not_yet_evidenced), `evidence`
  - Update learner context to explicitly instruct AI to tailor all feedback to the learner level
  - Change JSON schema: `rating` becomes string ("developing"/"establishing"/"embedding"), add `standardEnglish` and `ittecfIndicators` fields
- When `userRole === "staff"` (or missing): keep existing prompt unchanged

## 5. Update FeedbackReport for Trainee Path
**File: `src/components/FeedbackReport.tsx`**
- Add `userRole` prop
- **Remove Lesson Phases section** entirely (for all users as requested)
- Remove lesson phases from download HTML template too
- **Trainee-specific rendering:**
  - Replace star ratings with "Progression Stage: Developing / Establishing / Embedding" badges (colour-coded)
  - Remove Ofsted grade badge from summary section
  - Add new **Standard English Usage** card: score out of 10, list of timestamped instances with original/corrected text
  - Add new **ITTECF Indicators** card: "📋 ITT & Early Career Framework — Learn How To... Indicators" with status tags (✓ Demonstrated / ○ Not yet evidenced) and evidence sentences
  - Update download HTML template with these trainee sections
- **Staff rendering:** unchanged (stars, Ofsted badge remain)

## 6. Update FeedbackData Types
**File: `src/hooks/useSessionAnalysis.ts`**
- Add to `FeedbackData` interface:
  - `standardEnglish?: { rating: number; instances: Array<{ timestamp: string; original: string; corrected: string; explanation: string }> }`
  - `ittecfIndicators?: Array<{ standard: string; subCode: string; statement: string; status: "demonstrated" | "not_yet_evidenced"; evidence: string }>`
  - Make `rating` in `CategoryFeedback` accept `number | string` to handle progression stages

---

## Technical Notes
- The ITTECF PDF contains "Learn how to..." statements across Standards 1-8. Key audio-observable statements (approx 40-50) will be embedded in the trainee prompt covering: questioning, explanation, adaptive teaching, assessment, behaviour, and classroom practice.
- Staff path is completely untouched — same star ratings, Ofsted, everything.
- Edge function will conditionally build prompt based on `userRole` field in request body.

