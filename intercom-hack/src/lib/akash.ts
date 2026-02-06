
const AKASH_API_KEY = process.env.AKASH_API_KEY;
const AKASH_BASE_URL = process.env.AKASH_BASE_URL || 'https://chatapi.akash.network/api/v1';
const AKASH_MODEL = process.env.AKASH_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCompletion(messages: Message[]) {
  if (!AKASH_API_KEY) {
    console.warn("AKASH_API_KEY is not set. Mocking response.");
    return "This is a mock response from AkashML (API Key missing).";
  }

  try {
    const response = await fetch(`${AKASH_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AKASH_API_KEY}`
      },
      body: JSON.stringify({
        model: AKASH_MODEL,
        messages: messages,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`Akash API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Akash:", error);
    return "Sorry, I encountered an error processing your request via AkashML.";
  }
}

export async function extractInsight(query: string, answer: string): Promise<string> {
  const prompt = `
   Analyze the following Q&A interaction and extract a single, concise "Key Insight" or "Rule of Thumb" that would be valuable to remember for future similar questions.
   
   Question: ${query}
   Answer: ${answer}
   
   Return ONLY the insight statement. No preamble.
   `;

  const messages: Message[] = [
    { role: 'system', content: 'You are an expert researcher building a knowledge base.' },
    { role: 'user', content: prompt }
  ];

  return await generateCompletion(messages);
}
