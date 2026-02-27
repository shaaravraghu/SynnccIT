import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MessageSquare, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActionLog } from '@/types/api';

interface AgentPanelProps {
  className?: string;
  actions?: ActionLog[];
  agentName?: string;
  agentStatus?: 'idle' | 'working';
  statusDescription?: string;
}

export function AgentPanel({ 
  className, 
  actions = [],
  agentName = 'No Agent',
  agentStatus = 'idle',
  statusDescription = 'No active task'
}: AgentPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className={cn('h-full flex flex-col bg-card', className)}>
      {/* Header */}
      <div className="ide-panel-header">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <Bot className="h-4 w-4 text-primary" />
          <span className="ide-panel-title">Current Working Agent</span>
        </button>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Agent Status */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Agent: {agentName}</span>
              <span className={cn(
                'status-badge',
                agentStatus === 'working' ? 'info' : 'text-muted-foreground'
              )}>
                {agentStatus === 'working' ? 'Working' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {statusDescription}
            </p>
          </div>

          {/* Actions Queue */}
          <div className="flex-1 overflow-auto p-3 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Actions Queue
            </h4>
            {actions.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No actions in queue
              </div>
            ) : (
              actions.map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    'p-2 rounded-md border text-sm',
                    action.status === 'completed' && 'border-success/30 bg-success/5',
                    action.status === 'running' && 'border-primary/30 bg-primary/5',
                    action.status === 'pending' && 'border-border bg-secondary/20'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {action.status === 'running' && (
                      <Loader2 className="h-3 w-3 text-primary animate-spin" />
                    )}
                    {action.status === 'completed' && (
                      <div className="h-3 w-3 rounded-full bg-success" />
                    )}
                    {action.status === 'pending' && (
                      <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                    )}
                    <span className={cn(
                      action.status === 'pending' && 'text-muted-foreground'
                    )}>
                      {action.action}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Team Comment */}
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              <MessageSquare className="h-4 w-4" />
              Raise a comment for the team
            </Button>
            
            {showPrompt && (
              <div className="mt-3 space-y-2 animate-fade-in">
                <textarea
                  placeholder="Enter your comment or question..."
                  className="w-full h-20 p-2 text-sm bg-secondary/30 border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPrompt(false)}>
                    Cancel
                  </Button>
                  <Button size="sm">Send</Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
