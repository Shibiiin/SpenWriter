import { useRef } from 'react'
import { Sun, Moon, Monitor, Download, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import type { AppSettings } from '@/types'
import { LANGUAGE_LABELS, SPEAKER_LABELS } from '@/types'
import type { SarvamLanguage, SarvamSpeaker } from '@/types'
import { useState } from 'react'

interface SettingsPanelProps {
  settings: AppSettings
  onUpdate: (changes: Partial<AppSettings>) => void
  onExport: () => Promise<string>
  onImport: (json: string) => Promise<void>
  onClearAll: () => Promise<void>
}

export function SettingsPanel({
  settings,
  onUpdate,
  onExport,
  onImport,
  onClearAll,
}: SettingsPanelProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    const data = await onExport()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spenwriter-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await onImport(text)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Voice settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voice Settings</CardTitle>
          <CardDescription>Configure language and speaker preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select
                value={settings.language}
                onValueChange={(v) => onUpdate({ language: v as SarvamLanguage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LANGUAGE_LABELS) as [SarvamLanguage, string][]).map(
                    ([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Speaker</label>
              <Select
                value={settings.speaker}
                onValueChange={(v) => onUpdate({ speaker: v as SarvamSpeaker })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SPEAKER_LABELS) as [SarvamSpeaker, string][]).map(
                    ([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-play responses</p>
              <p className="text-xs text-muted-foreground">Automatically speak text messages</p>
            </div>
            <Switch
              checked={settings.autoPlayResponses}
              onCheckedChange={(v) => onUpdate({ autoPlayResponses: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Save audio locally</p>
              <p className="text-xs text-muted-foreground">Store recordings in IndexedDB</p>
            </div>
            <Switch
              checked={settings.saveAudioLocally}
              onCheckedChange={(v) => onUpdate({ saveAudioLocally: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' },
            ] as const).map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={settings.theme === value ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => onUpdate({ theme: value })}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
          <CardDescription>Export, import, or clear your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Separator />

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Clear confirmation dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all conversations, audio files, and settings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onClearAll()
                setShowClearDialog(false)
              }}
            >
              Clear Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
