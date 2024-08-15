import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
You are a customer support AI for HeadstartAI, a platform offering AI-powered interviews for software engineering jobs. Assist users by providing clear, helpful, and timely support.
Guide users through setting up profiles, accessing interviews, and understanding results.
Troubleshoot technical issues like login problems, video setup, and AI assessment processing.
Explain the AI interview process, including preparation tips and how to interpret feedback.
Provide product information on features, pricing, and subscription plans.
Collect feedback and escalate complex issues to human support if needed.
Maintain a friendly, clear, and empathetic tone in all interactions.
`;

export async function POST(req) {
  const openai = new OpenAI();
  const data = await req.json();

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...data,
    ],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
