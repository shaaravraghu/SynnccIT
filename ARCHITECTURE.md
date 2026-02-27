# SynnccIT — Architecture

> Last updated: 27 Feb 2026

---

## Overview

SynnccIT is a **hybrid-cloud AI developer IDE** built as a React SPA. It runs fully on Vercel (static frontend + Node.js serverless functions) and optionally connects to a local Python backend for full terminal/PTY support. All file operations use the browser-native **File System Access API**, making the IDE functional without any backend for file editing.

---

## High-Level Diagram

```
Browser (React SPA — Vercel CDN)
  │
  ├── File System Access API ──────────────────────► Local Filesystem (native, no backend)
  │
  ├── /api/ai/[action]  (POST) ───────────────────► Vercel Serverless (Node.js)
  │     └── fetch ──────────────────────────────────► OpenRouter API
  │
  ├── /api/terminal (GET/POST) ──────────────────► Vercel Serverless (Node.js)
  │     └── child_process.exec ──────────────────► Vercel ephemeral shell
  │
  └── ws://localhost:8000/ws/terminal (IS_LOCAL) ► Local Python Backend (FastAPI + PTY)
        └── /api/* (IS_LOCAL)  ─────────────────► Local Python Backend (port 8000)
```

---

## Project Structure

```
SynnccIT/
│
├── src/                                # Frontend React SPA
│   ├── pages/
│   │   ├── DeveloperPage.tsx           # File explorer + native FS + PTY terminal
│   │   ├── TestingPage.tsx             # Code editor + 6 AI testing actions
│   │   ├── AgentPage.tsx               # AI chat agent
│   │   ├── StatusPage.tsx
│   │   ├── PlanningPage.tsx
│   │   └── ...
│   ├── components/
│   │   └── developer/
│   │       ├── FileExplorer.tsx        # Workspace tree + showDirectoryPicker
│   │       ├── CodeEditor.tsx          # Textarea editor + textareaRef for selection
│   │       └── Terminal.tsx            # PTY (local) or HTTP runner (cloud)
│   ├── contexts/                       # Auth, theme providers
│   ├── hooks/
│   ├── lib/
│   └── types/
│       └── api.ts                      # FileNode, OpenFile, etc.
│
├── api/                                # Vercel Serverless Functions (Node.js ESM)
│   ├── ai/
│   │   └── [action].js                 # Handles all 6 AI endpoints via OpenRouter
│   └── terminal.js                     # GET: server cwd / POST: run command
│
├── DeveloperPage_Backend/              # Unified local Python backend (port 8000)
│   └── app.py                          # FastAPI: file API, PTY WebSocket, routers
│
├── TestingPage_Backend/                # Merged into DeveloperPage_Backend at runtime
│   ├── routers/
│   │   └── ai_router.py               # Fallback AI router (uses OpenRouter, for local)
│   └── services/
│       ├── code_executor.py
│       └── test_generator.py
│
├── AgentPage_Backend/                  # Merged into DeveloperPage_Backend at runtime
│   ├── agent.py                        # SimpleCodeReviewAgent (LangChain)
│   └── router.py                       # Lazy-init FastAPI router
│
├── vercel.json                         # Routing: /api/* → serverless, /* → SPA
├── vite.config.ts                      # Dev server :8080, proxy /api + /ws → :8000
├── package.json                        # "type": "module" — ESM throughout
└── .env                                # OPENROUTER_API_KEY, GOOGLE_API_KEY
```

---

## Frontend Architecture

### Environment Detection
```typescript
const IS_LOCAL = window.location.hostname === 'localhost'
              || window.location.hostname === '127.0.0.1';
```
This single constant drives all local vs cloud branching across the app.

### Native File System Access
Files are read and written directly via the browser's **File System Access API** — no upload/download, no backend:

```typescript
// Pick workspace
const dirHandle = await window.showDirectoryPicker();

// Build file tree (recursively iterate directory)
for await (const [name, entry] of dirHandle.entries()) { ... }

// Read file
const file    = await fileHandle.getFile();
const content = await file.text();

// Write file
const writable = await fileHandle.createWritable();
await writable.write(newContent);
await writable.close();
```
`nativeFileHandles: Map<path, FileSystemFileHandle>` stores handles per file path.

### Code Selection for AI
The `CodeEditor` exposes a `textareaRef` prop. Before each AI call, `TestingPage` reads:
```typescript
const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
```
Selected text is sent as `selected_text` and takes priority over the full file in the AI backend.

