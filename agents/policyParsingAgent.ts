// agents/policyParsingAgent.ts
//
// Aegis Policy-Parsing Agent — converts a DAO's plain-English spending policy
// into the structured PolicyConfig consumed by the Payout Guardian.
//
// Design principle: the LLM only PROPOSES a structured policy. It never
// takes effect until it passes strict validation against sane bounds and
// (in a real deployment) a human/DAO confirms it. This agent does NOT have
// authority to silently change what the Guardian enforces.

import OpenAI from 'openai';
import type { PolicyConfig } from './payoutGuardian';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedPolicyResult {
  policy: PolicyConfig;
  rawModelOutput: string;
  warnings: string[];
}

const SYSTEM_PROMPT = `You convert a DAO's plain-English spending policy into a strict JSON object.

Output ONLY valid JSON matching this exact shape, nothing else — no prose, no markdown fences:
{
  "maxAmountPerStream": <integer, in whole token units, the max single-stream amount allowed>,
  "maxStreamsPerWindow": <integer, max number of streams one sender can create in the time window>,
  "windowSeconds": <integer, the time window in seconds for the rate check>
}

Rules:
- If the policy doesn't mention a rate limit, use a conservative default: maxStreamsPerWindow=5, windowSeconds=3600.
- If the policy doesn't mention an amount limit, use maxAmountPerStream=0 to signal "no limit stated" — never invent a number that wasn't implied by the text.
- Never output anything except the JSON object.`;

function validatePolicy(candidate: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof candidate !== 'object' || candidate === null) {
    return { valid: false, errors: ['Model output is not a JSON object'] };
  }
  const c = candidate as Record<string, unknown>;

  if (typeof c.maxAmountPerStream !== 'number' || c.maxAmountPerStream < 0) {
    errors.push('maxAmountPerStream must be a non-negative number');
  }
  if (typeof c.maxStreamsPerWindow !== 'number' || c.maxStreamsPerWindow < 1 || c.maxStreamsPerWindow > 1000) {
    errors.push('maxStreamsPerWindow must be between 1 and 1000 (sanity bound against model hallucination)');
  }
  if (typeof c.windowSeconds !== 'number' || c.windowSeconds < 60 || c.windowSeconds > 30 * 24 * 3600) {
    errors.push('windowSeconds must be between 60 seconds and 30 days (sanity bound)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parses a plain-English DAO policy into a PolicyConfig.
 * Throws if the model output fails validation — callers must NOT fall back
 * to applying partially-valid or unvalidated output.
 */
export async function parsePolicy(policyText: string): Promise<ParsedPolicyResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: policyText },
    ],
  });

  const rawModelOutput = response.choices[0]?.message?.content ?? '';

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawModelOutput);
  } catch {
    throw new Error(`Policy-parsing agent: model output was not valid JSON: ${rawModelOutput}`);
  }

  const { valid, errors } = validatePolicy(parsed);
  if (!valid) {
    throw new Error(`Policy-parsing agent: parsed policy failed validation: ${errors.join('; ')}`);
  }

  // Convert JSON number to bigint to match PolicyConfig type (the Payout Guardian
  // compares amounts using BigInt arithmetic — passing a number would cause
  // TypeError: Cannot mix BigInt and other types at runtime).
  const policy: PolicyConfig = {
    maxAmountPerStream: BigInt(parsed.maxAmountPerStream as number),
    maxStreamsPerWindow: parsed.maxStreamsPerWindow as number,
    windowSeconds: parsed.windowSeconds as number,
  };

  const warnings: string[] = [];
  if (policy.maxAmountPerStream === 0n) {
    warnings.push('No amount limit detected in policy text — Guardian will not flag any amount as anomalous.');
  }

  return {
    policy,
    rawModelOutput,
    warnings,
  };
}
