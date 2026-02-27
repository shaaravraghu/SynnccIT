import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Send, 
  Sliders,
  Users,
  Activity,
  FolderOpen,
  MessageSquare,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  X,
  FileText,
  Image,
  File,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Contributor } from "@/types/api";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface Transcription {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ActionTaken {
  id: string;
  action: string;
  status: 'completed' | 'running' | 'pending';
}

interface PastTranscription {
  id: string;
  title: string;
  date: string;
}

interface AgentPageProps {
  contributors?: Contributor[];
  actionsTaken?: ActionTaken[];
  pastTranscriptions?: PastTranscription[];
  transcriptions?: Transcription[];
  onSendPrompt?: (prompt: string, files: UploadedFile[]) => Promise<void>;
}

const AgentPage = ({
  contributors = [],
  actionsTaken = [],
  pastTranscriptions = [],
  transcriptions = [],
  onSendPrompt,
}: AgentPageProps) => {
  const [prompt, setPrompt] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    agents: true,
    chats: true,
    transcriptions: true,
    contributors: true,
  });
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-3 w-3" />;
    if (type.includes('text') || type.includes('document')) return <FileText className="h-3 w-3" />;
    return <File className="h-3 w-3" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSend = async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) return;
    
    setIsLoading(true);
    try {
      if (onSendPrompt) {
        await onSendPrompt(prompt, uploadedFiles);
      }
      setPrompt('');
      setUploadedFiles([]);
    } catch (error) {
      console.error('Failed to send prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left Sidebar - Collapsible */}
      <div className={`${leftSidebarCollapsed ? 'w-12' : 'w-64'} border-r border-border flex flex-col transition-all duration-300`}>
        {/* Toggle Button */}
        <div className="p-2 border-b border-border flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className="h-7 w-7"
          >
            {leftSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {!leftSidebarCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Projects Section */}
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 rounded px-2 py-1"
                  onClick={() => toggleSection('projects')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.projects ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Projects</span>
                  </div>
                </div>
                {expandedSections.projects && (
                  <div className="ml-6 mt-2 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7">
                      <Plus className="h-3 w-3" />
                      New Project
                    </Button>
                  </div>
                )}
              </div>

              {/* Agents Section */}
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 rounded px-2 py-1"
                  onClick={() => toggleSection('agents')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.agents ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Bot className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Agents</span>
                  </div>
                </div>
                {expandedSections.agents && (
                  <div className="ml-6 mt-2 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7">
                      <Plus className="h-3 w-3" />
                      New Agent
                    </Button>
                  </div>
                )}
              </div>

              {/* Chats Section */}
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 rounded px-2 py-1"
                  onClick={() => toggleSection('chats')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.chats ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Chats</span>
                  </div>
                </div>
                {expandedSections.chats && (
                  <div className="ml-6 mt-2 space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7">
                      <Plus className="h-3 w-3" />
                      New Chat
                    </Button>
                  </div>
                )}
              </div>

              {/* Past Transcriptions Section */}
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 rounded px-2 py-1"
                  onClick={() => toggleSection('transcriptions')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.transcriptions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <History className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Past Transcriptions</span>
                  </div>
                </div>
                {expandedSections.transcriptions && (
                  <div className="ml-6 mt-2 space-y-1">
                    {pastTranscriptions.length === 0 ? (
                      <div className="text-xs text-muted-foreground px-2 py-1 italic">
                        No previous executions
                      </div>
                    ) : (
                      pastTranscriptions.map((item) => (
                        <div key={item.id} className="text-xs text-muted-foreground px-2 py-1 hover:bg-secondary/30 rounded cursor-pointer">
                          <div>{item.title}</div>
                          <div className="text-[10px] opacity-70">{item.date}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Override Parameters Section */}
        <div className="p-4 border-b border-border bg-secondary/10">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Override Parameters</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 bg-card rounded border border-border">
              <label className="text-xs text-muted-foreground block mb-1">Context Length</label>
              <input
                type="number"
                defaultValue={4096}
                className="w-full bg-secondary/30 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="p-2 bg-card rounded border border-border">
              <label className="text-xs text-muted-foreground block mb-1">Temperature</label>
              <input
                type="number"
                step="0.1"
                defaultValue={0.7}
                className="w-full bg-secondary/30 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="p-2 bg-card rounded border border-border">
              <label className="text-xs text-muted-foreground block mb-1">Memory</label>
              <select className="w-full bg-secondary/30 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Enabled</option>
                <option>Disabled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transcriptions Area */}
        <div className="flex-1 overflow-auto p-4">
          <h3 className="text-sm font-medium mb-3">Transcriptions</h3>
          {transcriptions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transcriptions yet. Start a conversation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcriptions.map((t) => (
                <div key={t.id} className={cn(
                  'p-4 rounded-lg border',
                  t.role === 'assistant' ? 'bg-secondary/20 border-border' : 'bg-primary/5 border-primary/20'
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                      t.role === 'assistant' ? 'bg-primary/20' : 'bg-secondary'
                    )}>
                      {t.role === 'assistant' ? (
                        <Bot className="h-3 w-3 text-primary" />
                      ) : (
                        <span className="text-xs font-medium">U</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{t.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prompting Area */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">
            Prompting Area - Allows file input and audio transcription
          </div>
          
          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadedFiles.map(file => (
                <div 
                  key={file.id} 
                  className="flex items-center gap-2 px-2 py-1 bg-secondary/30 rounded-md border border-border text-xs"
                >
                  {getFileIcon(file.type)}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              className="w-full h-32 p-3 pr-24 bg-secondary/20 border border-border rounded-lg resize-none text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="*/*"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                disabled={isLoading || (!prompt.trim() && uploadedFiles.length === 0)}
                onClick={handleSend}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Collapsible */}
      <div className={`${rightSidebarCollapsed ? 'w-12' : 'w-72'} border-l border-border flex flex-col transition-all duration-300`}>
        {/* Toggle Button */}
        <div className="p-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            className="h-7 w-7"
          >
            {rightSidebarCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          </Button>
        </div>

        {!rightSidebarCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Contributors Section */}
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 rounded px-2 py-1"
                  onClick={() => toggleSection('contributors')}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.contributors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Contributors</span>
                  </div>
                </div>
                {expandedSections.contributors && (
                  <div className="mt-2 space-y-2">
                    {contributors.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2">No contributors</p>
                    ) : (
                      contributors.map((contributor) => (
                        <div
                          key={contributor.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-secondary/30"
                        >
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                              {contributor.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            {contributor.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{contributor.name}</div>
                            <div className="text-xs text-muted-foreground">{contributor.role}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Actions Taken Section */}
              <div>
                <div className="flex items-center gap-2 px-2 py-1 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Actions Taken</span>
                </div>
                <div className="space-y-2">
                  {actionsTaken.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2">No actions yet</p>
                  ) : (
                    actionsTaken.map((action) => (
                      <div
                        key={action.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded text-xs',
                          action.status === 'completed' && 'bg-success/10',
                          action.status === 'running' && 'bg-primary/10',
                          action.status === 'pending' && 'bg-secondary/30'
                        )}
                      >
                        {action.status === 'running' && (
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        )}
                        {action.status === 'completed' && (
                          <div className="w-3 h-3 rounded-full bg-success" />
                        )}
                        {action.status === 'pending' && (
                          <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                        )}
                        <span className={cn(
                          action.status === 'pending' && 'text-muted-foreground'
                        )}>
                          {action.action}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default AgentPage;
