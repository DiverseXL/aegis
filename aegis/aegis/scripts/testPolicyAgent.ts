// scripts/testPolicyAgent.ts
// Quick standalone test of the policyParsingAgent — no Guardian wiring needed.
import { parsePolicy } from '../agents/policyParsingAgent';

async function main() {
  const testCases = [
    'No single payout over 10,000 tokens without a DAO vote. No more than 3 grants per sender per week.',
    'Pay contributors monthly, nothing crazy.', // vague — tests the "no limit stated" fallback
    'Maximum 500 tokens per stream, and no sender should create more than 2 streams per day.',
  ];

  for (const text of testCases) {
    console.log('\n=== Input ===');
    console.log(text);
    try {
      const result = await parsePolicy(text);
      console.log('=== Parsed PolicyConfig ===');
      console.log(JSON.stringify({
        maxAmountPerStream: result.policy.maxAmountPerStream.toString(),
        maxStreamsPerWindow: result.policy.maxStreamsPerWindow,
        windowSeconds: result.policy.windowSeconds,
      }, null, 2));
      if (result.warnings.length > 0) {
        console.log('Warnings:', result.warnings);
      }
    } catch (err) {
      console.error('FAILED:', err);
    }
  }
}

main();
