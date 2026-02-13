import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../models/app_types.dart';

/// Canvas-based handwriting input widget.
/// Captures pointer events (mouse, stylus, touch) and renders strokes
/// with quadratic curve smoothing.
class HandwritingCanvas extends StatefulWidget {
  final ValueChanged<bool>? onContentChanged;
  final List<Stroke> strokes;
  final ValueChanged<List<Stroke>> onStrokesChanged;

  const HandwritingCanvas({
    super.key,
    this.onContentChanged,
    required this.strokes,
    required this.onStrokesChanged,
  });

  @override
  State<HandwritingCanvas> createState() => HandwritingCanvasState();
}

class HandwritingCanvasState extends State<HandwritingCanvas> {
  Stroke? _currentStroke;
  double _penSize = 3.0;
  bool _isEraser = false;
  int _strokeStartTime = 0;

  bool get hasContent => widget.strokes.isNotEmpty;
  bool get canUndo => widget.strokes.isNotEmpty;
  double get penSize => _penSize;
  bool get isEraser => _isEraser;

  static const _penSizes = [2.0, 3.0, 5.0, 8.0];
  static const _penLabels = ['Fine', 'Medium', 'Thick', 'Bold'];

  void setPenSize(double size) => setState(() => _penSize = size);
  void toggleEraser() => setState(() => _isEraser = !_isEraser);

  void undo() {
    if (widget.strokes.isNotEmpty) {
      final updated = List<Stroke>.from(widget.strokes)..removeLast();
      widget.onStrokesChanged(updated);
      widget.onContentChanged?.call(updated.isNotEmpty);
    }
  }

  void clear() {
    widget.onStrokesChanged([]);
    widget.onContentChanged?.call(false);
  }

  /// Export the canvas as a PNG image.
  Future<ui.Image?> toImage(double width, double height) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, width, height));

    // Draw white background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, width, height),
      Paint()..color = Colors.white,
    );

    // Draw strokes
    final painter = _StrokePainter(
      strokes: widget.strokes,
      currentStroke: null,
      penSize: _penSize,
    );
    painter.paint(canvas, Size(width, height));

    final picture = recorder.endRecording();
    return picture.toImage(width.round(), height.round());
  }

  void _onPointerDown(PointerDownEvent event) {
    final local = event.localPosition;

    if (_isEraser) {
      // Remove strokes near the touch point
      final threshold = _penSize * 4;
      final updated = widget.strokes.where((stroke) {
        return !stroke.points.any((p) =>
            (p.x - local.dx).abs() < threshold &&
            (p.y - local.dy).abs() < threshold);
      }).toList();
      widget.onStrokesChanged(updated);
      widget.onContentChanged?.call(updated.isNotEmpty);
      return;
    }

    _strokeStartTime = DateTime.now().millisecondsSinceEpoch;
    _currentStroke = Stroke();
    _currentStroke!.addPoint(StrokePoint(x: local.dx, y: local.dy, t: 0));
    setState(() {});
  }

  void _onPointerMove(PointerMoveEvent event) {
    if (_currentStroke == null || _isEraser) return;

    final local = event.localPosition;
    final t = DateTime.now().millisecondsSinceEpoch - _strokeStartTime;
    _currentStroke!.addPoint(StrokePoint(x: local.dx, y: local.dy, t: t));
    setState(() {});
  }

  void _onPointerUp(PointerUpEvent event) {
    if (_currentStroke == null) return;

    if (_currentStroke!.points.length > 1) {
      final updated = List<Stroke>.from(widget.strokes)..add(_currentStroke!);
      widget.onStrokesChanged(updated);
      widget.onContentChanged?.call(true);
    }
    _currentStroke = null;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Toolbar ──────────────────────────────────────────────────────
        _buildToolbar(context, colorScheme),
        const SizedBox(height: 8),

        // ── Canvas ───────────────────────────────────────────────────────
        Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: _isEraser
                  ? colorScheme.error.withValues(alpha: 0.3)
                  : colorScheme.primary.withValues(alpha: 0.3),
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
            color: Colors.white,
          ),
          clipBehavior: Clip.antiAlias,
          child: AspectRatio(
            aspectRatio: 2 / 1,
            child: Listener(
              onPointerDown: _onPointerDown,
              onPointerMove: _onPointerMove,
              onPointerUp: _onPointerUp,
              child: MouseRegion(
                cursor: _isEraser
                    ? SystemMouseCursors.precise
                    : SystemMouseCursors.click,
                child: Stack(
                  children: [
                    // Canvas
                    CustomPaint(
                      painter: _StrokePainter(
                        strokes: widget.strokes,
                        currentStroke: _currentStroke,
                        penSize: _penSize,
                      ),
                      size: Size.infinite,
                    ),

                    // Empty state overlay
                    if (!hasContent && _currentStroke == null)
                      const Center(
                        child: Text(
                          'Write here using mouse, stylus, or touch...',
                          style: TextStyle(
                            color: Color(0x559E9E9E),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                    // Tool indicator
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: _isEraser
                              ? colorScheme.error.withValues(alpha: 0.1)
                              : colorScheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _isEraser ? 'Eraser' : 'Pen',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: _isEraser
                                ? colorScheme.error
                                : colorScheme.primary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildToolbar(BuildContext context, ColorScheme colorScheme) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.spaceBetween,
      children: [
        // Drawing tools
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ToolButton(
              icon: Icons.edit,
              label: 'Pen',
              isActive: !_isEraser,
              onTap: () {
                if (_isEraser) toggleEraser();
              },
            ),
            const SizedBox(width: 4),
            _ToolButton(
              icon: Icons.auto_fix_high,
              label: 'Eraser',
              isActive: _isEraser,
              onTap: () {
                if (!_isEraser) toggleEraser();
              },
            ),
          ],
        ),

        // Pen size selector
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.remove, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            for (int i = 0; i < _penSizes.length; i++) ...[
              GestureDetector(
                onTap: () => setPenSize(_penSizes[i]),
                child: Container(
                  width: _penSizes[i] * 3 + 6,
                  height: _penSizes[i] * 3 + 6,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _penSize == _penSizes[i]
                          ? colorScheme.primary
                          : Colors.grey.shade400,
                      width: 2,
                    ),
                    color: _penSize == _penSizes[i]
                        ? colorScheme.primary
                        : Colors.grey.shade800,
                  ),
                ),
              ),
              if (i < _penSizes.length - 1) const SizedBox(width: 6),
            ],
            const SizedBox(width: 4),
            const Icon(Icons.add, size: 14, color: Colors.grey),
          ],
        ),

        // Actions
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ToolButton(
              icon: Icons.undo,
              label: 'Undo',
              isActive: false,
              enabled: canUndo,
              onTap: undo,
            ),
            const SizedBox(width: 4),
            _ToolButton(
              icon: Icons.delete_outline,
              label: 'Clear',
              isActive: false,
              enabled: hasContent,
              onTap: clear,
            ),
          ],
        ),
      ],
    );
  }
}

