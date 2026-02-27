import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Save, X, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileExplorer } from '@/components/developer/FileExplorer';
import { CodeEditor } from '@/components/developer/CodeEditor';
import { Terminal } from '@/components/developer/Terminal';
import { AgentSidePanel } from '@/components/developer/AgentSidePanel';
import { FileNode, OpenFile } from '@/types/api';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = IS_LOCAL ? '' : '';

// Native mode: map virtual paths → FileSystemFileHandle so we can read & write back to disk
const nativeFileHandles = new Map<string, FileSystemFileHandle>();

// Detect language from extension
function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', json: 'json', md: 'markdown', css: 'css', html: 'html',
    yaml: 'yaml', yml: 'yaml', sh: 'shell', txt: 'text',
  };
  return map[ext] || ext || 'text';
}

export default function DeveloperPage() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Track whether we're in native (File System Access API) mode
  const isNativeMode = useRef(false);

  // ─── File selection ────────────────────────────────────────────────────────
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
      // Read directly from disk via File System Access API
      const handle = nativeFileHandles.get(file.path);
      if (handle) {
        try {
          const fileObj = await handle.getFile();
          content = await fileObj.text();
        } catch (err) {
          console.error('Failed to read native file:', err);
          content = '// Could not read file';
        }
      } else {
        content = '// File handle not found — try re-selecting the workspace';
      }
    } else {
      // Read via backend API
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

  // ─── File saving ───────────────────────────────────────────────────────────
  const handleFileSave = async (file: OpenFile) => {
    if (isNativeMode.current) {
      // Write directly to disk via File System Access API
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
      // Save via backend API
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

  // Cmd/Ctrl+S shortcut
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

  // ─── File tree loading (backend mode) ─────────────────────────────────────
  const loadFiles = async (path: string = '.') => {
    if (isNativeMode.current) return; // tree is managed natively
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

  // Real-time FS sync (local backend only)
  useEffect(() => {
    if (!IS_LOCAL || isNativeMode.current) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/fs`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'refresh') loadFiles();
    };
    return () => ws.close();
  }, []);

  useEffect(() => { loadFiles(); }, []);

  // ─── Workspace switching ───────────────────────────────────────────────────

  // Backend-based picker (local macOS osascript fallback)
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

  // Browser File System Access API — registers all file handles for read/write
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

  // ─── Tab management ───────────────────────────────────────────────────────
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
              if (isNativeMode.current) return; // can't upload via backend in native mode
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
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </button>

        {/* Center — Code Editor + Terminal */}
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
                      const activeFile = openFiles.find(f => f.id === activeFileId);
                      if (activeFile) handleFileSave(activeFile);
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
              onContentChange={(fileId, newContent) => {
                setOpenFiles(prev => prev.map(f =>
                  f.id === fileId ? { ...f, content: newContent, isModified: true } : f
                ));
              }}
            />
          </div>

          {/* Terminal */}
          <div
            className={cn(
              'border-t border-border transition-all duration-300',
              terminalExpanded ? 'flex-1' : 'h-48'
            )}
          >
            {/* AI Terminal button (placeholder for future integration) */}
            <div className="relative h-full">
              <Terminal
                onExpand={() => setTerminalExpanded(!terminalExpanded)}
                isExpanded={terminalExpanded}
              />
              {/* AI Terminal Placeholder Button */}
              <div className="absolute top-1 right-24 z-10 pointer-events-none opacity-0">
                {/* Reserved slot for AI terminal integration */}
                <Button variant="ghost" size="icon" className="h-6 w-6 pointer-events-auto opacity-100" title="AI Terminal (Coming Soon)">
                  <Sparkles className="h-3 w-3 text-primary/60" />
                </Button>
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
            : <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          }
        </button>

        {/* Right Panel — Agent */}
        <div
          className={cn(
            'bg-card border-l border-border transition-all duration-300 overflow-hidden',
            rightPanelOpen ? 'w-72' : 'w-0'
          )}
        >
          <AgentSidePanel />
        </div>
      </div>
    </div>
  );
}
