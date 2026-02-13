# SpenWriter — Doctor Handwriting Input Pad

A Flutter Web application that provides doctors with a handwriting input pad
for capturing medical notes using mouse, stylus, or touch. Handwritten content
is recognized and converted to editable text.

## Features

- **Handwriting Input Pad** — Canvas-based drawing with pen/eraser tools, undo, clear,
  adjustable pen thickness, and quadratic curve smoothing for smooth strokes
- **Handwriting Recognition** — Multi-backend support: browser native API, configurable
  REST API (Google Vision / Azure / MyScript), and offline fallback
- **Voice Input** — Record voice notes using the Web Speech API
- **Text Input** — Standard keyboard input as a fallback
- **Conversation History** — Searchable list of past conversations stored locally
- **Settings** — Language selection (12 languages), speaker voice, theme, and data management
- **Light/Dark Theme** — System-aware with manual toggle

## Getting Started

```bash
# Ensure Flutter SDK is installed (3.5+)
flutter --version

# Get dependencies
flutter pub get

# Run on web (Chrome)
flutter run -d chrome

# Build for production
flutter build web
```

## Project Structure

```
lib/
  main.dart                          # App entry point
  models/
    app_types.dart                   # Data models, enums, types
  providers/
    app_provider.dart                # Central state management (ChangeNotifier)
  services/
    db_service.dart                  # Local persistence (SharedPreferences)
    speech_service.dart              # Web Speech API (TTS + STT)
    handwriting_service.dart         # Handwriting recognition (multi-backend)
  theme/
    app_theme.dart                   # Light/dark Material 3 themes
  screens/
    home_screen.dart                 # Main tabbed layout
    voice_chat_screen.dart           # Chat + voice + handwriting input
    conversation_history_screen.dart # Past conversations
    file_manager_screen.dart         # Audio file management
    settings_screen.dart             # App settings
  widgets/
    audio_orb.dart                   # Animated recording orb
    handwriting_canvas.dart          # Drawing canvas (CustomPainter)
    handwriting_pad.dart             # Full handwriting dialog
web/
  index.html                        # Web entry point
  manifest.json                     # PWA manifest
```

## Handwriting Recognition API

By default the app uses a local fallback that describes captured strokes.
To enable real OCR, set the API URL at build time:

```bash
flutter run -d chrome --dart-define=HANDWRITING_API_URL=https://your-api.com/handwriting-recognize
```

The API should accept:
```
POST /handwriting-recognize
Content-Type: application/json

{
  "strokes": [[{"x": 120, "y": 340, "t": 1}, ...]],
  "image": "<base64 PNG>",
  "language": "en"
}
```

And respond with:
```json
{
  "text": "Patient has fever and cough",
  "confidence": 0.92
}
```

Compatible backends: Google Cloud Vision OCR, Azure Ink Recognizer, MyScript iink.

## Supported Languages

Hindi, Bengali, Kannada, Malayalam, Marathi, Punjabi, Tamil, Telugu, English,
Gujarati, Urdu, Japanese.
