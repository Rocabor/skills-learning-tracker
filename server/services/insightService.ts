import { GoogleGenAI } from '@google/genai';

export interface AIInsights {
  summary: string;
  highlights: string[];
  recommendation: string;
  reflectionPrompt: string;
  streakMotivation?: string;
  generatedAt: string;
}

export interface InsightsInput {
  skills?: { name: string }[];
  sessions?: { skillId: string; durationMinutes: number; date: string }[];
  overallStats?: {
    totalHours?: number;
    currentStreak?: number;
    longestStreak?: number;
    activeSkillsCount?: number;
  };
}

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/** Local fallback used when no AI provider is configured. */
function noKeyFallback(input: InsightsInput): AIInsights {
  const topSkill = input.skills && input.skills.length > 0 ? input.skills[0].name : 'your primary skill';
  return {
    summary: `You've accumulated ${input.overallStats?.totalHours || 0} hours of focused practice across ${input.skills?.length || 0} skills with an active ${input.overallStats?.currentStreak || 0}-day streak. Consistency in ${topSkill} is building solid momentum.`,
    highlights: [
      `Strong momentum in ${topSkill} with active practice sessions`,
      'Balanced focus between deliberate deep sessions and consistent daily touches',
      `${input.overallStats?.activeSkillsCount || 0} active skills in your dashboard`,
    ],
    recommendation: 'Consider scheduling a short 20-minute consolidation session on weekdays to protect your streak.',
    reflectionPrompt: 'What is one concept or technique you unlocked this week that surprised you?',
    streakMotivation: `You're currently holding an active ${input.overallStats?.currentStreak || 0}-day streak. Keep the chain unbroken!`,
    generatedAt: new Date().toISOString(),
  };
}

/** Generic fallback returned when the AI provider call fails. */
export function fallbackInsights(): AIInsights {
  return {
    summary: "You've demonstrated consistency across your skills. Logging sessions consistently is the most reliable predictor of long-term mastery.",
    highlights: [
      'Active streak maintained across multiple disciplines',
      'Diverse session durations accommodating different daily energy levels',
      'Rich session reflections recorded for future review',
    ],
    recommendation: 'Try setting a fixed time window for your highest priority skill to build automatic habit momentum.',
    reflectionPrompt: 'What was the most challenging obstacle you overcame during your last session?',
    streakMotivation: 'Every day you log practice cements your identity as a deliberate learner.',
    generatedAt: new Date().toISOString(),
  };
}

/** Generates AI practice insights, falling back to a local summary without a provider. */
export async function generateInsights(input: InsightsInput): Promise<AIInsights> {
  const ai = getGenAI();
  if (!ai) {
    return noKeyFallback(input);
  }

  const prompt = `You are an elite, encouraging practice coach for SkillTrack (a personal learning journal).
Analyze this learner's practice log and output a structured JSON assessment.

Data summary:
Total hours: ${input.overallStats?.totalHours || 0}h
Current streak: ${input.overallStats?.currentStreak || 0} days
Longest streak: ${input.overallStats?.longestStreak || 0} days
Skills: ${JSON.stringify(input.skills?.map((s) => ({ name: s.name })))}
Recent practice sessions sample: ${JSON.stringify(input.sessions?.slice(0, 15).map((s) => ({ skillId: s.skillId, duration: s.durationMinutes, date: s.date })))}

Return ONLY valid JSON matching this schema:
{
  "summary": "1-2 sentence motivating summary of recent practice patterns",
  "highlights": ["3 bullet points celebrating specific achievements or consistency patterns"],
  "recommendation": "1 actionable, practical advice for optimizing practice or maintaining momentum",
  "reflectionPrompt": "1 thought-provoking question related to their learning",
  "streakMotivation": "1 punchy encouragement about their current streak"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '';
  const parsed = JSON.parse(text);

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}
