import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

// Pedagogical terms with detailed explanations
const PEDAGOGICAL_TERMS: Record<string, { short: string; detailed: string }> = {
  "wait time": {
    short: "The pause after asking a question",
    detailed: "Wait time is the duration a teacher pauses after asking a question before calling on a student or rephrasing. Research by Mary Budd Rowe found that extending wait time to 3-5 seconds increases both the length and quality of student responses, encourages more students to participate, and promotes higher-order thinking."
  },
  "cold calling": {
    short: "Randomly selecting students to respond",
    detailed: "Cold calling is a technique where teachers call on students to answer questions regardless of whether they've raised their hands. When done supportively, it increases engagement because all students know they might be called upon. It also provides better formative assessment data and ensures quieter students have a voice."
  },
  "think-pair-share": {
    short: "Think alone, discuss with partner, share with class",
    detailed: "Think-Pair-Share is a cooperative learning strategy where students first think individually about a question, then discuss their ideas with a partner, and finally share with the whole class. This scaffolds participation, gives processing time, and ensures every student engages with the content before whole-class discussion."
  },
  "scaffolding": {
    short: "Breaking complex tasks into manageable steps",
    detailed: "Scaffolding refers to instructional techniques that break down learning into chunks, providing temporary supports that help students achieve higher levels of understanding. Like construction scaffolding, these supports are gradually removed as students develop competency. This comes from Vygotsky's Zone of Proximal Development theory."
  },
  "bloom's taxonomy": {
    short: "Hierarchy of thinking skills",
    detailed: "Bloom's Taxonomy is a framework classifying educational learning objectives into levels of complexity: Remember, Understand, Apply, Analyze, Evaluate, and Create. Lower-order skills (Remember, Understand) involve recalling facts, while higher-order skills (Analyze, Evaluate, Create) require deeper cognitive processing and critical thinking."
  },
  "multiple entry points": {
    short: "Different ways to access the same content",
    detailed: "Multiple entry points is a differentiation strategy providing various ways for students to engage with content based on their readiness, interests, or learning preferences. This might include visual, auditory, or kinesthetic approaches, or varying complexity levels while maintaining the same core learning objective."
  },
  "cognitive load": {
    short: "Mental effort required to process information",
    detailed: "Cognitive Load Theory, developed by John Sweller, explains how the brain processes new information. When too much information is presented at once, working memory becomes overloaded and learning suffers. Effective teaching manages cognitive load by breaking content into chunks, eliminating extraneous information, and building on prior knowledge."
  },
  "formative assessment": {
    short: "Checking understanding during learning",
    detailed: "Formative assessment is ongoing evaluation during the learning process, used to monitor student progress and inform instruction. Unlike summative assessment (tests at the end), formative assessment provides real-time feedback that helps teachers adjust their teaching and helps students identify areas for improvement."
  },
  "higher-order questioning": {
    short: "Questions requiring analysis, evaluation, or creation",
    detailed: "Higher-order questions require students to think beyond simple recall. Based on Bloom's Taxonomy, these questions ask students to analyze (break down information), evaluate (make judgments), or create (produce new ideas). Examples include 'Why do you think...?', 'What evidence supports...?', and 'How would you improve...?'"
  },
  "distributed practice": {
    short: "Spreading learning over time",
    detailed: "Distributed practice (also called spaced practice) involves spreading learning sessions over time rather than massing them together (cramming). Research consistently shows this leads to better long-term retention. The 'spacing effect' is one of the most robust findings in cognitive psychology."
  },
  "checking for understanding": {
    short: "Verifying students grasp concepts before moving on",
    detailed: "Checking for understanding (CFU) involves using various techniques to verify student comprehension during instruction. Effective CFU goes beyond asking 'Does everyone understand?' and includes specific probing questions, exit tickets, thumbs up/down, or quick written responses that reveal actual understanding."
  },
  "eliciting responses": {
    short: "Drawing out student thinking and participation",
    detailed: "Eliciting responses refers to techniques teachers use to encourage students to share their thinking. This includes strategic questioning, providing adequate wait time, using non-verbal cues, and creating a safe classroom environment where students feel comfortable taking intellectual risks."
  },
  "differentiation": {
    short: "Adapting instruction to meet individual needs",
    detailed: "Differentiation is the practice of modifying instruction to meet diverse student needs. This can involve differentiating content (what students learn), process (how they learn it), product (how they demonstrate learning), or environment. The goal is ensuring all students can access and engage with meaningful learning."
  },
  "metacognition": {
    short: "Thinking about one's own thinking",
    detailed: "Metacognition is awareness and understanding of one's own thought processes. Teaching metacognitive strategies helps students plan their approach to learning, monitor their comprehension, and evaluate their progress. Research shows explicit metacognitive instruction significantly improves learning outcomes."
  },
  "zone of proximal development": {
    short: "The gap between what students can do alone vs. with help",
    detailed: "Vygotsky's Zone of Proximal Development (ZPD) describes the space between what a learner can accomplish independently and what they can achieve with guidance. Effective instruction targets this zone, providing appropriate challenge with sufficient support to promote growth."
  }
};

interface PedagogicalTooltipProps {
  term: string;
  children?: React.ReactNode;
}

export function PedagogicalTooltip({ term, children }: PedagogicalTooltipProps) {
  const termLower = term.toLowerCase();
  const termData = PEDAGOGICAL_TERMS[termLower];
  
  if (!termData) {
    return <span>{children || term}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-primary/50 text-primary font-medium">
            {children || term}
            <HelpCircle className="w-3.5 h-3.5 text-primary/70" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-sm p-4 bg-popover border border-border shadow-lg"
          side="top"
        >
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{term}</p>
            <p className="text-sm text-muted-foreground italic">{termData.short}</p>
            <p className="text-sm text-foreground leading-relaxed">{termData.detailed}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to parse text and replace pedagogical terms with tooltips
export function parsePedagogicalTerms(text: string): React.ReactNode[] {
  const terms = Object.keys(PEDAGOGICAL_TERMS);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  
  // Create regex pattern for all terms (case insensitive)
  const pattern = new RegExp(
    `\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );
  
  let match;
  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the tooltip for the matched term
    parts.push(
      <PedagogicalTooltip key={key++} term={match[1]}>
        {match[0]}
      </PedagogicalTooltip>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
}

export { PEDAGOGICAL_TERMS };
