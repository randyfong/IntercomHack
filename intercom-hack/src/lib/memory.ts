
import fs from 'fs';
import path from 'path';

const MEMORY_FILE_PATH = path.join(process.cwd(), 'data', 'memory.json');

export interface Insight {
    id: string;
    query: string;
    insight: string;
    timestamp: string;
    tags?: string[];
}

// Ensure data directory exists
function ensureDataDir() {
    const dir = path.dirname(MEMORY_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadMemory(): Insight[] {
    ensureDataDir();
    if (!fs.existsSync(MEMORY_FILE_PATH)) {
        return [];
    }
    try {
        const data = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Failed to load memory:", err);
        return [];
    }
}

function saveMemory(memory: Insight[]) {
    ensureDataDir();
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memory, null, 2));
}

export function saveInsight(query: string, insightText: string) {
    // Prevent saving error messages as insights
    if (
        insightText.includes("API Key missing") ||
        insightText.includes("Error calling Akash") ||
        insightText.includes("mock response") ||
        insightText.includes("encountered an error")
    ) {
        console.warn("Skipping saving of error message as insight:", insightText);
        return null;
    }

    const memory = loadMemory();
    const newInsight: Insight = {
        id: Date.now().toString(),
        query,
        insight: insightText,
        timestamp: new Date().toISOString(),
        tags: extractKeywords(query) // Simple keyword extraction
    };
    memory.push(newInsight);
    saveMemory(memory);
    return newInsight;
}

export function findRelevantInsights(query: string): Insight[] {
    const memory = loadMemory();
    const queryKeywords = extractKeywords(query);

    // Simple implementation: Find insights that share keywords with the query
    // In a real production app, we would use vector embeddings here.
    const relevant = memory.filter(item => {
        // Check for keyword overlap
        const itemKeywords = extractKeywords(item.query + " " + item.insight);
        const overlap = queryKeywords.filter(k => itemKeywords.includes(k));

        // Return if there is meaningful overlap (e.g., at least 1 keyword for now)
        return overlap.length > 0;
    });

    // Sort by relevance (number of matching keywords)
    relevant.sort((a, b) => {
        const aKeywords = extractKeywords(a.query + " " + a.insight);
        const bKeywords = extractKeywords(b.query + " " + b.insight);

        const aOverlap = queryKeywords.filter(k => aKeywords.includes(k)).length;
        const bOverlap = queryKeywords.filter(k => bKeywords.includes(k)).length;

        return bOverlap - aOverlap;
    });

    return relevant.slice(0, 3); // Return top 3
}

// Helper: extremely simple stopword removal and tokenization
function extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'how', 'what', 'why', 'do', 'does', 'did', 'to', 'for', 'in']);
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
}
