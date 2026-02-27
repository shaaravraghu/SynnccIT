# SynnccIT — Requirements

> Last updated: 27 Feb 2026

---

## 1. Functional Requirements

### 1.1 Developer Page
| # | Requirement | Status |
|---|---|---|
| F1 | File Explorer with workspace folder tree | ✅ Done |
| F2 | `Change Root` — pick any local folder via `window.showDirectoryPicker()` (works on Vercel + local) | ✅ Done |
| F3 | Upload file from Finder into workspace | ✅ Done |
| F4 | Read files natively (`FileSystemFileHandle.getFile()`) — no blank editor | ✅ Done |
| F5 | Write changes back to disk (`FileSystemFileHandle.createWritable()`) | ✅ Done |
| F6 | Auto-save with 1 s debounce + Cmd/Ctrl+S manual save | ✅ Done |
| F7 | Multi-tab code editor with unsaved-change indicator | ✅ Done |
| F8 | Terminal — full PTY shell via WebSocket (local) | ✅ Done |
| F9 | Terminal — HTTP-based cloud runner with real cwd (Vercel) | ✅ Done |
| F10 | AI Agent panel (right side) — current working agent and action queue | ✅ Done |
| F11 | Workspace-level AI button (placeholder, future) | ✅ Done |
| F12 | Terminal-level AI button (placeholder, future) | ✅ Done |

### 1.2 Testing Page
| # | Requirement | Status |
|---|---|---|
| T1 | Same native FS read/write as Developer page — opens files correctly | ✅ Done |
| T2 | Same `Change Root` / workspace picker as Developer page | ✅ Done |
| T3 | 6 AI testing actions (right panel) | ✅ Done |
| T3a | **Run Quick Tests** — AI code review + auto test-case execution | ✅ Done |
| T3b | **Generate Test Cases** — 5 test cases + debug print suggestions | ✅ Done |
| T3c | **Code Explanation** — block-by-block explanation | ✅ Done |
| T3d | **Simulate Runs** — AI-traces execution with user-provided input | ✅ Done |
| T3e | **Reduce Complexity** — Big-O analysis + optimisation suggestions | ✅ Done |
| T3f | **Re-Design** — full code redesign per user requirements | ✅ Done |
| T4 | Drag-selected text has priority over full file for all AI actions | ✅ Done |
| T5 | Efficiency + Scalability metric bars (updated by AI response) | ✅ Done |
| T6 | Embedded Terminal (same PTY/cloud terminal as Developer page) | ✅ Done |
| T7 | AI Output panel with clear button and Simulate/Redesign input area | ✅ Done |

### 1.3 Agent Page
| # | Requirement | Status |
|---|---|---|
| A1 | AI chat agent (LangChain + Google Gemini) | ✅ Done |
| A2 | Agent action history persisted in `history.json` | ✅ Done |
| A3 | Lazy agent initialisation — backend doesn't crash on missing API key | ✅ Done |

### 1.4 Other Pages
| Page | Status |
|---|---|
| Status | ✅ Active (monitoring endpoints) |
| Planning | ✅ Active |
| Team | ✅ Active |
| Settings | ✅ Active |

---

## 2. AI Integration Requirements

| # | Requirement | Provider | Status |
|---|---|---|---|
| AI1 | Testing Page — all 6 actions call OpenRouter | OpenRouter (`arcee-ai/trinity-large-preview:free`) | ✅ Done |
| AI2 | Agent Page — code review agent | Google Gemini (`gemini-1.5-flash`) | ✅ Done |
| AI3 | API key stored server-side only (never exposed to browser) | `.env` (local) / Vercel Env Vars (cloud) | ✅ Done |
| AI4 | Selected text has priority over full file for AI context | Frontend | ✅ Done |

---

## 3. Deployment Requirements

| # | Requirement | Status |
|---|---|---|
| D1 | Frontend deployable to Vercel (static SPA) | ✅ Done |
| D2 | AI endpoints as Vercel Serverless Functions (`api/`) | ✅ Done |
| D3 | Terminal runner as Vercel Serverless Function (`api/terminal.js`) | ✅ Done |
| D4 | Native file operations via File System Access API (no backend needed) | ✅ Done |
| D5 | `Change Root` works on Vercel via `showDirectoryPicker()` | ✅ Done |
| D6 | Local backend (FastAPI port 8000) for PTY terminal | ✅ Done |
| D7 | Single backend port — DeveloperPage, TestingPage, AgentPage unified on :8000 | ✅ Done |
| D8 | Vite dev server on :8080, proxies `/api` and `/ws` to :8000 | ✅ Done |

---

## 4. Non-Functional Requirements

- **Cross-environment compatibility** — features gracefully degrade from local (full PTY) to cloud (HTTP terminal)
- **Security** — API keys never sent to browser; dangerous shell commands blocked on cloud terminal
- **Performance** — autosave debounced; AI requests non-blocking; xterm renders after container has dimensions
- **Reliability** — local PTY has reconnect button; cloud terminal retries cwd fetch; AI errors surfaced as readable messages
- **Maintainability** — modular components; clear local vs cloud branching via `IS_LOCAL` constant

---

## 5. Dependencies

### Frontend
| Package | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool / dev server (port 8080) |
| shadcn/ui + Radix UI | Component library |
| Lucide React | Icons |
| @xterm/xterm + @xterm/addon-fit | PTY terminal emulator |
| File System Access API | Native read/write (browser built-in) |

### Backend (local, port 8000)
| Package | Purpose |
|---|---|
| FastAPI + Uvicorn | HTTP + WebSocket server |
| python-pty | PTY terminal |
| LangChain + `google-generativeai` | Agent Page AI |
| python-dotenv | `.env` loading |

### Vercel Serverless (Node.js, `api/`)
| File | Purpose |
|---|---|
| `api/ai/[action].js` | All 6 Testing Page AI actions → OpenRouter |
| `api/terminal.js` | Cloud terminal command runner |

### Required Environment Variables
| Variable | Where | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | `.env` + Vercel Env Vars | Testing Page AI (required) |
| `OPENROUTER_MODEL_LINK` | `.env` + Vercel Env Vars | Model selection (optional, defaults to `arcee-ai/trinity-large-preview:free`) |
| `GOOGLE_API_KEY` | `.env` | Agent Page Gemini (optional) |