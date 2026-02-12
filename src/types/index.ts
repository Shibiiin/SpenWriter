export type SarvamLanguage =
  | 'hi-IN'
  | 'bn-IN'
  | 'kn-IN'
  | 'ml-IN'
  | 'mr-IN'
  | 'od-IN'
  | 'pa-IN'
  | 'raj-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'en-IN'
  | 'gu-IN'

export type SarvamSpeaker = 'meera' | 'anushka' | 'arvind' | 'madhur'

export const LANGUAGE_LABELS: Record<SarvamLanguage, string> = {
  'hi-IN': 'Hindi',
  'bn-IN': 'Bengali',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'mr-IN': 'Marathi',
  'od-IN': 'Odia',
  'pa-IN': 'Punjabi',
  'raj-IN': 'Rajasthani',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'en-IN': 'English (India)',
  'gu-IN': 'Gujarati',
}

export const SPEAKER_LABELS: Record<SarvamSpeaker, string> = {
  meera: 'Meera (Female)',
  anushka: 'Anushka (Female)',
  arvind: 'Arvind (Male)',
  madhur: 'Madhur (Male)',
}

export interface Conversation {
  id?: number
  title: string
  createdAt: Date
  updatedAt: Date
  language: SarvamLanguage
  messages: Message[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  audioUrl?: string
  timestamp: Date
  language: SarvamLanguage
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
  language: SarvamLanguage
  speaker: SarvamSpeaker
  theme: 'light' | 'dark' | 'system'
  autoPlayResponses: boolean
  saveAudioLocally: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'hi-IN',
  speaker: 'meera',
  theme: 'system',
  autoPlayResponses: true,
  saveAudioLocally: true,
}
