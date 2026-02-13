import { useState, useRef, useCallback } from 'react'
import {
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
  PenLine,
  Check,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HandwritingCanvas } from './HandwritingCanvas'
import { recognizeHandwriting } from '@/services/handwriting'
import type { RecognitionResult } from '@/services/handwriting'
import { useHandwriting } from '@/hooks/useHandwriting'
import { cn } from '@/lib/utils'

interface HandwritingPadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTextRecognized: (text: string) => void
  language?: string
}

type PadState = 'drawing' | 'recognizing' | 'preview' | 'error'

export function HandwritingPad({
  open,
  onOpenChange,
  onTextRecognized,
  language = 'en',
}: HandwritingPadProps) {
  const [padState, setPadState] = useState<PadState>('drawing')
  const [recognizedText, setRecognizedText] = useState('')
  const [editableText, setEditableText] = useState('')
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasContent, setHasContent] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { strokes, getCanvasDataURL } = useHandwriting(canvasRef)

  const handleStrokesChange = useCallback((content: boolean) => {
    setHasContent(content)
  }, [])

  const handleRecognize = async () => {
    if (!hasContent) {
      setErrorMessage('Please write something on the canvas first.')
      setPadState('error')
      return
    }

    setPadState('recognizing')
    setErrorMessage('')

    try {
      // Get canvas image data URL
      const imageDataURL = getCanvasDataURL()

      // Collect strokes from the canvas ref by extracting from the hook indirectly
      // We pass both image and stroke data to the recognition service
      const result = await recognizeHandwriting({
        imageDataURL: imageDataURL || undefined,
        strokes: strokes.length > 0 ? strokes : undefined,
        language,
      })

      if (!result.text) {
        setErrorMessage('Could not recognize any text. Please try writing more clearly.')
        setPadState('error')
        return
      }

      setRecognizedText(result.text)
      setEditableText(result.text)
      setRecognitionResult(result)
      setPadState('preview')
    } catch {
      setErrorMessage('Recognition failed. Please try again.')
      setPadState('error')
    }
  }

  const handleSave = () => {
    const text = editableText.trim()
    if (text) {
      onTextRecognized(text)
      handleClose()
    }
  }

  const handleRetry = () => {
    setErrorMessage('')
    setRecognizedText('')
    setEditableText('')
    setRecognitionResult(null)
    setPadState('drawing')
  }

  const handleClose = () => {
    // Reset state
    setPadState('drawing')
    setRecognizedText('')
    setEditableText('')
    setRecognitionResult(null)
    setErrorMessage('')
    setHasContent(false)
    onOpenChange(false)
  }

  const handleBackToDrawing = () => {
    setPadState('drawing')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-primary" />
            Handwriting Input Pad
          </DialogTitle>
          <DialogDescription>
            Write using your mouse, stylus, or touch. Your handwriting will be
            converted to text.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Drawing state */}
          {padState === 'drawing' && (
            <>
              <HandwritingCanvas
                canvasRef={canvasRef}
                onStrokesChange={handleStrokesChange}
              />

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {hasContent
                    ? 'Click "Recognize Text" when ready'
                    : 'Start writing on the canvas above'}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecognize}
                    disabled={!hasContent}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Recognize Text
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Recognizing state */}
          {padState === 'recognizing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-lg font-medium">Recognizing handwriting...</p>
              <p className="text-sm text-muted-foreground">
                Converting your strokes to text
              </p>
            </div>
          )}

          {/* Preview state — editable text */}
          {padState === 'preview' && (
            <>
              {/* Confidence indicator */}
              {recognitionResult && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                    recognitionResult.confidence >= 0.7
                      ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : recognitionResult.confidence >= 0.4
                        ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  )}
                >
                  {recognitionResult.confidence >= 0.7 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>
                    {recognitionResult.confidence >= 0.7
                      ? 'High confidence recognition'
                      : recognitionResult.confidence >= 0.4
                        ? 'Medium confidence — please review'
                        : 'Low confidence — review and edit before saving'}
                  </span>
                  <span className="ml-auto text-xs opacity-60">
                    via {recognitionResult.source}
                  </span>
                </div>
              )}

              {/* Original recognized text */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  Recognized Text (editable):
                </label>
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  placeholder="Recognized text will appear here..."
                />
              </div>

              {/* Show original for comparison if edited */}
              {editableText !== recognizedText && (
                <p className="text-xs text-muted-foreground">
                  Original: {recognizedText}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleBackToDrawing}>
                  <PenLine className="w-4 h-4 mr-1" />
                  Back to Drawing
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!editableText.trim()}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Insert Text
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Error state */}
          {padState === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle className="w-10 h-10 text-destructive" />
              <p className="text-lg font-medium text-destructive">
                Recognition Failed
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {errorMessage}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
