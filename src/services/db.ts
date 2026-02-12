import Dexie, { type EntityTable } from 'dexie'
import type { Conversation, AudioFile, AppSettings } from '@/types'

const db = new Dexie('SpenWriterDB') as Dexie & {
  conversations: EntityTable<Conversation, 'id'>
  audioFiles: EntityTable<AudioFile, 'id'>
  settings: EntityTable<AppSettings, 'id'>
}

db.version(1).stores({
  conversations: '++id, title, createdAt, updatedAt, language',
  audioFiles: '++id, name, conversationId, createdAt',
  settings: '++id',
})

export { db }
