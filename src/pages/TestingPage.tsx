import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Sparkles,
  FileCode,
  Zap,
  Layers,
  Palette,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Maximize2,
  Minimize2,
  Bot,
  Loader2,
  Gauge,
  TrendingUp,
  Send,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileExplorer } from '@/components/developer/FileExplorer';
import { CodeEditor } from '@/components/developer/CodeEditor';
import { Terminal } from '@/components/developer/Terminal';
import { FileNode, OpenFile } from '@/types/api';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = '';   // Always use Vite proxy in local dev

// Native mode: map virtual paths → FileSystemFileHandle for read/write
const nativeFileHandles = new Map<string, FileSystemFileHandle>();

function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', json: 'json', md: 'markdown', css: 'css', html: 'html',
    yaml: 'yaml', yml: 'yaml', sh: 'shell', txt: 'text',
  };
  return map[ext] || ext || 'text';
}

const actionButtons = [
  { id: 'quick-test', label: 'Run Quick Tests', icon: Play, description: 'AI reviews code and gives crisp feedback' },
  { id: 'generate-tests', label: 'Generate Test Cases', icon: Sparkles, description: 'Create artificial data for variable testing' },
  { id: 'code-explain', label: 'Code Explanation', icon: FileCode, description: 'Highlight code to decipher it' },
  { id: 'simulate', label: 'Simulate Runs', icon: Zap, description: 'Place values and check performance' },
  { id: 'reduce-complexity', label: 'Reduce Complexity', icon: Layers, description: 'Suggestions to reduce space/time complexity' },
  { id: 'redesign', label: 'Re-Design', icon: Palette, description: 'Implement code as per user needs' },
];

