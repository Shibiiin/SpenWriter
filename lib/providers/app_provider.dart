import 'package:flutter/material.dart';
import '../models/app_types.dart';
import '../services/db_service.dart';
import '../services/speech_service.dart';
import '../services/handwriting_service.dart';

/// Central app state — manages conversations, settings, and services.
class AppProvider extends ChangeNotifier {
  final DbService _db;
  final SpeechService speechService = SpeechService();
  final SpeechRecognitionService recognitionService = SpeechRecognitionService();
  final HandwritingService handwritingService = HandwritingService();

  AppProvider(this._db) {
    _settings = _db.getSettings();
    _conversations = _db.getConversations();
  }

  // ── Settings ───────────────────────────────────────────────────────────

  late AppSettings _settings;
  AppSettings get settings => _settings;

  ThemeMode get themeMode {
    switch (_settings.theme) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> updateSettings(AppSettings newSettings) async {
    _settings = newSettings;
    await _db.saveSettings(newSettings);
    notifyListeners();
  }

  Future<void> setTheme(String theme) async {
    _settings.theme = theme;
    await _db.saveSettings(_settings);
    notifyListeners();
  }

  // ── Conversations ──────────────────────────────────────────────────────

  late List<Conversation> _conversations;
  List<Conversation> get conversations => _conversations;

  Conversation? _activeConversation;
  Conversation? get activeConversation => _activeConversation;

  void selectConversation(Conversation conv) {
    _activeConversation = conv;
    notifyListeners();
  }

  void newConversation() {
    _activeConversation = null;
    notifyListeners();
  }

  Future<void> addMessage(Message message) async {
    if (_activeConversation != null) {
      _activeConversation!.messages.add(message);
      _activeConversation!.updatedAt = DateTime.now();
      await _db.updateConversation(_activeConversation!.id, _activeConversation!);
    } else {
      final conv = Conversation(
        title: message.text.length > 50
            ? message.text.substring(0, 50)
            : message.text,
        language: _settings.language,
        messages: [message],
      );
      await _db.createConversation(conv);
      _activeConversation = conv;
    }
    _conversations = _db.getConversations();
    notifyListeners();
  }

  Future<void> deleteConversation(String id) async {
    await _db.deleteConversation(id);
    if (_activeConversation?.id == id) {
      _activeConversation = null;
    }
    _conversations = _db.getConversations();
    notifyListeners();
  }

  List<Conversation> searchConversations(String query) {
    if (query.isEmpty) return _conversations;
    return _db.searchConversations(query);
  }

  Future<String> exportData() => _db.exportData();

  Future<void> importData(String json) async {
    await _db.importData(json);
    _conversations = _db.getConversations();
    notifyListeners();
  }

  Future<void> clearAll() async {
    await _db.clearAll();
    _activeConversation = null;
    _conversations = [];
    notifyListeners();
  }

  @override
  void dispose() {
    recognitionService.dispose();
    super.dispose();
  }
}
