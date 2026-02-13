import { useState, useRef, useEffect } from 'react'
import { Mic, Volume2, VolumeX, Send, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AudioOrb } from './AudioOrb'
import { HandwritingPad } from '@/components/handwriting/HandwritingPad'
import { useVoice } from '@/hooks/useVoice'
import type { Message, AppLanguage, VoiceSpeaker, Conversation } from '@/types'
import { generateId, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface VoiceChatProps {
  language: AppLanguage
  speaker: VoiceSpeaker
  autoPlay: boolean
  conversation: Conversation | null
  onUpdateConversation: (messages: Message[]) => void
}

export function VoiceChat({
  language,
  speaker,
  autoPlay,
  conversation,
  onUpdateConversation,
}: VoiceChatProps) {
  const { isRecording, isSpeaking, isProcessing, error, interimText, startRecording, stopRecording, speak, stopSpeaking } = useVoice()
  const [textInput, setTextInput] = useState('')
  const [handwritingOpen, setHandwritingOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messages = conversation?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleToggleRecording = async () => {
    if (isRecording) {
      const text = await stopRecording()
      if (!text) return

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        text,
        timestamp: new Date(),
        language,
      }
      const updatedMessages = [...messages, userMsg]
      onUpdateConversation(updatedMessages)
    } else {
      await startRecording(language)
    }
  }

  const handleSendText = async () => {
    if (!textInput.trim()) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: textInput.trim(),
      timestamp: new Date(),
      language,
    }
    const updatedMessages = [...messages, userMsg]
    onUpdateConversation(updatedMessages)
    setTextInput('')

    if (autoPlay) {
      await speak(textInput.trim(), language, speaker)
    }
  }

  const handlePlayMessage = async (msg: Message) => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      await speak(msg.text, language, speaker)
    }
  }

  const handleHandwritingText = (text: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: new Date(),
      language,
    }
    const updatedMessages = [...messages, userMsg]
    onUpdateConversation(updatedMessages)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Messages area */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-[400px] md:h-[500px]">
          <CardContent className="p-4 space-y-4">
            {messages.length === 0 && !interimText && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Mic className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm">Tap the orb to record, type a message, or use handwriting</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-[85%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-60">
                      {formatDate(new Date(msg.timestamp))}
                    </span>
                    <button
                      onClick={() => handlePlayMessage(msg)}
                      className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label={isSpeaking ? 'Stop speaking' : 'Play message'}
                    >
                      {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Live transcription preview */}
            {interimText && (
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <div className="rounded-2xl px-4 py-2.5 text-sm bg-primary/60 text-primary-foreground italic">
                  <p>{interimText}</p>
                  <span className="text-xs opacity-60">Listening...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Voice input area */}
      <div className="flex flex-col items-center gap-4">
        <AudioOrb
          isActive={isRecording}
          isProcessing={isProcessing}
          size="lg"
          onClick={handleToggleRecording}
        />
        <p className="text-sm text-muted-foreground">
          {isRecording
            ? 'Listening... Tap to stop'
            : isProcessing
              ? 'Processing...'
              : isSpeaking
                ? 'Speaking...'
                : 'Tap to record'}
        </p>

        {/* Text input + Add (handwriting) button */}
        <div className="flex w-full max-w-md gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Or type a message..."
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="icon" onClick={handleSendText} disabled={!textInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHandwritingOpen(true)}
            title="Add via handwriting"
          >
            <PenLine className="w-4 h-4" />
          </Button>
        </div>

        {/* Add button with label */}
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => setHandwritingOpen(true)}
        >
          <PenLine className="w-4 h-4" />
          Add — Handwriting Input
        </Button>
      </div>

      {/* Handwriting pad dialog */}
      <HandwritingPad
        open={handwritingOpen}
        onOpenChange={setHandwritingOpen}
        onTextRecognized={handleHandwritingText}
        language={language}
      />
    </div>
  )
}
