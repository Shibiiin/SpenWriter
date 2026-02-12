import { useState, useEffect, useCallback } from 'react'
import { db } from '@/services/db'
import type { Conversation, AudioFile, AppSettings, AppLanguage, VoiceSpeaker } from '@/types'
import { DEFAULT_SETTINGS, LANGUAGE_LABELS, SPEAKER_LABELS } from '@/types'

// Migrate old Sarvam language codes (hi-IN -> hi) and speaker names (meera -> nova)
function migrateSettings(s: AppSettings): AppSettings {
  let language = s.language
  let speaker = s.speaker

  // Convert old "xx-IN" codes to new "xx" codes
  if (typeof language === 'string' && language.includes('-')) {
    const base = language.split('-')[0] as AppLanguage
    language = base in LANGUAGE_LABELS ? base : DEFAULT_SETTINGS.language
  }

  // Convert old Sarvam speaker names to new VoiceSpeaker names
  if (typeof speaker === 'string' && !(speaker in SPEAKER_LABELS)) {
    speaker = DEFAULT_SETTINGS.speaker
  }

  return { ...s, language: language as AppLanguage, speaker: speaker as VoiceSpeaker }
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await db.conversations.orderBy('updatedAt').reverse().toArray()
    setConversations(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (conv: Omit<Conversation, 'id'>) => {
    const id = await db.conversations.add(conv as Conversation)
    await load()
    return id
  }

  const update = async (id: number, changes: Partial<Conversation>) => {
    await db.conversations.update(id, changes)
    await load()
  }

  const remove = async (id: number) => {
    await db.conversations.delete(id)
    await db.audioFiles.where('conversationId').equals(id).delete()
    await load()
  }

  const search = async (query: string) => {
    const all = await db.conversations.toArray()
    const lower = query.toLowerCase()
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.messages.some((m) => m.text.toLowerCase().includes(lower))
    )
  }

  const exportData = async () => {
    const allConversations = await db.conversations.toArray()
    const allAudioFiles = await db.audioFiles.toArray()
    return JSON.stringify({ conversations: allConversations, audioFiles: allAudioFiles.map(f => ({ ...f, blob: undefined })) }, null, 2)
  }

  const importData = async (json: string) => {
    const data = JSON.parse(json)
    if (data.conversations) {
      for (const conv of data.conversations) {
        const { id: _id, ...rest } = conv
        await db.conversations.add(rest)
      }
    }
    await load()
  }

  const clearAll = async () => {
    await db.conversations.clear()
    await db.audioFiles.clear()
    await load()
  }

  return { conversations, loading, create, update, remove, search, exportData, importData, clearAll, reload: load }
}

export function useAudioFiles() {
  const [files, setFiles] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await db.audioFiles.orderBy('createdAt').reverse().toArray()
    setFiles(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (file: Omit<AudioFile, 'id'>) => {
    const id = await db.audioFiles.add(file as AudioFile)
    await load()
    return id
  }

  const remove = async (id: number) => {
    await db.audioFiles.delete(id)
    await load()
  }

  return { files, loading, save, remove, reload: load }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const all = await db.settings.toArray()
      if (all.length > 0) {
        const migrated = migrateSettings(all[0])
        setSettings(migrated)
        // Persist migration if values changed
        if (all[0].id != null && (migrated.language !== all[0].language || migrated.speaker !== all[0].speaker)) {
          await db.settings.update(all[0].id, { language: migrated.language, speaker: migrated.speaker })
        }
      } else {
        await db.settings.add(DEFAULT_SETTINGS)
      }
      setLoading(false)
    })()
  }, [])

  const updateSettings = async (changes: Partial<AppSettings>) => {
    const updated = { ...settings, ...changes }
    setSettings(updated)
    const all = await db.settings.toArray()
    if (all.length > 0 && all[0].id != null) {
      await db.settings.update(all[0].id, changes)
    }
  }

  return { settings, loading, updateSettings }
}
