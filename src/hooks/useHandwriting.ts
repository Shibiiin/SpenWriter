import { useState, useRef, useCallback, useEffect } from 'react'

export interface StrokePoint {
  x: number
  y: number
  t: number
}

export interface Stroke {
  points: StrokePoint[]
}

export interface HandwritingState {
  isDrawing: boolean
  strokes: Stroke[]
  currentStroke: StrokePoint[]
  penSize: number
  canUndo: boolean
}

export function useHandwriting(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<StrokePoint[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [penSize, setPenSize] = useState(3)
  const [isEraser, setIsEraser] = useState(false)

  const strokeStartTime = useRef(0)
  const lastRenderTime = useRef(0)

  const getCanvasPoint = useCallback(
    (e: PointerEvent | React.PointerEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    [canvasRef]
  )

  const redrawCanvas = useCallback(
    (allStrokes: Stroke[], activePoints: StrokePoint[] = []) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw ruled lines for medical notes feel
      ctx.strokeStyle = '#e0e7ff'
      ctx.lineWidth = 0.5
      for (let y = 40; y < canvas.height; y += 32) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw all completed strokes
      for (const stroke of allStrokes) {
        drawStroke(ctx, stroke.points)
      }

      // Draw current active stroke
      if (activePoints.length > 0) {
        drawStroke(ctx, activePoints)
      }
    },
    [canvasRef]
  )

  const drawStroke = (ctx: CanvasRenderingContext2D, points: StrokePoint[]) => {
    if (points.length < 2) return

    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    // Use quadratic curves for smooth rendering
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2
      const midY = (points[i].y + points[i + 1].y) / 2
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
    }

    // Last point
    const last = points[points.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = getCanvasPoint(e)
      if (!point) return

      // Capture pointer for smooth tracking
      const canvas = canvasRef.current
      if (canvas) {
        canvas.setPointerCapture(e.pointerId)
      }

      if (isEraser) {
        // Eraser mode: remove strokes near touch point
        const threshold = penSize * 4
        setStrokes((prev) => {
          const filtered = prev.filter((stroke) =>
            !stroke.points.some(
              (p) => Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
            )
          )
          redrawCanvas(filtered)
          return filtered
        })
        return
      }

      strokeStartTime.current = Date.now()
      const strokePoint: StrokePoint = { x: point.x, y: point.y, t: 0 }
      setCurrentStroke([strokePoint])
      setIsDrawing(true)
    },
    [getCanvasPoint, isEraser, penSize, canvasRef, redrawCanvas]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing || isEraser) return

      const now = performance.now()
      // Throttle rendering to ~60fps
      if (now - lastRenderTime.current < 16) return
      lastRenderTime.current = now

      const point = getCanvasPoint(e)
      if (!point) return

      const t = Date.now() - strokeStartTime.current
      const strokePoint: StrokePoint = { x: point.x, y: point.y, t }

      setCurrentStroke((prev) => {
        const updated = [...prev, strokePoint]
        // Incremental draw for performance
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx && prev.length > 0) {
            const lastP = prev[prev.length - 1]
            ctx.strokeStyle = '#1a1a2e'
            ctx.lineWidth = penSize
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            ctx.moveTo(lastP.x, lastP.y)
            ctx.lineTo(strokePoint.x, strokePoint.y)
            ctx.stroke()
          }
        }
        return updated
      })
    },
    [isDrawing, isEraser, getCanvasPoint, canvasRef, penSize]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId)
      }

      if (!isDrawing) return
      setIsDrawing(false)

      setCurrentStroke((prev) => {
        if (prev.length > 1) {
          const newStroke: Stroke = { points: [...prev] }
          setStrokes((s) => {
            const updated = [...s, newStroke]
            redrawCanvas(updated)
            return updated
          })
        }
        return []
      })
    },
    [isDrawing, canvasRef, redrawCanvas]
  )

  const undo = useCallback(() => {
    setStrokes((prev) => {
      const updated = prev.slice(0, -1)
      redrawCanvas(updated)
      return updated
    })
  }, [redrawCanvas])

  const clear = useCallback(() => {
    setStrokes([])
    setCurrentStroke([])
    redrawCanvas([])
  }, [redrawCanvas])

  const toggleEraser = useCallback(() => {
    setIsEraser((prev) => !prev)
  }, [])

  const getCanvasDataURL = useCallback((): string | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }, [canvasRef])

  const getStrokesData = useCallback((): StrokePoint[] => {
    return strokes.flatMap((s) => s.points)
  }, [strokes])

  // Initialize canvas on mount
  useEffect(() => {
    redrawCanvas(strokes)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isDrawing,
    strokes,
    currentStroke,
    penSize,
    isEraser,
    canUndo: strokes.length > 0,
    hasContent: strokes.length > 0,
    setPenSize,
    toggleEraser,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    clear,
    getCanvasDataURL,
    getStrokesData,
    redrawCanvas,
  }
}
