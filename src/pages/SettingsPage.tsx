import { useState } from 'react';
import {
  User,
  Bell,
  Palette,
  Shield,
  FolderOpen,
  Key,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettingsState {
  profile: {
    name: string;
    email: string;
    bio: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    mentionAlerts: boolean;
  };
  appearance: {
    theme: string;
    fontSize: string;
    compactMode: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: string;
  };
  project: {
    autoSave: boolean;
    backupFrequency: string;
    defaultBranch: string;
  };
  api: {
    apiKey: string;
    webhookUrl: string;
    rateLimit: string;
  };
}

const defaultSettings: SettingsState = {
  profile: {
    name: '',
    email: '',
    bio: '',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    mentionAlerts: true,
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: '30',
  },
  project: {
    autoSave: true,
    backupFrequency: 'daily',
    defaultBranch: 'main',
  },
  api: {
    apiKey: '',
    webhookUrl: '',
    rateLimit: '1000',
  },
};

interface SettingsPageProps {
  initialSettings?: SettingsState;
  onSave?: (settings: SettingsState) => Promise<void>;
  onReset?: () => Promise<void>;
  onExport?: () => Promise<void>;
  onImport?: (data: unknown) => Promise<void>;
  onDeleteProject?: () => Promise<void>;
}

export default function SettingsPage({
  initialSettings = defaultSettings,
  onSave,
  onReset,
  onExport,
  onImport,
  onDeleteProject,
}: SettingsPageProps) {
  const [settings, setSettings] = useState<SettingsState>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = <K extends keyof SettingsState>(
    category: K,
    key: keyof SettingsState[K],
    value: SettingsState[K][keyof SettingsState[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(settings);
    }
    setHasChanges(false);
  };

  const handleReset = async () => {
    if (onReset) {
      await onReset();
    }
    setSettings(defaultSettings);
    setHasChanges(false);
  };

  const handleExportData = async () => {
    if (onExport) {
      await onExport();
    } else {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'settings-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const regenerateApiKey = () => {
    const newKey = 'sk-' + Array.from({ length: 4 }, () => 
      Math.random().toString(36).substring(2, 6)
    ).join('-');
    updateSettings('api', 'apiKey', newKey);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 bg-secondary/30 border-b border-border">
        <h1 className="text-lg font-semibold">Settings</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="profile" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="project" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Project
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Display Name</label>
                <Input
                  value={settings.profile.name}
                  onChange={(e) => updateSettings('profile', 'name', e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bio</label>
                <Textarea
                  value={settings.profile.bio}
                  onChange={(e) => updateSettings('profile', 'bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Change Avatar
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a weekly summary of activity' },
                { key: 'mentionAlerts', label: 'Mention Alerts', description: 'Get notified when someone mentions you' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                    onCheckedChange={(checked) => updateSettings('notifications', item.key as keyof typeof settings.notifications, checked)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <Select 
                  value={settings.appearance.theme} 
                  onValueChange={(v) => updateSettings('appearance', 'theme', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Font Size</label>
                <Select 
                  value={settings.appearance.fontSize} 
                  onValueChange={(v) => updateSettings('appearance', 'fontSize', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
                </div>
                <Switch
                  checked={settings.appearance.compactMode}
                  onCheckedChange={(checked) => updateSettings('appearance', 'compactMode', checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={settings.security.twoFactorEnabled}
                  onCheckedChange={(checked) => updateSettings('security', 'twoFactorEnabled', checked)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Session Timeout (minutes)</label>
                <Select 
                  value={settings.security.sessionTimeout} 
                  onValueChange={(v) => updateSettings('security', 'sessionTimeout', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
          </TabsContent>

          {/* Project Tab */}
          <TabsContent value="project" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                <div>
                  <p className="font-medium">Auto-Save</p>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch
                  checked={settings.project.autoSave}
                  onCheckedChange={(checked) => updateSettings('project', 'autoSave', checked)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Backup Frequency</label>
                <Select 
                  value={settings.project.backupFrequency} 
                  onValueChange={(v) => updateSettings('project', 'backupFrequency', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Default Branch</label>
                <Input
                  value={settings.project.defaultBranch}
                  onChange={(e) => updateSettings('project', 'defaultBranch', e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
              <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These actions are irreversible. Please proceed with caution.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your project
                      and remove all associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onDeleteProject} 
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">API Key</label>
                <div className="flex gap-2">
                  <Input
                    value={settings.api.apiKey || 'No API key generated'}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" onClick={regenerateApiKey}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep this key secret. It provides full access to your account.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                <Input
                  value={settings.api.webhookUrl}
                  onChange={(e) => updateSettings('api', 'webhookUrl', e.target.value)}
                  placeholder="https://your-webhook-url.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Rate Limit (requests/minute)</label>
                <Input
                  type="number"
                  value={settings.api.rateLimit}
                  onChange={(e) => updateSettings('api', 'rateLimit', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
