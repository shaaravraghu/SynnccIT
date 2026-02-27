import { useState } from 'react';
import { ChevronUp, ChevronDown, Plus, MessageSquare, Send, Bot, CheckCircle, Loader2, Clock, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AgentAction {
  id: string;
  action: string;
  status: 'completed' | 'running' | 'pending' | 'failed';
  result?: string;
}

interface AgentSidePanelProps {
  className?: string;
  actions?: AgentAction[];
  isActive?: boolean;
  statusMessage?: string;
}

export function AgentSidePanel({
  className,
  actions: initialActions = [],
  isActive = false,
  statusMessage = 'No active agent'
}: AgentSidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [localActions, setLocalActions] = useState<AgentAction[]>(initialActions);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;

    const newActionId = Date.now().toString();
    const newAction: AgentAction = {
      id: newActionId,
      action: prompt,
      status: 'running'
    };

    setLocalActions(prev => [newAction, ...prev]);
    setPrompt('');
    setShowInput(false);
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newAction.action }),
      });

      const data = await res.json();

      setLocalActions(prev => prev.map(a =>
        a.id === newActionId
          ? {
            ...a,
            status: 'completed',
            result: data.cmd ? `Command: ${data.cmd}\n${data.desc}` : JSON.stringify(data)
          }
          : a
      ));
    } catch (err) {
      setLocalActions(prev => prev.map(a =>
        a.id === newActionId
          ? { ...a, status: 'failed', result: 'Failed to contact agent' }
          : a
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: AgentAction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'failed':
        return <Terminal className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  return (
    <div className={cn('h-full flex flex-col bg-card', className)}>
      {/* Header with collapse toggle */}
      <div className="ide-panel-header justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="ide-panel-title">Current Working Agent</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Agent Status */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isLoading ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
              )} />
              <span className="text-sm font-medium">
                {isLoading ? 'Agent Thinking...' : 'Agent Idle'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {statusMessage}
            </p>
          </div>

          {/* Action Queue */}
          <div className="flex-1 overflow-auto p-3">
            {localActions.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No actions in queue
              </div>
            ) : (
              <div className="space-y-2">
                {localActions.map((action) => (
                  <div
                    key={action.id}
                    className={cn(
                      'flex flex-col gap-1 p-2 rounded-md text-xs border',
                      action.status === 'running' && 'bg-primary/10 border-primary/20',
                      action.status === 'completed' && 'bg-secondary/30 border-transparent',
                      action.status === 'failed' && 'bg-destructive/10 border-destructive/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(action.status)}
                      <span className="flex-1 font-medium">{action.action}</span>
                    </div>
                    {action.result && (
                      <div className="ml-5 mt-1 text-muted-foreground whitespace-pre-wrap font-mono bg-background/50 p-1 rounded">
                        {action.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Action Input */}
          <div className="p-3 border-t border-border space-y-2">
            {!showInput ? (
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowInput(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Start new action with prompt
              </Button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell the agent what to do..."
                  className="w-full h-20 p-2 bg-secondary/20 border border-border rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setShowInput(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleSendPrompt}
                    disabled={isLoading}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Run
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
