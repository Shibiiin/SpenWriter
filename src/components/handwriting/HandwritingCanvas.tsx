import { useRef, useEffect } from 'react'
import { useHandwriting } from '@/hooks/useHandwriting'
import {
  Pen,
  Eraser,
  Undo2,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HandwritingCanvasProps {
  width?: number
  height?: number
  onStrokesChange?: (hasContent: boolean) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function HandwritingCanvas({
  width = 800,
  height = 400,
  onStrokesChange,
  canvasRef,
}: HandwritingCanvasProps) {
  const {
    penSize,
    isEraser,
    canUndo,
    hasContent,
    setPenSize,
    toggleEraser,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    clear,
    redrawCanvas,
    strokes,
  } = useHandwriting(canvasRef)

  const containerRef = useRef<HTMLDivElement>(null)

  // Notify parent of content changes
  useEffect(() => {
    onStrokesChange?.(hasContent)
  }, [hasContent, onStrokesChange])

  // Initialize canvas with proper dimensions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    redrawCanvas(strokes)
  }, [width, height, canvasRef, redrawCanvas, strokes])

  const PEN_SIZES = [
    { value: 2, label: 'Fine' },
    { value: 3, label: 'Medium' },
    { value: 5, label: 'Thick' },
    { value: 8, label: 'Bold' },
  ]

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Drawing tools */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={!isEraser ? 'default' : 'outline'}
            size="sm"
            onClick={() => isEraser && toggleEraser()}
            title="Pen tool"
          >
            <Pen className="w-4 h-4" />
            <span className="hidden sm:inline">Pen</span>
          </Button>
          <Button
            variant={isEraser ? 'default' : 'outline'}
            size="sm"
            onClick={() => !isEraser && toggleEraser()}
            title="Eraser tool"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Eraser</span>
          </Button>
        </div>

        {/* Pen size controls */}
        <div className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-muted-foreground" />
          {PEN_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => setPenSize(size.value)}
              className={cn(
                'rounded-full border-2 transition-all cursor-pointer',
                penSize === size.value
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30 bg-foreground hover:border-primary/50'
              )}
              style={{
                width: `${size.value * 3 + 6}px`,
                height: `${size.value * 3 + 6}px`,
              }}
              title={size.label}
            />
          ))}
          <Plus className="w-3 h-3 text-muted-foreground" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Undo last stroke"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            disabled={!hasContent}
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className={cn(
          'relative rounded-lg border-2 overflow-hidden transition-colors',
          isEraser ? 'border-destructive/30' : 'border-primary/30',
          'bg-white'
        )}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            'w-full touch-none',
            isEraser ? 'cursor-cell' : 'cursor-crosshair'
          )}
          style={{ aspectRatio: `${width} / ${height}` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Empty state overlay */}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/40 text-lg font-medium select-none">
              Write here using mouse, stylus, or touch...
            </p>
          </div>
        )}

        {/* Tool indicator */}
        <div
          className={cn(
            'absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium',
            isEraser
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary'
          )}
        >
          {isEraser ? 'Eraser' : 'Pen'}
        </div>
      </div>
    </div>
  )
}
