import { useState } from 'react';
import {
  Calendar,
  GitFork,
  GitCommit,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowDown,
  Eye,
  TrendingUp,
  Users,
  Code,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IssueRequest, Commit } from '@/types/api';

interface TimelinePoint {
  id: string;
  date: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ForkHistory {
  id: string;
  date: string;
  branch: string;
  description: string;
}

interface Review {
  id: string;
  title: string;
  reviewer: string;
  status: 'pending' | 'approved' | 'changes-requested';
  requestedBy: string;
}

interface ProjectSummary {
  totalCommits: number;
  activeBranches: number;
  openIssues: number;
  completedTasks: number;
  teamMembers: number;
  codeChanges: { additions: number; deletions: number };
  recentActivity: { type: string; message: string; time: string }[];
}

interface StatusPageProps {
  issues?: IssueRequest[];
  reviews?: Review[];
  commits?: Commit[];
  timeline?: TimelinePoint[];
  forkingHistory?: ForkHistory[];
  projectSummary?: ProjectSummary;
}

const defaultSummary: ProjectSummary = {
  totalCommits: 0,
  activeBranches: 0,
  openIssues: 0,
  completedTasks: 0,
  teamMembers: 0,
  codeChanges: { additions: 0, deletions: 0 },
  recentActivity: [],
};

export default function StatusPage({
  issues = [],
  reviews = [],
  commits = [],
  timeline = [],
  forkingHistory = [],
  projectSummary = defaultSummary,
}: StatusPageProps) {
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [selectedFork, setSelectedFork] = useState<string | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'medium' });
  const [newReview, setNewReview] = useState({ title: '', reviewer: '', description: '' });

  const handleRaiseIssue = () => {
    // TODO: Connect to backend API
    console.log('Raising issue:', newIssue);
    setIssueDialogOpen(false);
    setNewIssue({ title: '', description: '', priority: 'medium' });
  };

  const handleRequestReview = () => {
    // TODO: Connect to backend API
    console.log('Requesting review:', newReview);
    setReviewDialogOpen(false);
    setNewReview({ title: '', reviewer: '', description: '' });
  };

  const selectedCommitData = commits.find(c => c.id === selectedCommit);
  const selectedForkData = forkingHistory.find(f => f.id === selectedFork);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-10 flex items-center px-4 bg-secondary/30 border-b border-border">
        <span className="text-sm text-muted-foreground">Project Status & History</span>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {/* Project Summary Section */}
        <section className="mb-8 p-4 bg-gradient-to-r from-primary/10 to-secondary/20 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Project Work Summary</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <GitCommit className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Commits</span>
              </div>
              <span className="text-xl font-bold">{projectSummary.totalCommits}</span>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <GitFork className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Active Branches</span>
              </div>
              <span className="text-xl font-bold">{projectSummary.activeBranches}</span>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Open Issues</span>
              </div>
              <span className="text-xl font-bold">{projectSummary.openIssues}</span>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <span className="text-xl font-bold">{projectSummary.completedTasks}</span>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Team Members</span>
              </div>
              <span className="text-xl font-bold">{projectSummary.teamMembers}</span>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Code className="h-4 w-4 text-cyan-500" />
                <span className="text-xs text-muted-foreground">Code Changes</span>
              </div>
              <span className="text-sm font-bold text-green-500">+{projectSummary.codeChanges.additions}</span>
              <span className="text-sm font-bold text-red-500 ml-1">-{projectSummary.codeChanges.deletions}</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recent Activity
            </h3>
            {projectSummary.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent activity</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {projectSummary.recentActivity.map((activity, i) => (
                  <div key={i} className="px-3 py-1.5 bg-secondary/50 rounded-full text-xs flex items-center gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      activity.type === 'commit' && 'bg-primary',
                      activity.type === 'issue' && 'bg-orange-500',
                      activity.type === 'review' && 'bg-green-500'
                    )} />
                    <span>{activity.message}</span>
                    <span className="text-muted-foreground">• {activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Project Timeline */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Project Timeline</h2>
            <span className="text-xs text-muted-foreground ml-2">(Real Completion vs Projected)</span>
          </div>
          
          {timeline.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 bg-secondary/20 rounded-lg">
              No timeline data available
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-4 left-0 right-0 h-1 bg-border rounded-full" />
              <div className="absolute top-6 left-0 right-0 h-0.5 border-t-2 border-dashed border-muted-foreground/30" />
              <div 
                className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all"
                style={{ width: `${(timeline.filter(p => p.completed).length / timeline.length) * 100}%` }}
              />
              
              <div className="absolute top-4 right-4 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
              
              <div className="relative flex justify-between">
                {timeline.map((point) => (
                  <div key={point.id} className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all',
                        point.completed && 'bg-primary text-primary-foreground',
                        point.current && 'bg-primary/20 border-2 border-primary text-primary animate-pulse-glow',
                        !point.completed && !point.current && 'bg-secondary border-2 border-border text-muted-foreground'
                      )}
                    >
                      {point.completed && <CheckCircle2 className="h-4 w-4" />}
                      {point.current && <Clock className="h-4 w-4" />}
                      {!point.completed && !point.current && <span className="text-xs">○</span>}
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">{point.date}</span>
                    <span className="text-sm font-medium mt-1">{point.label}</span>
                    {point.current && (
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowDown className="h-3 w-3 text-primary animate-bounce" />
                        <span className="text-xs text-primary">Current</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Issues & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Issue Requests */}
          <section className="ide-panel">
            <div className="ide-panel-header">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <span className="ide-panel-title">Issue Request</span>
              </div>
              <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="h-3 w-3" />
                    Raise Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Raise New Issue Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Title</label>
                      <Input 
                        placeholder="Issue title..."
                        value={newIssue.title}
                        onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea 
                        placeholder="Describe the issue..."
                        value={newIssue.description}
                        onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Priority</label>
                      <Select value={newIssue.priority} onValueChange={(v) => setNewIssue({ ...newIssue, priority: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleRaiseIssue} className="w-full">
                      Raise Issue
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-4 space-y-3">
              {issues.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No issues</p>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{issue.title}</span>
                      <span className={cn(
                        'status-badge',
                        issue.priority === 'high' && 'error',
                        issue.priority === 'medium' && 'warning',
                        issue.priority === 'low' && 'info'
                      )}>
                        {issue.priority}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{issue.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Reviews */}
          <section className="ide-panel">
            <div className="ide-panel-header">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="ide-panel-title">Review</span>
              </div>
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="h-3 w-3" />
                    Request Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Developer Review</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">PR / Branch Title</label>
                      <Input 
                        placeholder="PR #XX: Feature name..."
                        value={newReview.title}
                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Reviewer</label>
                      <Input 
                        placeholder="Reviewer name..."
                        value={newReview.reviewer}
                        onChange={(e) => setNewReview({ ...newReview, reviewer: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea 
                        placeholder="What should the reviewer focus on..."
                        value={newReview.description}
                        onChange={(e) => setNewReview({ ...newReview, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleRequestReview} className="w-full">
                      Request Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-4 space-y-3">
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No reviews</p>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{review.title}</span>
                      <span className={cn(
                        'status-badge',
                        review.status === 'approved' && 'success',
                        review.status === 'pending' && 'warning',
                        review.status === 'changes-requested' && 'error'
                      )}>
                        {review.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>Reviewer: {review.reviewer}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Forking & Commit History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forking History */}
          <section className="ide-panel">
            <div className="ide-panel-header">
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-blue-500" />
                <span className="ide-panel-title">Forking History</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {forkingHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No forking history</p>
              ) : (
                forkingHistory.map((fork) => (
                  <div
                    key={fork.id}
                    onClick={() => setSelectedFork(fork.id === selectedFork ? null : fork.id)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedFork === fork.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-secondary/30 hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{fork.branch}</span>
                      <span className="text-xs text-muted-foreground">{fork.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{fork.description}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Commit History */}
          <section className="ide-panel">
            <div className="ide-panel-header">
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-primary" />
                <span className="ide-panel-title">Commit History</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {commits.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No commits</p>
              ) : (
                commits.map((commit) => (
                  <div
                    key={commit.id}
                    onClick={() => setSelectedCommit(commit.id === selectedCommit ? null : commit.id)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedCommit === commit.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-secondary/30 hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate max-w-[200px]">{commit.message}</span>
                      <span className="text-xs text-muted-foreground">{commit.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">by {commit.author}</div>
                    
                    {selectedCommit === commit.id && commit.summary && (
                      <div className="mt-3 p-2 bg-primary/10 rounded border border-primary/20 animate-fade-in">
                        <div className="flex items-center gap-1 text-xs text-primary mb-1">
                          <Sparkles className="h-3 w-3" />
                          <span>AI Summary</span>
                        </div>
                        <p className="text-xs">{commit.summary}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
