
const YOU_API_KEY = process.env.YOU_API_KEY;

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
    if (!YOU_API_KEY) {
        console.warn("YOU_API_KEY is not set. Returning mock results.");
        return [
            {
                title: "Mock Result: You.com API",
                url: "https://you.com",
                snippet: "This is a placeholder result because the YOU_API_KEY environment variable is not set."
            }
        ];
    }

    try {
        const response = await fetch(`https://api.ydc-index.io/search?query=${encodeURIComponent(query)}&num_web_results=3`, {
            method: 'GET',
            headers: {
                'X-API-Key': YOU_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`You.com API Error: ${response.statusText}`);
        }

        const data = await response.json();
        // Map the specific You.com response format to our simple interface
        // Note: You.com API structure may vary, adapting to common 'hits' structure
        const results = data.hits?.map((hit: Record<string, unknown>) => ({
            title: hit.title,
            url: hit.url,
            snippet: (hit.snippets as string[])?.join(' ') || (hit.description as string) || ''
        })) || [];

        return results;
    } catch (error) {
        console.error("Error searching You.com:", error);
        return [];
    }
}
