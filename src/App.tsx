import { useState, useCallback } from 'react'
import { Mic, History, FileAudio, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/Header'
import { VoiceChat } from '@/components/voice/VoiceChat'
import { ConversationHistory } from '@/components/memory/ConversationHistory'
import { FileManager } from '@/components/memory/FileManager'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { useTheme } from '@/hooks/useTheme'
import { useConversations, useAudioFiles, useSettings } from '@/hooks/useMemory'
import type { Conversation, Message } from '@/types'

export default function App() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { conversations, loading: convsLoading, create, update, remove, search, exportData, importData, clearAll } = useConversations()
  const { files, loading: filesLoading, save: saveAudio, remove: removeAudio } = useAudioFiles()
  const { settings, updateSettings } = useSettings()

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [activeTab, setActiveTab] = useState('chat')

  const handleToggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    updateSettings({ theme: next })
  }

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv)
    setActiveTab('chat')
  }

  const handleUpdateConversation = useCallback(
    async (messages: Message[]) => {
      if (activeConversation?.id != null) {
        await update(activeConversation.id, {
          messages,
          updatedAt: new Date(),
        })
        setActiveConversation((prev) =>
          prev ? { ...prev, messages, updatedAt: new Date() } : null
        )
      } else {
        const title =
          messages[0]?.text.substring(0, 50) || 'New Conversation'
        const newConv: Omit<Conversation, 'id'> = {
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          language: settings.language,
          messages,
        }
        const id = await create(newConv)
        setActiveConversation({ ...newConv, id: id as number })
      }
    },
    [activeConversation, create, update, settings.language]
  )

  const handleSaveAudio = useCallback(
    async (blob: Blob, name: string) => {
      if (!settings.saveAudioLocally) return
      await saveAudio({
        name,
        blob,
        mimeType: blob.type,
        size: blob.size,
        duration: 0,
        conversationId: activeConversation?.id,
        createdAt: new Date(),
      })
    },
    [settings.saveAudioLocally, saveAudio, activeConversation]
  )

  const handleNewConversation = () => {
    setActiveConversation(null)
  }

  // Sync theme from settings
  if (settings.theme !== theme) {
    setTheme(settings.theme)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header resolvedTheme={resolvedTheme} onToggleTheme={handleToggleTheme} />
      <main className="container mx-auto max-w-5xl px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="gap-1.5">
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice Chat</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <FileAudio className="w-4 h-4" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {activeConversation ? activeConversation.title : 'New Conversation'}
              </h2>
              {activeConversation && (
                <button
                  onClick={handleNewConversation}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  + New
                </button>
              )}
            </div>
            <VoiceChat
              language={settings.language}
              speaker={settings.speaker}
              autoPlay={settings.autoPlayResponses}
              conversation={activeConversation}
              onUpdateConversation={handleUpdateConversation}
              onSaveAudio={handleSaveAudio}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Conversation History</h2>
            <ConversationHistory
              conversations={conversations}
              loading={convsLoading}
              onSelect={handleSelectConversation}
              onDelete={remove}
              onSearch={search}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Audio Files</h2>
            <FileManager
              files={files}
              loading={filesLoading}
              onDelete={removeAudio}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <SettingsPanel
              settings={settings}
              onUpdate={updateSettings}
              onExport={exportData}
              onImport={importData}
              onClearAll={clearAll}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
