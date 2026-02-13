import 'package:uuid/uuid.dart';

const _uuid = Uuid();

String generateId() => _uuid.v4();

// ── Languages ──────────────────────────────────────────────────────────────

enum AppLanguage {
  hi('Hindi', 'hi-IN'),
  bn('Bengali', 'bn-IN'),
  kn('Kannada', 'kn-IN'),
  ml('Malayalam', 'ml-IN'),
  mr('Marathi', 'mr-IN'),
  pa('Punjabi', 'pa-IN'),
  ta('Tamil', 'ta-IN'),
  te('Telugu', 'te-IN'),
  en('English', 'en-IN'),
  gu('Gujarati', 'gu-IN'),
  ur('Urdu', 'ur-IN'),
  ja('Japanese', 'ja-JP');

  final String label;
  final String bcp47;
  const AppLanguage(this.label, this.bcp47);
}

// ── Speakers ───────────────────────────────────────────────────────────────

enum VoiceSpeaker {
  alloy('Alloy (Neutral)', 'neutral'),
  ash('Ash (Male)', 'male'),
  coral('Coral (Female)', 'female'),
  echo('Echo (Male)', 'male'),
  fable('Fable (Male)', 'male'),
  nova('Nova (Female)', 'female'),
  onyx('Onyx (Male)', 'male'),
  sage('Sage (Female)', 'female'),
  shimmer('Shimmer (Female)', 'female');

  final String label;
  final String gender;
  const VoiceSpeaker(this.label, this.gender);
}

// ── Message ────────────────────────────────────────────────────────────────

enum MessageRole { user, assistant }

class Message {
  final String id;
  final MessageRole role;
  final String text;
  final String? audioUrl;
  final DateTime timestamp;
  final AppLanguage language;

  Message({
    String? id,
    required this.role,
    required this.text,
    this.audioUrl,
    DateTime? timestamp,
    required this.language,
  })  : id = id ?? generateId(),
        timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role.name,
        'text': text,
        'audioUrl': audioUrl,
        'timestamp': timestamp.toIso8601String(),
        'language': language.name,
      };

  factory Message.fromJson(Map<String, dynamic> json) => Message(
        id: json['id'] as String,
        role: MessageRole.values.byName(json['role'] as String),
        text: json['text'] as String,
        audioUrl: json['audioUrl'] as String?,
        timestamp: DateTime.parse(json['timestamp'] as String),
        language: AppLanguage.values.byName(json['language'] as String),
      );
}

// ── Conversation ───────────────────────────────────────────────────────────

class Conversation {
  final String id;
  String title;
  final DateTime createdAt;
  DateTime updatedAt;
  AppLanguage language;
  List<Message> messages;

  Conversation({
    String? id,
    required this.title,
    DateTime? createdAt,
    DateTime? updatedAt,
    required this.language,
    List<Message>? messages,
  })  : id = id ?? generateId(),
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now(),
        messages = messages ?? [];

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'language': language.name,
        'messages': messages.map((m) => m.toJson()).toList(),
      };

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: json['id'] as String,
        title: json['title'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
        language: AppLanguage.values.byName(json['language'] as String),
        messages: (json['messages'] as List)
            .map((m) => Message.fromJson(m as Map<String, dynamic>))
            .toList(),
      );
}

// ── AppSettings ────────────────────────────────────────────────────────────

class AppSettings {
  AppLanguage language;
  VoiceSpeaker speaker;
  String theme; // 'light' | 'dark' | 'system'
  bool autoPlayResponses;
  bool saveAudioLocally;

  AppSettings({
    this.language = AppLanguage.en,
    this.speaker = VoiceSpeaker.nova,
    this.theme = 'system',
    this.autoPlayResponses = true,
    this.saveAudioLocally = true,
  });

  Map<String, dynamic> toJson() => {
        'language': language.name,
        'speaker': speaker.name,
        'theme': theme,
        'autoPlayResponses': autoPlayResponses,
        'saveAudioLocally': saveAudioLocally,
      };

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    AppLanguage lang;
    try {
      lang = AppLanguage.values.byName(json['language'] as String);
    } catch (_) {
      lang = AppLanguage.en;
    }
    VoiceSpeaker spk;
    try {
      spk = VoiceSpeaker.values.byName(json['speaker'] as String);
    } catch (_) {
      spk = VoiceSpeaker.nova;
    }
    return AppSettings(
      language: lang,
      speaker: spk,
      theme: json['theme'] as String? ?? 'system',
      autoPlayResponses: json['autoPlayResponses'] as bool? ?? true,
      saveAudioLocally: json['saveAudioLocally'] as bool? ?? true,
    );
  }
}

// ── Stroke data for handwriting ────────────────────────────────────────────

class StrokePoint {
  final double x;
  final double y;
  final int t;

  const StrokePoint({required this.x, required this.y, required this.t});

  Map<String, dynamic> toJson() => {'x': x, 'y': y, 't': t};
}

class Stroke {
  final List<StrokePoint> points;

  Stroke({List<StrokePoint>? points}) : points = points ?? [];

  void addPoint(StrokePoint p) => points.add(p);
}
