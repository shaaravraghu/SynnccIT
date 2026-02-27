import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpenFile } from '@/types/api';

interface CodeEditorProps {
  openFiles: OpenFile[];
  activeFileId: string | null;
  onFileClose: (fileId: string) => void;
  onFileSelect: (fileId: string) => void;
  onContentChange: (fileId: string, newContent: string) => void;
  /** Ref that's kept pointing at the active textarea so callers can read
   *  selectionStart / selectionEnd for drag-selection features. */
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function CodeEditor({
  openFiles,
  activeFileId,
  onFileClose,
  onFileSelect,
  onContentChange,
  textareaRef,
}: CodeEditorProps) {
  const activeFile = openFiles.find(f => f.id === activeFileId);
  // Internal ref for when the parent doesn't provide one
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? internalRef;

  return (
    <div className="h-full flex flex-col bg-editor-bg">
      {/* Tabs */}
      <div className="flex bg-secondary/30 border-b border-border overflow-x-auto ide-scrollbar-hidden">
        {openFiles.map((file) => (
          <div
            key={file.id}
            className={cn('editor-tab', activeFileId === file.id && 'active')}
            onClick={() => onFileSelect(file.id)}
          >
            <span className="truncate max-w-32">{file.name}</span>
            {file.isModified && <span className="w-2 h-2 rounded-full bg-primary" />}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(file.id);
              }}
              className="p-0.5 hover:bg-muted rounded opacity-60 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden relative font-mono text-sm">
        {activeFile ? (
          <textarea
            ref={ref}
            className="w-full h-full p-4 bg-editor-bg text-foreground/90 resize-none outline-none font-mono text-sm leading-relaxed"
            value={activeFile.content}
            onChange={(e) => onContentChange(activeFile.id, e.target.value)}
            spellCheck={false}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">Select a file from the workspace to view its content</p>
            <p className="text-xs opacity-50">Use the folder icon ↖ to pick a workspace folder</p>
          </div>
        )}
      </div>
    </div>
  );
}
