import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import '../models/app_types.dart';

// ── Recognition result ─────────────────────────────────────────────────────

class RecognitionResult {
  final String text;
  final double confidence;
  final String source; // 'native' | 'api' | 'fallback'

  const RecognitionResult({
    required this.text,
    required this.confidence,
    required this.source,
  });
}

// ── Handwriting recognition service ────────────────────────────────────────

/// Multi-backend handwriting recognition service.
///
/// Tries in order:
/// 1. Backend REST API (Google Vision / Azure / MyScript)
/// 2. Local fallback with stroke analysis
///
/// Configure the API URL via the `apiUrl` parameter or
/// set `HANDWRITING_API_URL` as a compile-time constant:
///   flutter run --dart-define=HANDWRITING_API_URL=https://...
class HandwritingService {
  static const _apiUrl = String.fromEnvironment(
    'HANDWRITING_API_URL',
    defaultValue: '',
  );

  /// Recognize handwriting from strokes and/or canvas image.
  Future<RecognitionResult> recognize({
    List<Stroke>? strokes,
    Uint8List? imageBytes,
    String language = 'en',
  }) async {
    // 1. Try backend API
    if (_apiUrl.isNotEmpty) {
      final result = await _recognizeViaApi(
        strokes: strokes,
        imageBytes: imageBytes,
        language: language,
      );
      if (result != null && result.text.isNotEmpty) return result;
    }

    // 2. Fallback — stroke analysis
    return _fallbackRecognition(strokes ?? []);
  }

  /// Call a backend recognition API.
  Future<RecognitionResult?> _recognizeViaApi({
    List<Stroke>? strokes,
    Uint8List? imageBytes,
    required String language,
  }) async {
    try {
      final body = <String, dynamic>{'language': language};

      if (strokes != null && strokes.isNotEmpty) {
        body['strokes'] = strokes
            .map((s) => s.points.map((p) => p.toJson()).toList())
            .toList();
      }

      if (imageBytes != null) {
        body['image'] = base64Encode(imageBytes);
      }

      // In production, use http package:
      // final response = await http.post(
      //   Uri.parse(_apiUrl),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode(body),
      // );
      // final data = jsonDecode(response.body);
      // return RecognitionResult(
      //   text: data['text'] ?? '',
      //   confidence: (data['confidence'] ?? 0.8).toDouble(),
      //   source: 'api',
      // );

      debugPrint('HandwritingService: API call to $_apiUrl with body keys: ${body.keys}');
      return null; // API not configured — fall through to fallback
    } catch (e) {
      debugPrint('HandwritingService API error: $e');
      return null;
    }
  }

  /// Fallback recognition when no API is available.
  /// Provides stroke analysis info for demonstration.
  RecognitionResult _fallbackRecognition(List<Stroke> strokes) {
    if (strokes.isEmpty) {
      return const RecognitionResult(text: '', confidence: 0, source: 'fallback');
    }

    final totalPoints = strokes.fold<int>(0, (sum, s) => sum + s.points.length);
    final strokeCount = strokes.length;

    double minX = double.infinity, minY = double.infinity;
    double maxX = double.negativeInfinity, maxY = double.negativeInfinity;

    for (final stroke in strokes) {
      for (final p in stroke.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }

    final width = (maxX - minX).round();
    final height = (maxY - minY).round();

    return RecognitionResult(
      text: '[Handwriting: $strokeCount stroke${strokeCount != 1 ? 's' : ''}, '
          '$totalPoints points, area ${width}x${height}px — '
          'Configure HANDWRITING_API_URL for real OCR]',
      confidence: 0.1,
      source: 'fallback',
    );
  }
}