// ── Tool button ────────────────────────────────────────────────────────────

class _ToolButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final bool enabled;
  final VoidCallback onTap;

  const _ToolButton({
    required this.icon,
    required this.label,
    required this.isActive,
    this.enabled = true,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Material(
      color: isActive ? colorScheme.primary : Colors.transparent,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        borderRadius: BorderRadius.circular(6),
        onTap: enabled ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: isActive
                    ? colorScheme.onPrimary
                    : enabled
                        ? null
                        : Colors.grey,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isActive
                      ? colorScheme.onPrimary
                      : enabled
                          ? null
                          : Colors.grey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Stroke painter ─────────────────────────────────────────────────────────

class _StrokePainter extends CustomPainter {
  final List<Stroke> strokes;
  final Stroke? currentStroke;
  final double penSize;

  _StrokePainter({
    required this.strokes,
    this.currentStroke,
    required this.penSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw white background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = Colors.white,
    );

    // Draw ruled lines
    final linePaint = Paint()
      ..color = const Color(0xFFE0E7FF)
      ..strokeWidth = 0.5;
    for (double y = 40; y < size.height; y += 32) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), linePaint);
    }

    // Draw strokes
    final strokePaint = Paint()
      ..color = const Color(0xFF1A1A2E)
      ..strokeWidth = penSize
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    for (final stroke in strokes) {
      _drawStroke(canvas, stroke.points, strokePaint);
    }

    // Draw current stroke
    if (currentStroke != null && currentStroke!.points.isNotEmpty) {
      _drawStroke(canvas, currentStroke!.points, strokePaint);
    }
  }

  void _drawStroke(
      Canvas canvas, List<StrokePoint> points, Paint paint) {
    if (points.length < 2) return;

    final path = Path();
    path.moveTo(points[0].x, points[0].y);

    // Quadratic curves for smooth rendering
    for (int i = 1; i < points.length - 1; i++) {
      final midX = (points[i].x + points[i + 1].x) / 2;
      final midY = (points[i].y + points[i + 1].y) / 2;
      path.quadraticBezierTo(points[i].x, points[i].y, midX, midY);
    }

    path.lineTo(points.last.x, points.last.y);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _StrokePainter oldDelegate) => true;
}
