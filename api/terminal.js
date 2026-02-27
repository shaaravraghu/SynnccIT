/**
 * Vercel Serverless Function — Cloud Terminal
 * Route: GET /api/terminal   → returns { cwd: string }  (server's working dir)
 *        POST /api/terminal  → runs a command
 *
 * ESM format (required by "type": "module" in package.json).
 */

import { exec } from 'child_process';
import path from 'path';

const BLOCKED = [
    'rm -rf /', 'sudo ', 'shutdown', 'reboot', 'mkfs ',
    'dd if=', ':(){:|:&};:', 'chmod 777 /', '> /dev/sd'
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET — client calls this on mount to learn the server's CWD
    if (req.method === 'GET') {
        return res.status(200).json({ cwd: process.cwd() });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ output: '', error: 'POST only', newCwd: process.cwd() });
    }

    try {
        // Use server's real cwd as the default instead of /tmp
        const serverCwd = process.cwd();
        const { command = '', cwd = serverCwd } = req.body || {};
        const cmd = command.trim();

        if (!cmd) return res.json({ output: '', error: '', newCwd: cwd });

        // Safety check
        const lower = cmd.toLowerCase();
        for (const p of BLOCKED) {
            if (lower.includes(p)) {
                return res.json({ output: '', error: `⛔ Blocked: "${p}"`, newCwd: cwd });
            }
        }

        // Handle `cd` — resolve the path and return it so client tracks state
        const cdMatch = cmd.match(/^cd\s*(.*)$/);
        if (cdMatch) {
            const target = (cdMatch[1] || '').trim() || serverCwd;
            const newCwd = target.startsWith('/') ? target : path.resolve(cwd, target);
            return res.json({ output: '', error: '', newCwd });
        }

        // Run command
        return await new Promise((resolve) => {
            exec(cmd, {
                cwd,
                timeout: 15_000,
                maxBuffer: 512 * 1024,
                env: { ...process.env, TERM: 'xterm', FORCE_COLOR: '0' }
            }, (error, stdout, stderr) => {
                resolve(res.json({
                    output: stdout || '',
                    error: stderr || (error && !stderr ? error.message : ''),
                    newCwd: cwd
                }));
            });
        });

    } catch (err) {
        console.error('Terminal error:', err);
        return res.status(500).json({
            output: '',
            error: `Server error: ${err.message}`,
            newCwd: process.cwd()
        });
    }
}
