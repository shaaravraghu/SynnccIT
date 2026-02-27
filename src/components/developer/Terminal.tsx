import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  Trash2,
  ExternalLink,
  Terminal as TerminalIcon,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

const IS_LOCAL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// ─── Cloud Terminal (HTTP-based, works on Vercel) ─────────────────────────────

function CloudTerminal({ isExpanded }: { isExpanded?: boolean }) {
  // Start with null — we'll fetch the real cwd from the server on mount
  const [cwd, setCwd] = useState<string | null>(null);
  const [lines, setLines] = useState<
    { text: string; type: 'cmd' | 'out' | 'err' | 'info' }[]
  >([
    { text: '☁️  Cloud Terminal — commands run on the server.', type: 'info' },
    { text: 'ℹ️  Note: Interactive programs (vim, top) are not supported.', type: 'info' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch the server's real working directory once on mount
  useEffect(() => {
    fetch('/api/terminal')
      .then(r => r.json())
      .then(data => {
        const serverCwd = data.cwd || '/tmp';
        setCwd(serverCwd);
        setLines(prev => [
          ...prev,
          { text: `📂 Working directory: ${serverCwd}`, type: 'info' },
          { text: '', type: 'info' },
        ]);
      })
      .catch(() => {
        setCwd('/tmp');
        setLines(prev => [
          ...prev,
          { text: '⚠️  Could not reach /api/terminal — check deployment.', type: 'err' },
          { text: '', type: 'info' },
        ]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const runCommand = useCallback(
    async (cmd: string) => {
      if (!cmd.trim() || cwd === null) return;
      setLines(prev => [...prev, { text: `${cwd} $ ${cmd}`, type: 'cmd' }]);
      setInput('');
      setLoading(true);

      if (cmd.trim() === 'clear') {
        setLines([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd, cwd }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setLines(prev => [
            ...prev,
            { text: errData.error || `HTTP ${res.status}`, type: 'err' },
          ]);
          return;
        }

        const data = await res.json();
        const newLines: typeof lines = [];

        if (data.output) {
          const lines_out = data.output.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
          // Remove trailing empty line from split
          if (lines_out[lines_out.length - 1] === '') lines_out.pop();
          lines_out.forEach((l: string) => newLines.push({ text: l, type: 'out' }));
        }
        if (data.error) {
          const lines_err = data.error.replace(/\r\n/g, '\n').split('\n');
          lines_err.forEach((l: string) => {
            if (l.trim()) newLines.push({ text: l, type: 'err' });
          });
        }

        if (data.newCwd && data.newCwd !== cwd) setCwd(data.newCwd);
        setLines(prev => [...prev, ...newLines]);
      } catch (err: any) {
        setLines(prev => [
          ...prev,
          {
            text: `❌ ${err.message} — check that /api/terminal is deployed.`,
            type: 'err',
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [cwd]
  );

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runCommand(input);
  };

  const isReady = cwd !== null;

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] font-mono text-xs">
      <div className="flex-1 overflow-auto p-3 space-y-0.5">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'leading-snug whitespace-pre-wrap break-all',
              line.type === 'cmd' && 'text-emerald-400',
              line.type === 'out' && 'text-slate-200',
              line.type === 'err' && 'text-red-400',
              line.type === 'info' && 'text-slate-500 italic',
            )}
          >
            {line.text}
          </div>
        ))}
        {(loading || !isReady) && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{isReady ? 'running…' : 'connecting…'}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row — only active once we know the server cwd */}
      <div className="border-t border-white/5 flex items-center px-3 py-2 gap-2">
        <span className="text-emerald-400 shrink-0 text-[10px] truncate max-w-40">
          {cwd ?? '…'}
        </span>
        <span className="text-emerald-400 shrink-0">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading || !isReady}
          placeholder={isReady ? 'Enter command…' : 'Connecting…'}
          autoFocus
          className="flex-1 bg-transparent outline-none text-slate-200 placeholder:text-slate-600 text-xs min-w-0"
        />
        <button
          onClick={() => runCommand(input)}
          disabled={loading || !input.trim() || !isReady}
          className="text-slate-500 hover:text-primary disabled:opacity-30 transition-colors shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Local PTY Terminal (WebSocket xterm) ─────────────────────────────────────

function LocalTerminal({
  isExpanded,
  onExpand,
}: {
  isExpanded?: boolean;
  onExpand?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const connect = useCallback(() => {
    // Clean up any existing connection first
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    setConnected(false);
    setError('');

    // Build the WS URL.  In Vite dev (port 8080), the proxy rewrites
    // /ws → ws://localhost:8000, so we use the same host.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError('');
      xtermRef.current?.write('\x1b[32m[CONNECTED]\x1b[0m\r\n');
    };

    ws.onmessage = (event) => {
      xtermRef.current?.write(event.data);
    };

    ws.onclose = (e) => {
      setConnected(false);
      if (e.code !== 1000) {
        // Abnormal close
        const msg = '\r\n\x1b[31m[DISCONNECTED] Connection closed. Click ↺ to reconnect.\x1b[0m\r\n';
        xtermRef.current?.write(msg);
        setError('Disconnected — click ↺ to reconnect.');
      }
    };

    ws.onerror = () => {
      const msg = '\r\n\x1b[33m[ERROR] Backend unreachable. Is uvicorn running on port 8000?\x1b[0m\r\n';
      xtermRef.current?.write(msg);
      setError('Backend error — is the Python server running?');
    };
  }, []);

  // Initialise xterm once the DOM node is mounted
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      scrollback: 2000,
      theme: {
        background: '#0b0c10',
        foreground: '#cbd5e1',
        cursor: '#10b981',
        selectionBackground: 'rgba(16, 185, 129, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);

    // Delay fit so the container has actual dimensions
    const fitTimer = setTimeout(() => fitAddon.fit(), 100);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    term.onResize(({ cols, rows }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    const handleWindowResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', handleWindowResize);

    // Connect after xterm is ready
    connect();

    return () => {
      clearTimeout(fitTimer);
      window.removeEventListener('resize', handleWindowResize);
      wsRef.current?.close();
      term.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fit when panel expands/collapses
  useEffect(() => {
    const t = setTimeout(() => fitAddonRef.current?.fit(), 150);
    return () => clearTimeout(t);
  }, [isExpanded]);

  const clearTerminal = () => {
    xtermRef.current?.clear();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: '\x0c' }));
    }
  };

  const openNativeTerminal = () => {
    fetch('/api/open-terminal', { method: 'POST' })
      .catch(() => alert('Could not reach local backend.'));
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0c10] overflow-hidden">
      {/* Sub-header */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-white/5 bg-white/[0.03] shrink-0">
        <span
          className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
            connected
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/20 text-amber-400'
          )}
        >
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
        {error && (
          <span className="text-[9px] text-red-400 truncate max-w-48">{error}</span>
        )}
        <span className="flex-1" />
        {/* Reconnect */}
        <button
          onClick={connect}
          title="Reconnect"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
        {/* Open native macOS Terminal */}
        <button
          onClick={openNativeTerminal}
          title="Open Native Terminal"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
        {/* Clear */}
        <button
          onClick={clearTerminal}
          title="Clear"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* xterm container */}
      <div className="flex-1 overflow-hidden p-2">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

// ─── Unified Wrapper ──────────────────────────────────────────────────────────

export function Terminal({ className, onExpand, isExpanded }: TerminalProps) {
  return (
    <div className={cn('h-full flex flex-col bg-[#0b0c10] overflow-hidden', className)}>
      {/* Shared header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
            {IS_LOCAL ? 'System Shell (PTY)' : 'Cloud Terminal'}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* AI Terminal placeholder — reserved for future integration */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-white/10 group"
            title="AI Terminal Assistant (Coming Soon)"
            onClick={() => { }}
          >
            <Sparkles className="h-3 w-3 text-primary/40 group-hover:text-primary transition-colors" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-white/10"
            onClick={onExpand}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded
              ? <Minimize2 className="h-3 w-3 text-slate-400" />
              : <Maximize2 className="h-3 w-3 text-slate-400" />}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {IS_LOCAL
          ? <LocalTerminal isExpanded={isExpanded} onExpand={onExpand} />
          : <CloudTerminal isExpanded={isExpanded} />}
      </div>
    </div>
  );
}