export default function TestingPage() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'terminal'>('output');

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // AI state
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [metrics, setMetrics] = useState({ efficiency: 0, scalability: 0 });

  // Ref to the textarea so we can read the actual drag-selection
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Native mode flag
  const isNativeMode = useRef(false);

  // ─── File Selection ──────────────────────────────────────────────────────
  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'folder') return;

    const existing = openFiles.find(f => f.path === file.path);
    if (existing) {
      setActiveFileId(existing.id);
      setSelectedPath(file.path);
      return;
    }

    let content = '';

    if (isNativeMode.current) {
      const handle = nativeFileHandles.get(file.path);
      if (handle) {
        try {
          const fileObj = await handle.getFile();
          content = await fileObj.text();
        } catch (err) {
          content = '// Could not read file via File System Access API';
          console.error('Native file read error:', err);
        }
      } else {
        content = '// File handle not found — re-select the workspace';
      }
    } else {
      try {
        const res = await fetch(`${BACKEND_URL}/api/file?path=${encodeURIComponent(file.path)}`);
        const data = await res.json();
        content = data.content || '';
      } catch (err) {
        console.error('Failed to fetch file from backend:', err);
      }
    }

    const newFile: OpenFile = {
      id: Date.now().toString(),
      name: file.name,
      path: file.path,
      content,
      language: file.language || detectLanguage(file.name),
      isModified: false,
    };
    setOpenFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setSelectedPath(file.path);
  };

  // ─── File Saving ─────────────────────────────────────────────────────────
  const handleFileSave = async (file: OpenFile) => {
    if (isNativeMode.current) {
      const handle = nativeFileHandles.get(file.path);
      if (handle) {
        try {
          const writable = await (handle as any).createWritable();
          await writable.write(file.content);
          await writable.close();
          setOpenFiles(prev => prev.map(f =>
            f.id === file.id ? { ...f, isModified: false } : f
          ));
        } catch (err) {
          console.error('Failed to write native file:', err);
        }
      }
    } else {
      try {
        const res = await fetch(`${BACKEND_URL}/api/file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: file.path, content: file.content }),
        });
        if (res.ok) {
          setOpenFiles(prev => prev.map(f =>
            f.id === file.id ? { ...f, isModified: false } : f
          ));
        }
      } catch (err) {
        console.error('Failed to save file:', err);
      }
    }
  };

  // Autosave (1s debounce)
  useEffect(() => {
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile || !activeFile.isModified) return;
    const t = setTimeout(() => handleFileSave(activeFile), 1000);
    return () => clearTimeout(t);
  }, [activeFileId, openFiles]);

  // Cmd/Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const activeFile = openFiles.find(f => f.id === activeFileId);
        if (activeFile) handleFileSave(activeFile);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, openFiles]);

  // ─── File Tree (backend mode) ────────────────────────────────────────────
  const loadFiles = async (path: string = '.') => {
    if (isNativeMode.current) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/files?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.children ? data.children : [data]);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  };

  // ─── Workspace Switching ─────────────────────────────────────────────────
  const handleChangeWorkspace = async () => {
    if (!IS_LOCAL) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/select-workspace-folder`, { method: 'POST' });
      const data = await res.json();
      if (!data.path) return;
      isNativeMode.current = false;
      nativeFileHandles.clear();
      setOpenFiles([]);
      setActiveFileId(null);
      setSelectedPath(null);
      loadFiles(data.path);
    } catch (err) {
      console.error('Failed to change workspace:', err);
    }
  };

  const handleNativeWorkspacePick = async (dirHandle: FileSystemDirectoryHandle) => {
    nativeFileHandles.clear();
    isNativeMode.current = true;

    const readDir = async (
      handle: FileSystemDirectoryHandle,
      parentPath: string
    ): Promise<FileNode[]> => {
      const items: FileNode[] = [];
      for await (const [name, entry] of (handle as any).entries()) {
        if (name.startsWith('.') || name === 'node_modules' || name === '__pycache__') continue;
        const path = `${parentPath}/${name}`;
        if (entry.kind === 'directory') {
          const children = await readDir(entry as FileSystemDirectoryHandle, path);
          items.push({ id: path, name, path, type: 'folder', children });
        } else {
          const lang = detectLanguage(name);
          nativeFileHandles.set(path, entry as FileSystemFileHandle);
          items.push({ id: path, name, path, type: 'file', language: lang });
        }
      }
      return items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    };

    const tree = await readDir(dirHandle, dirHandle.name);
    setFiles(tree);
    setOpenFiles([]);
    setActiveFileId(null);
    setSelectedPath(null);
  };

  useEffect(() => { loadFiles(); }, []);

  // ─── Tab Management ───────────────────────────────────────────────────────
  const handleFileClose = (fileId: string) => {
    const remaining = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const handleCloseAllFiles = () => {
    if (openFiles.some(f => f.isModified)) {
      if (!confirm('You have unsaved changes. Close all?')) return;
    }
    setOpenFiles([]);
    setActiveFileId(null);
  };

  // ─── Get Code / Selection ─────────────────────────────────────────────────
  const getActiveCode = () => openFiles.find(f => f.id === activeFileId)?.content || '';

  /** Reads drag-selection from the <textarea> via selectionStart/selectionEnd */
  const getSelectedText = (): string => {
    const ta = editorTextareaRef.current;
    if (!ta) return '';
    const { selectionStart, selectionEnd, value } = ta;
    if (selectionStart === selectionEnd) return '';
    return value.slice(selectionStart, selectionEnd);
  };

  // ─── AI Actions ───────────────────────────────────────────────────────────
  const handleAction = async (actionId: string) => {
    setSelectedAction(actionId);
    const code = getActiveCode();

    if (!code) {
      setAiOutput('⚠️ No file is open. Please select a file from the workspace first.');
      return;
    }

    // For redesign: prompt the user for requirements if none given yet
    if (actionId === 'redesign' && !userInput.trim()) {
      setAiOutput(
        '🎨 Re-Design Mode\n\nDescribe how you want the code to be restructured:\n\n' +
        'Examples:\n• "Convert to object-oriented design"\n• "Split into separate functions"\n' +
        '• "Add error handling and validation"\n• "Make async/concurrent"\n\n' +
        'Type your requirements below and click Send.'
      );
      return;
    }

    setAiLoading(true);
    setAiOutput('');

    try {
      // Selected text has priority over full file
      const selectedText = getSelectedText();
      const body = {
        code,
        language: detectLanguage(openFiles.find(f => f.id === activeFileId)?.name || ''),
        selected_text: selectedText || undefined,
        user_input: userInput || undefined,
      };

      const endpointMap: Record<string, string> = {
        'quick-test': '/api/ai/quick-test',
        'generate-tests': '/api/ai/generate-tests',
        'code-explain': '/api/ai/code-explain',
        'simulate': '/api/ai/simulate',
        'reduce-complexity': '/api/ai/reduce-complexity',
        'redesign': '/api/ai/redesign',
      };

      const endpoint = endpointMap[actionId];
      if (!endpoint) {
        setAiOutput('❌ Unknown action.');
        setAiLoading(false);
        return;
      }

      // Show scope hint in UI
      if (selectedText) {
        setAiOutput(`🔍 Analysing selected snippet (${selectedText.split('\n').length} lines)...\n`);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        setAiOutput(`❌ Server error ${res.status}: ${err.detail || res.statusText}`);
        return;
      }

      const data = await res.json();
      let output = data.result || 'No response from AI.';

      // Append execution test results if available
      if (data.test_results && data.test_results.length > 0) {
        const passed = data.test_results.filter((r: any) => r.passed).length;
        const total = data.test_results.length;
        output += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        output += `📊 Execution Results: ${passed}/${total} passed\n\n`;
        data.test_results.forEach((r: any, i: number) => {
          output += `Test ${i + 1}: ${r.passed ? '✅ PASS' : '❌ FAIL'}`;
          output += ` | Input: ${r.input || '(none)'}`;
          output += ` | Output: ${r.actual}\n`;
        });
      }

      setAiOutput(output);

      if (data.metrics) {
        setMetrics(m => ({
          efficiency: data.metrics.efficiency ?? m.efficiency,
          scalability: data.metrics.scalability ?? m.scalability,
        }));
      }
    } catch (err: any) {
      setAiOutput(`❌ Network error: ${err.message}\n\nMake sure the backend is running on port 8000.`);
    } finally {
      setAiLoading(false);
    }
  };

  // Scroll AI output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [aiOutput]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — File Explorer */}
        <div
          className={cn(
            'relative bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col',
            leftPanelOpen ? 'w-56' : 'w-0'
          )}
        >
          <FileExplorer
            onFileSelect={handleFileSelect}
            selectedPath={selectedPath}
            files={files}
            onRefresh={() => { if (!isNativeMode.current) loadFiles(); }}
            onFileUpload={async (file) => {
              if (isNativeMode.current) return;
              const formData = new FormData();
              formData.append('file', file);
              await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: formData });
              loadFiles();
            }}
            onWorkspaceChange={IS_LOCAL ? handleChangeWorkspace : undefined}
            onNativeWorkspacePick={handleNativeWorkspacePick}
          />
        </div>

        {/* Left Panel Toggle */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="w-5 flex items-center justify-center bg-secondary/30 border-r border-border hover:bg-secondary/50 transition-colors"
        >
          {leftPanelOpen
            ? <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Center — Code Editor + AI Output/Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Open Files Tabs Header */}
          <div className="h-8 bg-secondary/20 border-b border-border flex items-center justify-between px-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Open Files</span>
              {openFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-red-400"
                  onClick={handleCloseAllFiles}
                  title="Close All Files"
                >
                  <X className="h-3 w-3 mr-1" />
                  Close All
                </Button>
              )}
              {isNativeMode.current && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                  NATIVE FS
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFileId && openFiles.find(f => f.id === activeFileId)?.isModified && (
                <>
                  <span className="text-[10px] text-primary animate-pulse">Syncing...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 px-2 hover:bg-primary/20"
                    onClick={() => {
                      const af = openFiles.find(f => f.id === activeFileId);
                      if (af) handleFileSave(af);
                    }}
                  >
                    <Save className="h-3 w-3" />
                    Save Now
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className={cn('flex-1 overflow-hidden', terminalExpanded && 'hidden')}>
            <CodeEditor
              openFiles={openFiles}
              activeFileId={activeFileId}
              onFileClose={handleFileClose}
              onFileSelect={setActiveFileId}
              textareaRef={editorTextareaRef}
              onContentChange={(fileId, newContent) => {
                setOpenFiles(prev => prev.map(f =>
                  f.id === fileId ? { ...f, content: newContent, isModified: true } : f
                ));
              }}
            />
          </div>

          {/* Tabbed Panel: AI Output + Terminal */}
          <div
            className={cn(
              'border-t border-border transition-all duration-300 flex flex-col',
              terminalExpanded ? 'flex-1' : 'h-64'
            )}
          >
            {/* Tab Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/5 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('output')}
                  className={cn(
                    'flex items-center gap-2 text-[11px] font-medium transition-colors hover:text-primary',
                    activeTab === 'output' ? 'text-primary border-b border-primary pb-0.5' : 'text-slate-500'
                  )}
                >
                  <Bot className="h-3.5 w-3.5" />
                  AI OUTPUT
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={cn(
                    'flex items-center gap-2 text-[11px] font-medium transition-colors hover:text-primary',
                    activeTab === 'terminal' ? 'text-primary border-b border-primary pb-0.5' : 'text-slate-500'
                  )}
                >
                  <TerminalIcon className="h-3.5 w-3.5" />
                  TERMINAL
                </button>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-white/10"
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  title={terminalExpanded ? 'Collapse' : 'Expand'}
                >
                  {terminalExpanded
                    ? <Minimize2 className="h-3 w-3 text-slate-400" />
                    : <Maximize2 className="h-3 w-3 text-slate-400" />}
                </Button>
                {activeTab === 'output' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-white/10"
                    onClick={() => setAiOutput('')}
                    title="Clear Output"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {/* AI Output */}
              <div className={cn('h-full flex flex-col bg-[#0b0c10] font-mono', activeTab !== 'output' && 'hidden')}>
                <div ref={outputRef} className="flex-1 overflow-auto p-4 selection:bg-primary/30 text-slate-300">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-primary text-[12px]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analysing code...</span>
                    </div>
                  ) : aiOutput ? (
                    <div className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">
                      {aiOutput}
                    </div>
                  ) : (
                    <div className="text-slate-600 italic text-[11px]">
                      Select an AI action from the right panel.{'\n'}
                      <span className="text-slate-700 not-italic block mt-1">
                        💡 Drag to select specific code before clicking an action to analyse just that snippet.
                      </span>
                    </div>
                  )}
                </div>
                {/* Input area for simulate / redesign */}
                {(selectedAction === 'simulate' || selectedAction === 'redesign') && (
                  <div className="p-3 bg-white/5 border-t border-white/5">
                    <div className="flex items-start gap-2">
                      <textarea
                        rows={2}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={selectedAction === 'simulate' ? 'Input values…' : 'Restructure requirements…'}
                        className="flex-1 bg-transparent border border-white/10 rounded p-2 outline-none text-xs text-white placeholder:text-slate-600 resize-none"
                      />
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleAction(selectedAction)}
                        disabled={aiLoading}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal */}
              <div className={cn('h-full', activeTab !== 'terminal' && 'hidden')}>
                <Terminal
                  isExpanded={terminalExpanded}
                  onExpand={() => setTerminalExpanded(!terminalExpanded)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel Toggle */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="w-5 flex items-center justify-center bg-secondary/30 border-l border-border hover:bg-secondary/50 transition-colors"
        >
          {rightPanelOpen
            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Right Panel — AI Testing Agent */}
        <div
          className={cn(
            'bg-card border-l border-border transition-all duration-300 overflow-hidden flex flex-col',
            rightPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          {/* AI Actions */}
          <div className="ide-panel-header">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="ide-panel-title">AI Testing Agent</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="space-y-1.5">
              {actionButtons.map((action) => {
                const Icon = action.icon;
                const isActive = selectedAction === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={aiLoading}
                    className={cn(
                      'w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all duration-200 group border',
                      isActive
                        ? 'bg-primary/15 border-primary/30 text-foreground'
                        : 'bg-transparent border-transparent hover:bg-secondary/50 hover:border-border text-muted-foreground hover:text-foreground',
                      aiLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 p-1.5 rounded-md transition-colors',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-secondary/50 text-muted-foreground group-hover:text-foreground'
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold leading-tight">{action.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action.description}</div>
                    </div>
                    {isActive && aiLoading && (
                      <Loader2 className="h-3 w-3 text-primary animate-spin mt-1 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selection hint */}
            <div className="mt-4 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                💡 <span className="text-primary font-medium">Tip:</span> Drag to select specific lines in the editor — the AI will analyse just your selection instead of the entire file.
              </p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Performance</span>
            </div>

            {/* Efficiency */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-muted-foreground">Efficiency</span>
                </div>
                <span className={cn(
                  'text-[11px] font-bold tabular-nums',
                  metrics.efficiency >= 70 ? 'text-emerald-400'
                    : metrics.efficiency >= 40 ? 'text-amber-400'
                      : 'text-rose-400'
                )}>
                  {metrics.efficiency}%
                </span>
              </div>
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    metrics.efficiency >= 70 ? 'bg-emerald-500'
                      : metrics.efficiency >= 40 ? 'bg-amber-500'
                        : 'bg-rose-500'
                  )}
                  style={{ width: `${metrics.efficiency}%` }}
                />
              </div>
            </div>

            {/* Scalability */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-medium text-muted-foreground">Scalability</span>
                </div>
                <span className={cn(
                  'text-[11px] font-bold tabular-nums',
                  metrics.scalability >= 70 ? 'text-blue-400'
                    : metrics.scalability >= 40 ? 'text-amber-400'
                      : 'text-rose-400'
                )}>
                  {metrics.scalability}%
                </span>
              </div>
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    metrics.scalability >= 70 ? 'bg-blue-500'
                      : metrics.scalability >= 40 ? 'bg-amber-500'
                        : 'bg-rose-500'
                  )}
                  style={{ width: `${metrics.scalability}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
