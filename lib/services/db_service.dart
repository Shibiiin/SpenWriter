import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_types.dart';

/// Local persistence service using SharedPreferences (works on web).
/// Stores conversations and settings as JSON strings.
class DbService {
  static const _conversationsKey = 'spenwriter_conversations';
  static const _settingsKey = 'spenwriter_settings';

  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // ── Conversations ──────────────────────────────────────────────────────

  List<Conversation> getConversations() {
    final raw = _prefs.getString(_conversationsKey);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    } catch (e) {
      debugPrint('Error loading conversations: $e');
      return [];
    }
  }

  Future<void> _saveConversations(List<Conversation> convs) async {
    final json = jsonEncode(convs.map((c) => c.toJson()).toList());
    await _prefs.setString(_conversationsKey, json);
  }

  Future<String> createConversation(Conversation conv) async {
    final list = getConversations();
    list.insert(0, conv);
    await _saveConversations(list);
    return conv.id;
  }

  Future<void> updateConversation(String id, Conversation updated) async {
    final list = getConversations();
    final idx = list.indexWhere((c) => c.id == id);
    if (idx >= 0) {
      list[idx] = updated;
      await _saveConversations(list);
    }
  }

  Future<void> deleteConversation(String id) async {
    final list = getConversations();
    list.removeWhere((c) => c.id == id);
    await _saveConversations(list);
  }

  List<Conversation> searchConversations(String query) {
    final lower = query.toLowerCase();
    return getConversations().where((c) {
      return c.title.toLowerCase().contains(lower) ||
          c.messages.any((m) => m.text.toLowerCase().contains(lower));
    }).toList();
  }

  Future<String> exportData() async {
    final convs = getConversations();
    return jsonEncode({'conversations': convs.map((c) => c.toJson()).toList()});
  }

  Future<void> importData(String jsonStr) async {
    final data = jsonDecode(jsonStr) as Map<String, dynamic>;
    if (data['conversations'] != null) {
      final existing = getConversations();
      final imported = (data['conversations'] as List)
          .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
          .toList();
      existing.addAll(imported);
      await _saveConversations(existing);
    }
  }

  Future<void> clearAll() async {
    await _prefs.remove(_conversationsKey);
  }

  // ── Settings ───────────────────────────────────────────────────────────

  AppSettings getSettings() {
    final raw = _prefs.getString(_settingsKey);
    if (raw == null) return AppSettings();
    try {
      return AppSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return AppSettings();
    }
  }

  Future<void> saveSettings(AppSettings settings) async {
    await _prefs.setString(_settingsKey, jsonEncode(settings.toJson()));
  }
}
