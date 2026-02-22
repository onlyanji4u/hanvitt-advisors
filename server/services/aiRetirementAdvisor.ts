import type { RetirementAIInput } from "@shared/schema";

export interface AIRecommendation {
  riskAssessment: string;
  savingsImprovementAdvice: string;
  inflationProtectionAdvice: string;
  assetAllocationSuggestion: string;
  retirementReadinessScore: number;
  behavioralAdvice: string;
  disclaimer: string;
}

const DISCLAIMER = "This is an educational estimate. Please consult Hanvitt Advisors for personalized financial advice.";

function buildPrompt(input: RetirementAIInput): string {
  const { calculationResult, userProfile } = input;
  const surplus = calculationResult.projectedCorpus - calculationResult.requiredCorpus;
  const hasShortfall = calculationResult.shortfall > 0;

  return `You are a certified financial advisor for Hanvitt Advisors, an Indian financial planning firm. Analyze the following retirement calculation results and provide structured advice.

IMPORTANT RULES:
- Do NOT generate or modify any financial numbers
- Do NOT promise specific returns
- Provide practical, actionable advice for an Indian investor
- Use Indian financial context (PPF, NPS, ELSS, FDs, EPF, mutual funds)
- All amounts referenced are in Indian Rupees (₹)
- Keep each advice section to 2-3 sentences max

CALCULATION RESULTS:
- Required Retirement Corpus: ₹${calculationResult.requiredCorpus.toLocaleString('en-IN')}
- Projected Corpus: ₹${calculationResult.projectedCorpus.toLocaleString('en-IN')}
- ${hasShortfall ? `Shortfall: ₹${calculationResult.shortfall.toLocaleString('en-IN')}` : `Surplus: ₹${Math.abs(surplus).toLocaleString('en-IN')}`}
- Monthly Expenses at Retirement: ₹${calculationResult.monthlyExpensesAtRetirement.toLocaleString('en-IN')}
- Additional Monthly SIP Needed: ₹${calculationResult.additionalMonthlySIPNeeded.toLocaleString('en-IN')}
- Current Savings Rate: ${calculationResult.savingsRate}%

USER PROFILE:
- Risk Tolerance: ${userProfile.riskTolerance}
${userProfile.incomeRange ? `- Income Range: ${userProfile.incomeRange}` : ''}
${userProfile.goalPriority ? `- Goal Priority: ${userProfile.goalPriority}` : ''}

Respond in this exact JSON format only:
{
  "riskAssessment": "assessment of their retirement risk position",
  "savingsImprovementAdvice": "specific advice to improve savings",
  "inflationProtectionAdvice": "how to protect against inflation",
  "assetAllocationSuggestion": "recommended asset mix based on risk profile",
  "retirementReadinessScore": <number 0-100>,
  "behavioralAdvice": "psychological and behavioral finance advice"
}`;
}

function generateFallbackRecommendation(input: RetirementAIInput): AIRecommendation {
  const { calculationResult, userProfile } = input;
  const hasShortfall = calculationResult.shortfall > 0;
  const savingsRate = calculationResult.savingsRate;

  let readinessScore = 50;
  if (!hasShortfall) readinessScore = 80;
  if (savingsRate > 30) readinessScore = Math.min(readinessScore + 15, 95);
  if (savingsRate < 10) readinessScore = Math.max(readinessScore - 20, 10);

  const riskMap = {
    low: "Consider a conservative mix of PPF, FDs, and debt mutual funds with 20-30% in large-cap equity index funds.",
    moderate: "A balanced portfolio of 50-60% equity (large + mid-cap funds), 30% debt funds, and 10-20% in NPS/PPF could suit your profile.",
    high: "With your higher risk tolerance, consider 70-80% equity allocation across diversified, mid-cap, and small-cap funds, with remaining in debt instruments.",
  };

  return {
    riskAssessment: hasShortfall
      ? `Your projected corpus falls short of your retirement needs. With a savings rate of ${savingsRate}%, you'll need to increase your monthly investments to close the gap.`
      : `You're on track for retirement. Your projected corpus exceeds the required amount, indicating good financial discipline.`,
    savingsImprovementAdvice: savingsRate < 20
      ? "Aim to save at least 20-30% of your income. Start by automating SIP investments and cutting discretionary spending."
      : "Your savings rate is healthy. Consider stepping up your SIP by 10% annually to accelerate corpus growth.",
    inflationProtectionAdvice: "Equity investments historically outpace inflation in India. Consider ELSS funds for tax benefits under Section 80C while building an inflation-resistant portfolio.",
    assetAllocationSuggestion: riskMap[userProfile.riskTolerance],
    retirementReadinessScore: readinessScore,
    behavioralAdvice: "Stay disciplined with your SIPs regardless of market conditions. Avoid withdrawing retirement savings early and review your plan annually with a financial advisor.",
    disclaimer: DISCLAIMER,
  };
}

export async function getAIRetirementAnalysis(input: RetirementAIInput): Promise<AIRecommendation> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    console.warn("HUGGINGFACE_API_KEY not set, using fallback recommendations");
    return generateFallbackRecommendation(input);
  }

  const prompt = buildPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      "https://router.huggingface.co/novita/v3/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v3-0324",
          messages: [
            {
              role: "system",
              content: "You are a certified Indian financial advisor. Respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside JSON."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 1024,
          temperature: 0.2,
          stream: false,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      console.error(`Hugging Face API error: ${response.status} - ${errorText}`);
      return generateFallbackRecommendation(input);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Empty response from Hugging Face API");
      return generateFallbackRecommendation(input);
    }

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const score = Number(parsed.retirementReadinessScore);
    if (isNaN(score) || score < 0 || score > 100) {
      parsed.retirementReadinessScore = generateFallbackRecommendation(input).retirementReadinessScore;
    }

    return {
      riskAssessment: String(parsed.riskAssessment || ""),
      savingsImprovementAdvice: String(parsed.savingsImprovementAdvice || ""),
      inflationProtectionAdvice: String(parsed.inflationProtectionAdvice || ""),
      assetAllocationSuggestion: String(parsed.assetAllocationSuggestion || ""),
      retirementReadinessScore: Math.round(Math.max(0, Math.min(100, score))),
      behavioralAdvice: String(parsed.behavioralAdvice || ""),
      disclaimer: DISCLAIMER,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.error("Hugging Face API call timed out after 15s");
    } else {
      console.error("AI analysis error:", err instanceof Error ? err.message : "unknown");
    }
    return generateFallbackRecommendation(input);
  }
}
