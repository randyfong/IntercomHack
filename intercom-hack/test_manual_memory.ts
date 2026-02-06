import { saveInsight, findRelevantInsights } from './src/lib/memory.ts';

// Mock the flow
const question = "What is the capital of Mars?";
const manualAnswer = "The answer is: The capital of Mars is Elonville.";

console.log(`\n--- Simulating User Q: "${question}" ---`);
// In real app, this would happen in the API
// ... bot searches, finds nothing ...

console.log(`\n--- Simulating User A: "${manualAnswer}" ---`);
console.log("Saving to memory...");
const insight = saveInsight(question, manualAnswer);
console.log("Saved Insight:", insight);

console.log(`\n--- Simulating User Q Again: "${question}" ---`);
const recalls = findRelevantInsights(question);
console.log("Recalled Insights:", recalls);

if (recalls.some(r => r.insight === manualAnswer)) {
    console.log("\n✅ SUCCESS: Manual answer was recalled!");
} else {
    console.error("\n❌ FAILURE: Manual answer not found.");
}
