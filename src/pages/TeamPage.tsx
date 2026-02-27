import { useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Shield,
  User,
  Crown,
  Code,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Contributor } from '@/types/api';

interface TeamMember extends Contributor {
  email: string;
  joinedAt: string;
  lastActive: string;
}

interface TeamPageProps {
  initialMembers?: TeamMember[];
  onAddMember?: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  onEditMember?: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void>;
}

export default function TeamPage({
  initialMembers = [],
  onAddMember,
  onEditMember,
  onDeleteMember,
}: TeamPageProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState<{ name: string; email: string; role: 'admin' | 'developer' | 'viewer' }>({ name: '', email: '', role: 'developer' });

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async () => {
    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      isOnline: false,
      joinedAt: new Date().toISOString().split('T')[0],
      lastActive: 'Never',
    };
    
    if (onAddMember) {
      await onAddMember(member);
    }
    
    setMembers([...members, member]);
    setAddDialogOpen(false);
    setNewMember({ name: '', email: '', role: 'developer' });
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;
    
    if (onEditMember) {
      await onEditMember(selectedMember.id, selectedMember);
    }
    
    setMembers(members.map(m => m.id === selectedMember.id ? selectedMember : m));
    setEditDialogOpen(false);
    setSelectedMember(null);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    if (onDeleteMember) {
      await onDeleteMember(selectedMember.id);
    }
    
    setMembers(members.filter(m => m.id !== selectedMember.id));
    setDeleteDialogOpen(false);
    setSelectedMember(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'developer': return <Code className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'developer': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'viewer': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-secondary/30 border-b border-border">
        <h1 className="text-lg font-semibold">Team Members</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  placeholder="Full name..."
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v as 'admin' | 'developer' | 'viewer' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} className="w-full" disabled={!newMember.name || !newMember.email}>
                Add Team Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border">
        <div className="p-3 bg-secondary/30 rounded-lg text-center">
          <span className="text-2xl font-bold">{members.length}</span>
          <p className="text-xs text-muted-foreground">Total Members</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <span className="text-2xl font-bold text-success">{members.filter(m => m.isOnline).length}</span>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        <div className="p-3 bg-purple-500/10 rounded-lg text-center">
          <span className="text-2xl font-bold text-purple-500">{members.filter(m => m.role === 'admin' || m.role === 'owner').length}</span>
          <p className="text-xs text-muted-foreground">Admins</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-lg text-center">
          <span className="text-2xl font-bold text-blue-500">{members.filter(m => m.role === 'developer').length}</span>
          <p className="text-xs text-muted-foreground">Developers</p>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-auto p-4">
        {filteredMembers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {members.length === 0 ? 'No team members yet. Add your first member.' : 'No members found matching your search.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {member.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs border flex items-center gap-1',
                      getRoleBadgeClass(member.role)
                    )}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined: {member.joinedAt} • Last active: {member.lastActive}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedMember(member);
                      setEditDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {member.role !== 'owner' && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedMember(member);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={selectedMember.name}
                  onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={selectedMember.email}
                  onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role</label>
                <Select 
                  value={selectedMember.role} 
                  onValueChange={(v: 'owner' | 'admin' | 'developer' | 'viewer') => setSelectedMember({ ...selectedMember, role: v })}
                  disabled={selectedMember.role === 'owner'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditMember} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.name} from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
