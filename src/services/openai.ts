import type { AppLanguage, VoiceSpeaker } from '@/types'
import { LANGUAGE_LABELS } from '@/types'

// Language code mapping for Web Speech API (BCP 47 tags)
const SPEECH_LANG_MAP: Record<AppLanguage, string> = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  en: 'en-IN',
  gu: 'gu-IN',
  ur: 'ur-IN',
  ja: 'ja-JP',
}

export interface TTSRequest {
  text: string
  language: AppLanguage
  speaker?: VoiceSpeaker
}

export interface STTRequest {
  audio: Blob
  language: AppLanguage
}

// Voice preference mapping for speechSynthesis
const VOICE_GENDER_MAP: Record<VoiceSpeaker, 'female' | 'male' | 'neutral'> = {
  alloy: 'neutral',
  ash: 'male',
  coral: 'female',
  echo: 'male',
  fable: 'male',
  nova: 'female',
  onyx: 'male',
  sage: 'female',
  shimmer: 'female',
}

function findBestVoice(language: AppLanguage, speaker: VoiceSpeaker): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  const langCode = SPEECH_LANG_MAP[language]
  const gender = VOICE_GENDER_MAP[speaker]

  // Try exact language match
  const langVoices = voices.filter((v) => v.lang.startsWith(langCode.split('-')[0]))

  if (langVoices.length === 0) {
    // Fallback to any available voice
    return voices[0] ?? null
  }

  // Try to match gender preference by name heuristics
  if (gender === 'female') {
    const female = langVoices.find((v) =>
      /female|woman|zira|hazel|susan|heera|swara/i.test(v.name)
    )
    if (female) return female
  } else if (gender === 'male') {
    const male = langVoices.find((v) =>
      /male|man|david|mark|ravi|hemant/i.test(v.name)
    )
    if (male) return male
  }

  return langVoices[0]
}

export async function textToSpeech(request: TTSRequest): Promise<Blob> {
  if (!('speechSynthesis' in window)) {
    throw new Error('Text-to-speech is not supported in this browser')
  }

  // Wait for voices to load
  if (speechSynthesis.getVoices().length === 0) {
    await new Promise<void>((resolve) => {
      speechSynthesis.onvoiceschanged = () => resolve()
      setTimeout(resolve, 1000) // fallback timeout
    })
  }

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(request.text)
    utterance.lang = SPEECH_LANG_MAP[request.language]

    const voice = findBestVoice(request.language, request.speaker ?? 'nova')
    if (voice) utterance.voice = voice

    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Web Speech API doesn't return audio blobs directly,
    // so we create a minimal marker blob and play via the utterance
    utterance.onend = () => {
      // Return a small marker blob (actual audio played via browser)
      resolve(new Blob(['speech-complete'], { type: 'text/plain' }))
    }
    utterance.onerror = (e) => {
      reject(new Error(`TTS failed: ${e.error}`))
    }

    speechSynthesis.cancel() // cancel any ongoing speech
    speechSynthesis.speak(utterance)
  })
}

export async function speechToText(request: STTRequest): Promise<string> {
  // Use Web Speech API SpeechRecognition (already running via MediaRecorder fallback)
  // Since we record via MediaRecorder but Web Speech API needs live mic access,
  // we use a live recognition approach instead
  throw new Error(
    `Speech-to-text via file is not supported by the Web Speech API. ` +
    `Language: ${LANGUAGE_LABELS[request.language]}. ` +
    `Use the live transcription mode instead.`
  )
}

// Live speech recognition using Web Speech API
export function createSpeechRecognition(language: AppLanguage): SpeechRecognition | null {
  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognitionAPI) return null

  const recognition = new SpeechRecognitionAPI()
  recognition.lang = SPEECH_LANG_MAP[language]
  recognition.interimResults = true
  recognition.continuous = false
  recognition.maxAlternatives = 1

  return recognition
}
