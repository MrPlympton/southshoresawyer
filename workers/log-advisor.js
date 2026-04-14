/**
 * Cloudflare Worker: /api/log-advisor
 * Deploy to: https://southshoresawyer.com/api/log-advisor
 *
 * Set environment variable: ANTHROPIC_API_KEY
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://southshoresawyer.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { prompt } = await request.json();

      if (!prompt || prompt.trim().length < 10) {
        return new Response(
          JSON.stringify({ error: 'Please describe your log in more detail.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 600,
          system: `You are an expert sawmill operator with 20+ years of experience milling hardwoods
and softwoods on a Woodland Mills WM3 bandsaw mill on the South Shore of Massachusetts.

When someone describes a log, give them:
1. The best cutting strategy (through-and-through, quarter sawn, live sawn, etc.)
2. Estimated board feet yield
3. What they can realistically build from this log
4. Any warnings about defects, drying challenges, or species-specific issues

Be specific, practical, and honest. Speak like a knowledgeable mill operator,
not a textbook. Keep responses to 3–4 short paragraphs.`,
          messages: [
            {
              role: 'user',
              content: `I have this log: ${prompt}\n\nWhat's the best approach for milling it and what can I build with it?`,
            },
          ],
        }),
      });

      const data = await response.json();
      const advice = data.content?.[0]?.text || 'Unable to generate advice. Please try again.';

      return new Response(
        JSON.stringify({ advice }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...corsHeaders,
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Server error. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  },
};
