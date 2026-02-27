// API Types - Ready for Flask/Django integration
// All API calls will go through these typed interfaces

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  projectId: string;
  status: 'idle' | 'working' | 'paused' | 'error';
  currentTask?: string;
  parameters: AgentParameters;
}

export interface AgentParameters {
  context: number;
  temperature: number;
  memory: number;
  model?: string;
}

export interface Chat {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface OpenFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
}

export interface TerminalOutput {
  id: string;
  type: 'command' | 'output' | 'error' | 'ai-summary';
  content: string;
  timestamp: string;
}

export interface ActionLog {
  id: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  details?: string;
}

export interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  isOnline: boolean;
}

export interface Commit {
  id: string;
  message: string;
  author: string;
  timestamp?: string;
  time?: string;
  changes?: number;
  summary?: string;
}

export interface IssueRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'review' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  createdAt: string;
}

export interface TestCase {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  duration?: number;
}

export interface Metrics {
  efficiency: number;
  scalability: number;
  complexity: number;
  coverage: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// API endpoints configuration (placeholder for backend integration)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Projects
  projects: '/projects',
  project: (id: string) => `/projects/${id}`,
  
  // Agents
  agents: '/agents',
  agent: (id: string) => `/agents/${id}`,
  agentActions: (id: string) => `/agents/${id}/actions`,
  
  // Chats
  chats: '/chats',
  chat: (id: string) => `/chats/${id}`,
  chatMessages: (id: string) => `/chats/${id}/messages`,
  
  // Files
  files: '/files',
  fileContent: (path: string) => `/files/content?path=${encodeURIComponent(path)}`,
  
  // Terminal
  terminal: '/terminal',
  terminalExecute: '/terminal/execute',
  
  // Status
  commits: '/commits',
  issues: '/issues',
  reviews: '/reviews',
  
  // Testing
  tests: '/tests',
  testRun: '/tests/run',
  metrics: '/metrics',
} as const;
