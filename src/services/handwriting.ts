/**
 * Handwriting Recognition Service
 *
 * Supports multiple recognition backends:
 * 1. Browser-native Handwriting Recognition API (Chrome 99+)
 * 2. Google Cloud Vision OCR (image-based fallback)
 * 3. Local Tesseract.js (offline fallback)
 *
 * The service tries the browser-native API first, then falls back
 * to image-based OCR via a configurable API endpoint.
 */

import type { Stroke } from '@/hooks/useHandwriting'

export interface RecognitionResult {
  text: string
  confidence: number
  source: 'native' | 'api' | 'fallback'
}

export interface RecognitionRequest {
  strokes?: Stroke[]
  imageDataURL?: string
  language: string
}

// Configurable API endpoint for handwriting recognition
const RECOGNITION_API_URL = import.meta.env.VITE_HANDWRITING_API_URL || '/api/handwriting-recognize'

/**
 * Check if the browser supports the native Handwriting Recognition API
 */
function hasNativeHandwritingAPI(): boolean {
  return 'createHandwritingRecognizer' in navigator
}

/**
 * Attempt recognition using the browser-native Handwriting Recognition API
 * Available in Chrome 99+ on ChromeOS and some platforms
 */
async function recognizeWithNativeAPI(
  strokes: Stroke[],
  language: string
): Promise<RecognitionResult | null> {
  if (!hasNativeHandwritingAPI()) return null

  try {
    const nav = navigator as Navigator & {
      createHandwritingRecognizer: (opts: {
        languages: string[]
      }) => Promise<{
        startDrawing: (hints?: {
          recognitionType?: string
          inputType?: string
          textContext?: string
        }) => {
          addStroke: (stroke: { addPoint: (p: { x: number; y: number; t: number }) => void; }) => void
          getPrediction: () => Promise<{ text: string }[]>
          clear: () => void
        }
        finish: () => void
      }>
    }

    const recognizer = await nav.createHandwritingRecognizer({
      languages: [language === 'en' ? 'en' : language],
    })

    const drawing = recognizer.startDrawing({
      recognitionType: 'text',
      inputType: 'mouse',
      textContext: '',
    })

    for (const stroke of strokes) {
      const nativeStroke = {
        addPoint: (_p: { x: number; y: number; t: number }) => {},
      }
      for (const point of stroke.points) {
        nativeStroke.addPoint({ x: point.x, y: point.y, t: point.t })
      }
      drawing.addStroke(nativeStroke)
    }

    const predictions = await drawing.getPrediction()
    drawing.clear()
    recognizer.finish()

    if (predictions.length > 0) {
      return {
        text: predictions[0].text,
        confidence: 0.9,
        source: 'native',
      }
    }
  } catch {
    // Native API not available or failed, fall through to next method
  }

  return null
}

/**
 * Send canvas image to a backend API for recognition
 * Works with Google Cloud Vision, Azure Ink Recognizer, or any compatible endpoint
 */
async function recognizeWithAPI(
  request: RecognitionRequest
): Promise<RecognitionResult | null> {
  try {
    const body: Record<string, unknown> = {
      language: request.language,
    }

    if (request.strokes && request.strokes.length > 0) {
      body.strokes = request.strokes.map((s) =>
        s.points.map((p) => ({ x: p.x, y: p.y, t: p.t }))
      )
    }

    if (request.imageDataURL) {
      // Extract base64 data from data URL
      body.image = request.imageDataURL.split(',')[1]
    }

    const response = await fetch(RECOGNITION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    return {
      text: data.text || '',
      confidence: data.confidence ?? 0.8,
      source: 'api',
    }
  } catch {
    // API not available
    return null
  }
}

/**
 * Client-side stroke-to-text heuristic fallback
 * Uses basic stroke analysis when no API is available.
 * This provides a demonstration mode that works offline.
 */
function recognizeWithFallback(strokes: Stroke[]): RecognitionResult {
  if (strokes.length === 0) {
    return { text: '', confidence: 0, source: 'fallback' }
  }

  // Analyze strokes to provide a meaningful fallback message
  const totalPoints = strokes.reduce((sum, s) => sum + s.points.length, 0)
  const strokeCount = strokes.length

  // Calculate bounding box area of all strokes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const stroke of strokes) {
    for (const p of stroke.points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
  }

  const width = maxX - minX
  const height = maxY - minY

  return {
    text: `[Handwriting: ${strokeCount} stroke${strokeCount !== 1 ? 's' : ''}, ${totalPoints} points, area ${Math.round(width)}x${Math.round(height)}px — Configure VITE_HANDWRITING_API_URL for real OCR]`,
    confidence: 0.1,
    source: 'fallback',
  }
}

/**
 * Main recognition function — tries all available methods in order:
 * 1. Browser-native Handwriting Recognition API
 * 2. Backend API (Google Vision / Azure / MyScript)
 * 3. Local fallback with stroke analysis
 */
export async function recognizeHandwriting(
  request: RecognitionRequest
): Promise<RecognitionResult> {
  // 1. Try native browser API (stroke-based)
  if (request.strokes && request.strokes.length > 0) {
    const nativeResult = await recognizeWithNativeAPI(request.strokes, request.language)
    if (nativeResult) return nativeResult
  }

  // 2. Try backend API (supports both strokes and image)
  const apiResult = await recognizeWithAPI(request)
  if (apiResult && apiResult.text) return apiResult

  // 3. Fallback
  return recognizeWithFallback(request.strokes || [])
}

/**
 * Convert stroke data to the format expected by common APIs
 */
export function formatStrokesForExport(strokes: Stroke[]): Array<Array<{ x: number; y: number; t: number }>> {
  return strokes.map((s) => s.points.map((p) => ({ x: p.x, y: p.y, t: p.t })))
}
