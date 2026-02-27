import { useState, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  FileJson,
  FileType,
  File,
  RefreshCw,
  ExternalLink,
  Upload,
  Plus,
  FolderSearch,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileNode } from '@/types/api';
import { Button } from '@/components/ui/button';

// Detect environment: true when running locally with the backend available
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = IS_LOCAL ? '' : '';

const getFileIcon = (name: string, isOpen?: boolean) => {
  const ext = name.split('.').pop()?.toLowerCase();

  if (ext === 'tsx' || ext === 'ts') return <FileCode className="h-3 w-3 text-syntax-keyword" />;
  if (ext === 'json') return <FileJson className="h-3 w-3 text-syntax-function" />;
  if (ext === 'md') return <FileType className="h-3 w-3 text-syntax-string" />;
  return <File className="h-3 w-3 text-muted-foreground" />;
};

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (node: FileNode) => void;
}

function FileTreeItem({ node, depth, selectedPath, onSelect }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isFolder = node.type === 'folder';
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          'file-tree-item group',
          isSelected && 'active',
          isFolder ? 'text-[12px] font-medium py-1' : 'text-[11px] py-0.5'
        )}
        style={{ paddingLeft: `${depth * 10 + 8}px` }}
      >
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 text-syntax-function" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-syntax-function" />
            )}
          </>
        ) : (
          <>
            <span className="w-2.5" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetch(`${BACKEND_URL}/api/open-folder`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: node.path }),
            });
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded-sm transition-opacity"
          title="Reveal in Finder/Explorer"
        >
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedPath: string | null;
  files?: FileNode[];
  onRefresh?: () => void;
  onFileUpload?: (file: File) => void;
  onWorkspaceChange?: () => void;
  onNativeWorkspacePick?: (dirHandle: FileSystemDirectoryHandle) => void;
}

export function FileExplorer({
  onFileSelect,
  selectedPath,
  files = [],
  onRefresh,
  onFileUpload,
  onWorkspaceChange,
  onNativeWorkspacePick,
}: FileExplorerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Native workspace picker — uses File System Access API (works everywhere, no backend needed)
  const handleChangeRoot = async () => {
    // If browser supports the File System Access API, use it (works on Vercel too)
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        if (onNativeWorkspacePick) {
          onNativeWorkspacePick(dirHandle);
        } else if (onWorkspaceChange) {
          // Fallback: call backend-based handler when running locally
          onWorkspaceChange();
        }
      } catch (err: any) {
        // User cancelled or permission denied — silently ignore
        if (err.name !== 'AbortError') console.warn('Directory picker error:', err);
      }
    } else if (IS_LOCAL && onWorkspaceChange) {
      // Older browsers on local: fall back to backend osascript dialog
      onWorkspaceChange();
    } else {
      alert('Your browser does not support directory picking. Please use Chrome or Edge.');
    }
  };

  const handleOpenTerminal = () => {
    if (IS_LOCAL) {
      fetch(`${BACKEND_URL}/api/open-terminal`, { method: 'POST' })
        .catch(() => alert('Could not reach local backend to open terminal.'));
    } else {
      alert('Opening a native terminal is only available when running locally. The in-page terminal below is available in all environments.');
    }
  };

  const handleCreateFile = async () => {
    const filename = prompt("Enter filename:");
    if (!filename) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/api/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filename, content: '' }),
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to create file:", err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="ide-panel-header flex-col items-start gap-2 py-2">
        <span className="ide-panel-title">Workspace</span>
        <div className="w-full flex items-center gap-0.5 border-t border-white/5 pt-1.5 mt-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Change Root — uses browser-native showDirectoryPicker, works everywhere */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleChangeRoot}
            title="Select Workspace Folder"
          >
            <FolderSearch className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
          {/* AI Workspace button — placeholder for future integration */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 group"
            title="AI Workspace Assistant (Coming Soon)"
            onClick={() => { }}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary/40 group-hover:text-primary transition-colors" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCreateFile}
            title="Create New File"
          >
            <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          {/* Upload — uses browser-native <input type="file">, works everywhere */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleUploadClick}
            title="Import/Upload File from Finder"
          >
            <Upload className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
          {/* Open Native Terminal — local only; shows info message on Vercel */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleOpenTerminal}
            title={IS_LOCAL ? 'Open Native Terminal' : 'Open Native Terminal (local only)'}
          >
            <Terminal className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (IS_LOCAL) {
                fetch(`${BACKEND_URL}/api/open-folder`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ path: '.' }),
                });
              }
            }}
            title="Open in Finder/Explorer (local only)"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {files.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4 px-2">
            No workspace loaded. Click 'Change Root' to select a folder.
          </div>
        ) : (
          files.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={onFileSelect}
            />
          ))
        )}
      </div>
    </div >
  );
}
