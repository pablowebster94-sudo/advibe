# VentAds AI Orchestrator

VentAds uses a server-side three-agent pipeline:

1. Gemini — market analysis and strategy.
2. Claude — direct-response Meta Ads copy.
3. OpenAI — art direction and visual prompts.

The existing deterministic engines remain the safety fallback and continue to enforce the rule that product facts must come only from the ProductBrief.

## Configuration

Set these variables in Vercel/server only:

- GEMINI_API_KEY
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- GEMINI_MODEL (default: gemini-3.6-flash)
- ANTHROPIC_MODEL (default: claude-sonnet-5)
- OPENAI_MODEL (default: gpt-5.6)

If a provider is missing or fails, VentAds returns a fallback status and uses deterministic content instead of failing the whole campaign.

## Contract

POST /api/generate-ad-campaign accepts a persisted productId plus optional campaign context: clientDescription, productDescription, objective, budget, location, imageUrl and clientUrl.

The endpoint returns analysis, exactly 3 variants and providerStatus.

API keys never reach browser code.

## Human QA

AI output is always a draft. VentAds does not publish directly to Meta. Publication must remain a separate, explicitly approved integration.
