import 'package:flutter_test/flutter_test.dart';
import 'package:spen_writer/models/app_types.dart';

void main() {
  group('AppTypes', () {
    test('Message serialization roundtrip', () {
      final msg = Message(
        role: MessageRole.user,
        text: 'Patient has fever',
        language: AppLanguage.en,
      );

      final json = msg.toJson();
      final restored = Message.fromJson(json);

      expect(restored.text, msg.text);
      expect(restored.role, msg.role);
      expect(restored.language, msg.language);
    });

    test('Conversation serialization roundtrip', () {
      final conv = Conversation(
        title: 'Test Conversation',
        language: AppLanguage.hi,
        messages: [
          Message(role: MessageRole.user, text: 'Hello', language: AppLanguage.hi),
        ],
      );

      final json = conv.toJson();
      final restored = Conversation.fromJson(json);

      expect(restored.title, conv.title);
      expect(restored.language, AppLanguage.hi);
      expect(restored.messages.length, 1);
      expect(restored.messages.first.text, 'Hello');
    });

    test('AppSettings defaults', () {
      final settings = AppSettings();
      expect(settings.language, AppLanguage.en);
      expect(settings.speaker, VoiceSpeaker.nova);
      expect(settings.theme, 'system');
      expect(settings.autoPlayResponses, true);
    });

    test('Stroke point creation', () {
      const p = StrokePoint(x: 100, y: 200, t: 42);
      final json = p.toJson();
      expect(json['x'], 100);
      expect(json['y'], 200);
      expect(json['t'], 42);
    });
  });
}
