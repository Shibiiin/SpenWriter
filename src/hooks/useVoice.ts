import { useState, useRef, useCallback } from 'react'
import { textToSpeech, createSpeechRecognition } from '@/services/openai'
import type { AppLanguage, VoiceSpeaker } from '@/types'

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interimText, setInterimText] = useState('')

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef('')

  const startRecording = useCallback(async (language: AppLanguage) => {
    setError(null)
    setInterimText('')
    transcriptRef.current = ''

    const recognition = createSpeechRecognition(language)
    if (!recognition) {
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }

    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      if (final) {
        transcriptRef.current += final
      }
      setInterimText(transcriptRef.current + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(`Recognition error: ${event.error}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current
      if (!recognition) {
        setIsRecording(false)
        resolve(null)
        return
      }

      const originalOnEnd = recognition.onend
      recognition.onend = (event) => {
        if (originalOnEnd && typeof originalOnEnd === 'function') {
          originalOnEnd.call(recognition, event)
        }
        const text = transcriptRef.current.trim()
        setInterimText('')
        resolve(text || null)
      }

      recognition.stop()
    })
  }, [])

  const speak = useCallback(
    async (text: string, language: AppLanguage, speaker: VoiceSpeaker) => {
      setIsSpeaking(true)
      setError(null)
      try {
        await textToSpeech({ text, language, speaker })
        return new Blob(['speech-complete'], { type: 'text/plain' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Speech failed'
        setError(msg)
        return null
      } finally {
        setIsSpeaking(false)
      }
    },
    []
  )

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  return {
    isRecording,
    isSpeaking,
    isProcessing,
    error,
    interimText,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  }
}
