

# Fix: Standard English not generating, ITT symbols broken, Closing phase removal

## Issues Found

1. **Standard English not generating**: The AI request has no `maxOutputTokens` set. The trainee prompt is very large (ITTECF standards, progression criteria, Standard English section, etc.) and the model is likely truncating output before reaching the `standardEnglish` and `ittecfIndicators` fields at the end of the JSON.

2. **ITT section bizarre symbols**: The title on line 936 contains a raw emoji `📋` that's being rendered as mojibake (`ðŸ"‹`). Same issue on line 950 (`✓` → `âœ"`) and line 993 (`💪` → garbage). This is a UTF-8 encoding issue in the source file — the characters are stored incorrectly.

3. **Closing phase**: Already removed from the prompt (line 18 says "Do NOT include a Closing phase"), but the lesson phases still include "Opening" which may not always be present. The prompt already says to omit absent phases, but the staff lesson phase section still renders whatever the AI returns. No code change needed for "Closing" — it's already excluded. For "Opening", the prompt already handles it ("omit it entirely... rather than fabricating commentary").

## Plan

### Step 1: Fix token truncation — add `maxOutputTokens` to edge function
**File: `supabase/functions/analyze-session/index.ts` (line ~616)**
- Add `max_tokens: 8192` to the request body JSON to ensure the full response including `standardEnglish` and `ittecfIndicators` is generated

### Step 2: Fix emoji/symbol encoding in FeedbackReport
**File: `src/components/FeedbackReport.tsx`**
- Line 936: Replace `ðŸ"‹ ITT & Early Career Framework` with plain text `ITT & Early Career Framework` (the icon is already provided by the `<Target>` lucide icon next to it)
- Line 950: Replace `âœ"` with `✓` and `â—‹` with `○` — or better, use simple ASCII characters that won't have encoding issues: `✓` → `"✓"` using a proper Unicode escape or just the word, and `○` → `"○"`
- Line 993: Replace the mojibake `ðŸ'ª` with a clean emoji or remove it
- Line 848: Fix `â€¢` → proper bullet `•`
- Line 865: Fix `â†'` → proper arrow `→`

### Step 3: Reinforce "no Closing, Opening optional" in lesson phase prompt
**File: `supabase/functions/analyze-session/index.ts`**
- The `LESSON_STRUCTURE` already says no Closing. Update the staff JSON schema comment on line 590 to also reinforce: "Only include phases genuinely evidenced. If no opening is present, omit it."
- Update the `phaseContext` variable (line 387) to also state "If there is no clear Opening, omit it entirely."

### Technical Details
- The `max_tokens` parameter ensures the model doesn't silently truncate the JSON output, which is the most likely cause of Standard English being empty
- The encoding fix replaces mojibake characters with proper Unicode or ASCII equivalents
- No structural changes to the UI or data flow

