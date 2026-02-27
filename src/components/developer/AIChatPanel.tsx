import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeContext?: string;
}

interface AIChatPanelProps {
  className?: string;
  currentCode?: string;
  currentFile?: string;
  onSendMessage?: (message: string, codeContext?: string) => Promise<string>;
}

export function AIChatPanel({ className, currentCode, currentFile, onSendMessage }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeCode, setIncludeCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !includeCode) return;

    const userContent = includeCode && currentCode 
      ? `${input}\n\n\`\`\`${currentFile || 'code'}\n${currentCode}\n\`\`\``
      : input;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      codeContext: includeCode ? currentFile : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIncludeCode(false);
    setIsLoading(true);

    try {
      // TODO: Connect to backend API
      const response = onSendMessage 
        ? await onSendMessage(input, includeCode ? currentCode : undefined)
        : 'AI response will appear here once connected to backend.';
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('h-full flex flex-col bg-card', className)}>
      {/* Header */}
      <div className="ide-panel-header">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="ide-panel-title">AI Assistant</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' && 'flex-row-reverse'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'assistant' ? 'bg-primary/20' : 'bg-secondary'
              )}>
                {msg.role === 'assistant' ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className={cn(
                'max-w-[85%] rounded-lg p-3 text-sm',
                msg.role === 'assistant' 
                  ? 'bg-secondary/30 border border-border' 
                  : 'bg-primary/10 border border-primary/20'
              )}>
                {msg.codeContext && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Code className="h-3 w-3" />
                    <span>Including: {msg.codeContext}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-secondary/30 border border-border rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border space-y-2">
        {currentCode && (
          <button
            onClick={() => setIncludeCode(!includeCode)}
            className={cn(
              'flex items-center gap-2 text-xs px-2 py-1 rounded transition-colors',
              includeCode 
                ? 'bg-primary/20 text-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <Code className="h-3 w-3" />
            {includeCode ? `Including: ${currentFile}` : 'Include current file'}
          </button>
        )}
        
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about code, request changes, or paste code to analyze..."
            className="w-full h-20 p-3 pr-12 bg-secondary/20 border border-border rounded-lg resize-none text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute bottom-3 right-3 h-8 w-8"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !includeCode)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