---

## Backend Architecture — Local (FastAPI + Uvicorn, port 8000)

The **DeveloperPage_Backend/app.py** is the single unified server:

```
Port 8000
├── /api/files          → file tree
├── /api/file           → read / write file
├── /api/upload         → file upload
├── /api/open-terminal  → open macOS Terminal.app
├── /api/ai/*           → TestingPage AI router (OpenRouter)
├── /api/agent-standalone/* → AgentPage router (Gemini, lazy-init)
└── /ws/terminal        → PTY WebSocket (pty spawn → xterm)
```

**Lazy initialisation:** `SimpleCodeReviewAgent` is only created when the first `/api/agent-standalone/review` request arrives. This prevents crashes on startup when `GOOGLE_API_KEY` is missing.

---

## Backend Architecture — Cloud (Vercel Serverless, Node.js ESM)

### `api/ai/[action].js`
Catches all routes `/api/ai/{action}` (quick-test, generate-tests, code-explain, simulate, reduce-complexity, redesign).

```
POST /api/ai/quick-test
  body: { code, language, selected_text?, user_input? }

  1. selected_text.trim() || code  ← target for AI
  2. Build system + user prompt for the action
  3. fetch → OpenRouter API (OPENROUTER_API_KEY from Vercel env)
  4. Return { result, metrics?, test_results: null }
```

### `api/terminal.js`
```
GET  /api/terminal          → { cwd: process.cwd() }
POST /api/terminal          → { command, cwd }
  1. Safety check (blocks rm -rf /, sudo, etc.)
  2. cd → resolve new path, return { newCwd }
  3. Other → child_process.exec in specified cwd
  4. Return { output, error, newCwd }
```

---

## Terminal Architecture

Two completely separate implementations, selected by `IS_LOCAL`:

| Mode | When | Mechanism | CWD |
|---|---|---|---|
| **LocalTerminal** | `IS_LOCAL = true` | xterm.js + WebSocket → `ws://localhost:8000/ws/terminal` → Python PTY | Backend process dir |
| **CloudTerminal** | `IS_LOCAL = false` | HTTP input field → `POST /api/terminal` → Node.js `exec` | `process.cwd()` on server (fetched on mount via `GET /api/terminal`) |

**Local PTY connection:** Always connects directly to `ws://localhost:8000/ws/terminal` (bypasses Vite proxy for reliability). Has reconnect button. xterm fit-addon runs after 100 ms delay to ensure container has pixel dimensions.

---

## Deployment (Vercel)

### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/:path((?!api).*)", "destination": "/index.html" }
  ]
}
```
- `/api/*` — served by serverless functions in `api/`
- Everything else — served by `dist/index.html` (SPA)

### Required Vercel Environment Variables
```
OPENROUTER_API_KEY   = sk-or-v1-...
OPENROUTER_MODEL_LINK = arcee-ai/trinity-large-preview:free
```

### Build
```bash
npm run build     # vite build → dist/
```
Vercel auto-detects Vite framework, runs `npm run build`, serves `dist/` as CDN.

---

## Data Flow — AI Testing Action

```
User clicks "Run Quick Tests"
  │
  ├── getSelectedText()           ← reads textarea.selectionStart/End
  │     → selected_text (if any drag-selected) or undefined
  │
  ├── getActiveCode()             ← openFiles state
  │     → full file content
  │
  └── fetch POST /api/ai/quick-test
        body: { code, selected_text, language }

        [Vercel] api/ai/[action].js
          target = selected_text.trim() || code
          → OpenRouter API
          → { result, metrics }

        [Local]  /api/ai/quick-test → FastAPI → ai_router.py
          target = selected_text.trim() || code
          → OpenRouter API (same key)
          → { result, metrics, test_results }

  UI renders result in AI Output panel
  Metric bars animate to efficiency / scalability values
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| File System Access API instead of backend file upload | Works on Vercel without a server; persists changes to disk natively |
| Vercel Serverless Functions (Node.js) for AI | Vercel can't run Python; Node.js `fetch` calls OpenRouter directly |
| Direct `ws://localhost:8000` for local PTY | Vite's proxy is unreliable for WebSocket upgrades; direct is simpler |
| Lazy agent initialisation | Prevents startup crash when `GOOGLE_API_KEY` is absent |
| `selected_text` priority over full file | User intent: analyse what I highlighted, not the whole file |
| Single backend port (8000) | Simplifies proxying, CORS, and deployment; one uvicorn process |