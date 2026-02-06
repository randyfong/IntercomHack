
import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/you';
import { generateCompletion, extractInsight, Message } from '@/lib/akash';
import { findRelevantInsights, saveInsight } from '@/lib/memory';

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Check Memory for context
        const pastInsights = findRelevantInsights(message);
        const contextString = pastInsights.length > 0
            ? `I found these relevant past insights from our memory:\n${pastInsights.map(i => `- ${i.insight}`).join('\n')}\n`
            : "No relevant past insights found.";

        // 2. Search You.com for real-time data
        const searchResults = await searchWeb(message);
        const searchContext = searchResults.map(r => `[${r.title}](${r.url}): ${r.snippet}`).join('\n\n');

        // 3. Construct the prompt for AkashML
        const systemPrompt = `You are a "Persistent Researcher", an intelligent agent that learns from every interaction.
    
    Your Goal: Answer the user's question comprehensively using the provided "Search Context" and "Memory Context".
    
    Memory Context (What you've learned before):
    ${contextString}
    
    Search Context (Real-time data):
    ${searchContext}
    
    Instructions:
    - Prioritize using the "Memory Context" to show you remember past lessons.
    - Use "Search Context" for up-to-date facts.
    - If the "Memory Context" contradicts the "Search Context", trust the fresher "Search Context" but acknowledge the change.
    - Be helpful, technical, and concise.`;

        const userMessage: Message = { role: 'user', content: message };
        const systemMessage: Message = { role: 'system', content: systemPrompt };

        // 4. Process via AkashML
        // Note: In a real streaming setup, we'd stream this. For MVP, we await.
        const answer = await generateCompletion([systemMessage, userMessage]);

        // 5. Learn: Extract and save insight (background task in a real app, awaited here for simplicity)
        // We don't want to block the response too long, but for this Hackathon demo, we'll do it inline 
        // to ensure the user sees the "Memory Updated" effect immediately in the UI if we return it.
        let newInsight = null;
        try {
            const insightText = await extractInsight(message, answer);
            if (insightText && insightText.length > 10) {
                newInsight = saveInsight(message, insightText);
            }
        } catch (err) {
            console.error("Learning failed:", err);
        }

        return NextResponse.json({
            answer,
            context: {
                memory: pastInsights,
                search: searchResults,
                new_insight: newInsight
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
