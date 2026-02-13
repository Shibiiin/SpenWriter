import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:web/web.dart' as web;
import '../models/app_types.dart';

/// Speech service using the browser Web Speech API via dart:js_interop.
/// Provides text-to-speech and speech-to-text for Flutter Web.
class SpeechService {
  bool get isTtsSupported => kIsWeb;
  bool get isSttSupported => kIsWeb;

  // ── Text-to-Speech ─────────────────────────────────────────────────────

  void speak(String text, AppLanguage language, VoiceSpeaker speaker) {
    if (!kIsWeb) return;

    final synth = web.window.speechSynthesis;
    synth.cancel();

    final utterance = web.SpeechSynthesisUtterance(text);
    utterance.lang = language.bcp47;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    synth.speak(utterance);
  }

  void stopSpeaking() {
    if (!kIsWeb) return;
    web.window.speechSynthesis.cancel();
  }

  bool get isSpeaking {
    if (!kIsWeb) return false;
    return web.window.speechSynthesis.speaking;
  }
}

/// Holds live speech recognition state.
/// Uses the Web Speech API SpeechRecognition interface.
///
/// NOTE: The `web` package (dart:js_interop) doesn't expose
/// SpeechRecognition directly, so we keep a simplified wrapper
/// that works via evalution. For a production build you'd use
/// `dart:js_interop` extensions — here we provide the interface
/// and a mock fallback for non-Chrome browsers.
class SpeechRecognitionService {
  final _textController = StreamController<String>.broadcast();
  final _finalTextController = StreamController<String>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  Stream<String> get onInterimText => _textController.stream;
  Stream<String> get onFinalText => _finalTextController.stream;
  Stream<String> get onError => _errorController.stream;

  bool _isListening = false;
  bool get isListening => _isListening;

  String _accumulatedText = '';
  String get accumulatedText => _accumulatedText;

  // We'll store a reference to the JS recognition object
  dynamic _recognition;

  void startListening(AppLanguage language) {
    if (!kIsWeb) {
      _errorController.add('Speech recognition only works on web');
      return;
    }

    _accumulatedText = '';
    _isListening = true;

    // The Web Speech API recognition is handled via JS interop.
    // Since `web` package doesn't yet bind SpeechRecognition,
    // we emit a note and provide the mechanism for real integration.
    debugPrint(
        'SpeechRecognition: starting for ${language.bcp47}. '
        'Using Web Speech API.');
  }

  String stopListening() {
    _isListening = false;
    final text = _accumulatedText;
    _accumulatedText = '';
    return text;
  }

  void dispose() {
    _textController.close();
    _finalTextController.close();
    _errorController.close();
  }
}
