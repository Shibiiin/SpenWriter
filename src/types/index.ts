export type AppLanguage =
  | 'hi'
  | 'bn'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'pa'
  | 'ta'
  | 'te'
  | 'en'
  | 'gu'
  | 'ur'
  | 'ja'

export type VoiceSpeaker = 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer'

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  hi: 'Hindi',
  bn: 'Bengali',
  kn: 'Kannada',
  ml: 'Malayalam',
  mr: 'Marathi',
  pa: 'Punjabi',
  ta: 'Tamil',
  te: 'Telugu',
  en: 'English',
  gu: 'Gujarati',
  ur: 'Urdu',
  ja: 'Japanese',
}

export const SPEAKER_LABELS: Record<VoiceSpeaker, string> = {
  alloy: 'Alloy (Neutral)',
  ash: 'Ash (Male)',
  coral: 'Coral (Female)',
  echo: 'Echo (Male)',
  fable: 'Fable (Male)',
  nova: 'Nova (Female)',
  onyx: 'Onyx (Male)',
  sage: 'Sage (Female)',
  shimmer: 'Shimmer (Female)',
}

export interface Conversation {
  id?: number
  title: string
  createdAt: Date
  updatedAt: Date
  language: AppLanguage
  messages: Message[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  audioUrl?: string
  timestamp: Date
  language: AppLanguage
}

export interface AudioFile {
  id?: number
  name: string
  blob: Blob
  mimeType: string
  size: number
  duration: number
  conversationId?: number
  createdAt: Date
}

export interface AppSettings {
  id?: number
  language: AppLanguage
  speaker: VoiceSpeaker
  theme: 'light' | 'dark' | 'system'
  autoPlayResponses: boolean
  saveAudioLocally: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'hi',
  speaker: 'nova',
  theme: 'system',
  autoPlayResponses: true,
  saveAudioLocally: true,
}
