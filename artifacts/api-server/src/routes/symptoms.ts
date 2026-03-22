import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

router.post("/symptoms/check", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { symptoms } = req.body;
  if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
    res.status(400).json({ error: "Please describe your symptoms" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a medical triage assistant. Given a patient's symptoms, provide:
1. Up to 3 possible conditions with probability (High/Medium/Low) and brief description
2. A recommended hospital department to visit
3. Brief general health advice

IMPORTANT: Always include a disclaimer that this is not a medical diagnosis.

Respond in this exact JSON format:
{
  "conditions": [{"name": "...", "probability": "High|Medium|Low", "description": "..."}],
  "recommendedDepartment": "...",
  "advice": "..."
}`
        },
        {
          role: "user",
          content: `My symptoms are: ${symptoms}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    const parsed = JSON.parse(content);
    res.json({
      conditions: parsed.conditions || [],
      recommendedDepartment: parsed.recommendedDepartment || "General Medicine",
      advice: parsed.advice || "Please consult a doctor for proper diagnosis.",
    });
  } catch (err: any) {
    if (err?.code === 'insufficient_quota') {
      res.status(429).json({ error: "AI service temporarily unavailable (quota exceeded). Please try again later or contact support." });
      return;
    }
    console.error("Symptom check error:", err);
    res.status(500).json({ error: "Failed to analyze symptoms" });
  }
});

export default router;
