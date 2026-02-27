/**
 * Vercel Serverless Function — AI Testing Actions
 * Route: POST /api/ai/{action}
 *
 * ESM format (required by "type": "module" in package.json).
 * Uses OPENROUTER_API_KEY from Vercel environment variables.
 */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ detail: 'POST only' });

    try {
        const action = req.query.action;
        const body = req.body || {};
        const code = body.code || '';
        const language = body.language || 'python';
        const selected_text = body.selected_text || '';
        const user_input = body.user_input || '';

        const API_KEY = process.env.OPENROUTER_API_KEY;
        const MODEL = process.env.OPENROUTER_MODEL_LINK || 'arcee-ai/trinity-large-preview:free';

        if (!API_KEY) {
            return res.status(503).json({
                detail: 'OPENROUTER_API_KEY not set. Add it in Vercel → Settings → Environment Variables.'
            });
        }

        const target = selected_text.trim() || code;
        const scope = selected_text.trim() ? '(selected snippet)' : '(full file)';

        const PROMPTS = {
            'quick-test': {
                system: 'You are a senior code reviewer. Give a crisp bullet-style review covering correctness, edge cases, style, bugs, and performance. Max 10 bullets. End with a VERDICT.',
                user: `Review this ${language} ${scope} code:\n\`\`\`\n${target}\n\`\`\``
            },
            'generate-tests': {
                system: 'You are a test engineer. Generate 5 meaningful test cases (Input + Expected Output). Then suggest debug print placements.',
                user: `Code ${scope}:\n\`\`\`${language}\n${target}\n\`\`\``
            },
            'code-explain': {
                system: 'You are an expert code explainer. For each block: what it does, why, patterns used, and issues. Use headers and bullets.',
                user: `Explain this ${language} code:\n\`\`\`\n${target}\n\`\`\``
            },
            'simulate': {
                system: user_input
                    ? 'You are a runtime simulator. Trace through the code step by step with the given input. Show expected output and note errors.'
                    : 'You are a code analyst. Describe exactly what inputs this code expects (type, format, count). Give 2-3 example inputs.',
                user: user_input
                    ? `Code:\n\`\`\`${language}\n${target}\n\`\`\`\n\nInput: ${user_input}\n\nSimulate step by step.`
                    : `What inputs does this code need?\n\`\`\`${language}\n${target}\n\`\`\``
            },
            'reduce-complexity': {
                system: 'You are an algorithm expert. Provide: 1) Current complexity (Time+Space Big-O), 2) Optimisation suggestions with code, 3) Data structure tips. End with:\nEFFICIENCY_SCORE: <0-100>\nSCALABILITY_SCORE: <0-100>',
                user: `Optimise this ${language} ${scope}:\n\`\`\`\n${target}\n\`\`\``
            },
            'redesign': {
                system: 'You are a software architect. Provide: 1) Brief analysis, 2) Complete redesigned code, 3) Changes summary.',
                user: `Requirements: ${user_input || 'Improve overall design'}\n\nCode:\n\`\`\`${language}\n${target}\n\`\`\``
            }
        };

        const prompt = PROMPTS[action];
        if (!prompt) {
            return res.status(400).json({
                detail: `Unknown action "${action}". Valid: ${Object.keys(PROMPTS).join(', ')}`
            });
        }

        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://sync-it-ecru.vercel.app',
                'X-Title': 'SynnccIT'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user }
                ],
                max_tokens: 1800,
                temperature: 0.3
            })
        });

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            return res.status(502).json({ detail: `OpenRouter HTTP ${aiRes.status}: ${errText.slice(0, 300)}` });
        }

        const data = await aiRes.json();
        const result = data.choices?.[0]?.message?.content?.trim() || 'Empty AI response.';

        let metrics = null;
        if (action === 'reduce-complexity') {
            let eff = 50, sc = 50;
            for (const line of result.split('\n')) {
                if (line.includes('EFFICIENCY_SCORE:')) { const n = parseInt(line.split(':')[1], 10); if (!isNaN(n)) eff = n; }
                if (line.includes('SCALABILITY_SCORE:')) { const n = parseInt(line.split(':')[1], 10); if (!isNaN(n)) sc = n; }
            }
            metrics = { efficiency: eff, scalability: sc };
        }

        return res.status(200).json({ result, metrics, test_results: null });

    } catch (err) {
        console.error('AI function error:', err);
        return res.status(500).json({ detail: `Internal error: ${err.message}` });
    }
}
