import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/app_types.dart';
import '../providers/app_provider.dart';
import '../services/handwriting_service.dart';
import 'handwriting_canvas.dart';

/// Full-screen dialog for handwriting input with recognition workflow.
/// Flow: drawing → recognizing → preview (editable) → insert text
class HandwritingPad extends StatefulWidget {
  final String language;
  final ValueChanged<String> onTextRecognized;

  const HandwritingPad({
    super.key,
    this.language = 'en',
    required this.onTextRecognized,
  });

  @override
  State<HandwritingPad> createState() => _HandwritingPadState();
}

enum _PadState { drawing, recognizing, preview, error }

class _HandwritingPadState extends State<HandwritingPad> {
  _PadState _state = _PadState.drawing;
  List<Stroke> _strokes = [];
  bool _hasContent = false;
  String _recognizedText = '';
  String _editableText = '';
  RecognitionResult? _result;
  String _errorMessage = '';

  final _canvasKey = GlobalKey<HandwritingCanvasState>();
  final _textController = TextEditingController();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onStrokesChanged(List<Stroke> strokes) {
    setState(() => _strokes = strokes);
  }

  void _onContentChanged(bool has) {
    setState(() => _hasContent = has);
  }

  Future<void> _recognize() async {
    if (!_hasContent) {
      setState(() {
        _errorMessage = 'Please write something on the canvas first.';
        _state = _PadState.error;
      });
      return;
    }

    setState(() => _state = _PadState.recognizing);

    try {
      final provider = context.read<AppProvider>();
      final result = await provider.handwritingService.recognize(
        strokes: _strokes,
        language: widget.language,
      );

      if (result.text.isEmpty) {
        setState(() {
          _errorMessage =
              'Could not recognize any text. Please try writing more clearly.';
          _state = _PadState.error;
        });
        return;
      }

      setState(() {
        _recognizedText = result.text;
        _editableText = result.text;
        _textController.text = result.text;
        _result = result;
        _state = _PadState.preview;
      });
    } catch (_) {
      setState(() {
        _errorMessage = 'Recognition failed. Please try again.';
        _state = _PadState.error;
      });
    }
  }

  void _save() {
    final text = _editableText.trim();
    if (text.isNotEmpty) {
      widget.onTextRecognized(text);
      Navigator.of(context).pop();
    }
  }

  void _retry() {
    setState(() {
      _state = _PadState.drawing;
      _errorMessage = '';
      _recognizedText = '';
      _editableText = '';
      _result = null;
    });
  }

  void _backToDrawing() {
    setState(() => _state = _PadState.drawing);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 900, maxHeight: 700),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  Icon(Icons.edit_note, color: colorScheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Handwriting Input Pad',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Write using your mouse, stylus, or touch. '
                          'Your handwriting will be converted to text.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey,
                              ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Body
              Flexible(child: _buildBody(context, colorScheme)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, ColorScheme colorScheme) {
    switch (_state) {
      case _PadState.drawing:
        return _buildDrawingState(context);
      case _PadState.recognizing:
        return _buildRecognizingState(context);
      case _PadState.preview:
        return _buildPreviewState(context, colorScheme);
      case _PadState.error:
        return _buildErrorState(context);
    }
  }

  // ── Drawing state ──────────────────────────────────────────────────────

  Widget _buildDrawingState(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Flexible(
          child: HandwritingCanvas(
            key: _canvasKey,
            strokes: _strokes,
            onStrokesChanged: _onStrokesChanged,
            onContentChanged: _onContentChanged,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              _hasContent
                  ? 'Click "Recognize Text" when ready'
                  : 'Start writing on the canvas above',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _hasContent ? _recognize : null,
                  icon: const Icon(Icons.save, size: 16),
                  label: const Text('Recognize Text'),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  // ── Recognizing state ──────────────────────────────────────────────────

  Widget _buildRecognizingState(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(),
          ),
          SizedBox(height: 16),
          Text(
            'Recognizing handwriting...',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          SizedBox(height: 4),
          Text(
            'Converting your strokes to text',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ],
      ),
    );
  }

  // ── Preview state ──────────────────────────────────────────────────────

  Widget _buildPreviewState(BuildContext context, ColorScheme colorScheme) {
    final confidence = _result?.confidence ?? 0;
    final Color badgeColor;
    final IconData badgeIcon;
    final String badgeText;

    if (confidence >= 0.7) {
      badgeColor = Colors.green;
      badgeIcon = Icons.check_circle;
      badgeText = 'High confidence recognition';
    } else if (confidence >= 0.4) {
      badgeColor = Colors.orange;
      badgeIcon = Icons.warning_amber;
      badgeText = 'Medium confidence — please review';
    } else {
      badgeColor = Colors.red;
      badgeIcon = Icons.warning;
      badgeText = 'Low confidence — review and edit before saving';
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Confidence badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: badgeColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(badgeIcon, color: badgeColor, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  badgeText,
                  style: TextStyle(color: badgeColor, fontSize: 13),
                ),
              ),
              Text(
                'via ${_result?.source ?? 'unknown'}',
                style: TextStyle(
                  color: badgeColor.withValues(alpha: 0.6),
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Editable text field
        Text(
          'Recognized Text (editable):',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _textController,
          maxLines: 5,
          minLines: 3,
          onChanged: (val) => _editableText = val,
          decoration: const InputDecoration(
            hintText: 'Recognized text will appear here...',
          ),
        ),

        // Original text comparison
        if (_editableText != _recognizedText) ...[
          const SizedBox(height: 4),
          Text(
            'Original: $_recognizedText',
            style: const TextStyle(fontSize: 11, color: Colors.grey),
          ),
        ],

        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            OutlinedButton.icon(
              onPressed: _backToDrawing,
              icon: const Icon(Icons.edit_note, size: 16),
              label: const Text('Back to Drawing'),
            ),
            Row(
              children: [
                OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _editableText.trim().isNotEmpty ? _save : null,
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Insert Text'),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  Widget _buildErrorState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.warning_amber,
            size: 48,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 12),
          Text(
            'Recognition Failed',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Theme.of(context).colorScheme.error,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: _retry,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
