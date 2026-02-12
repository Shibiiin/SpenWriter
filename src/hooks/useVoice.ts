import { useState, useRef, useCallback } from 'react'
import { textToSpeech, speechToText } from '@/services/sarvam'
import type { SarvamLanguage, SarvamSpeaker } from '@/types'

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(100)
      setIsRecording(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to access microphone'
      )
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false)
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType,
        })
        recorder.stream.getTracks().forEach((t) => t.stop())
        setIsRecording(false)
        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  const transcribe = useCallback(
    async (audio: Blob, language: SarvamLanguage) => {
      setIsProcessing(true)
      setError(null)
      try {
        const text = await speechToText({ audio, language })
        return text
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Transcription failed'
        setError(msg)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const speak = useCallback(
    async (text: string, language: SarvamLanguage, speaker: SarvamSpeaker) => {
      setIsSpeaking(true)
      setError(null)
      try {
        const audioBlob = await textToSpeech({ text, language, speaker })
        const url = URL.createObjectURL(audioBlob)
        const audio = new Audio(url)
        audioRef.current = audio

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          audio.onerror = () => reject(new Error('Audio playback failed'))
          audio.play()
        })

        return audioBlob
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
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsSpeaking(false)
    }
  }, [])

  return {
    isRecording,
    isSpeaking,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    transcribe,
    speak,
    stopSpeaking,
  }
}
