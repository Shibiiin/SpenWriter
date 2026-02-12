import type { SarvamLanguage, SarvamSpeaker } from '@/types'

const API_BASE = 'https://api.sarvam.ai'

function getApiKey(): string {
  const key = import.meta.env.VITE_SARVAM_API_KEY
  if (!key) {
    throw new Error('VITE_SARVAM_API_KEY is not set. Add it to your .env file.')
  }
  return key
}

export interface TTSRequest {
  text: string
  language: SarvamLanguage
  speaker?: SarvamSpeaker
  pitch?: number
  pace?: number
  loudness?: number
}

export interface STTRequest {
  audio: Blob
  language: SarvamLanguage
}

export async function textToSpeech(request: TTSRequest): Promise<Blob> {
  const response = await fetch(`${API_BASE}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': getApiKey(),
    },
    body: JSON.stringify({
      inputs: [request.text],
      target_language_code: request.language,
      speaker: request.speaker ?? 'meera',
      pitch: request.pitch ?? 0,
      pace: request.pace ?? 1.0,
      loudness: request.loudness ?? 1.0,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: 'bulbul:v2',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`TTS failed (${response.status}): ${err}`)
  }

  const data = await response.json()
  const audioBase64 = data.audios?.[0]
  if (!audioBase64) {
    throw new Error('No audio returned from TTS API')
  }

  const byteChars = atob(audioBase64)
  const byteNumbers = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  return new Blob([byteNumbers], { type: 'audio/wav' })
}

export async function speechToText(request: STTRequest): Promise<string> {
  const formData = new FormData()
  formData.append('file', request.audio, 'recording.wav')
  formData.append('language_code', request.language)
  formData.append('model', 'saarika:v2')

  const response = await fetch(`${API_BASE}/speech-to-text`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`STT failed (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.transcript ?? ''
}
