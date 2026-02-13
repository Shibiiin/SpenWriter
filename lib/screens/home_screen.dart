import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import 'voice_chat_screen.dart';
import 'conversation_history_screen.dart';
import 'file_manager_screen.dart';
import 'settings_screen.dart';

/// Main home screen with tabbed navigation.
/// Mirrors the React App.tsx with 4 tabs: Chat, History, Files, Settings.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        // ── Header / AppBar ──────────────────────────────────────────────
        appBar: AppBar(
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.edit_note,
                color: Theme.of(context).colorScheme.primary,
                size: 28,
              ),
              const SizedBox(width: 8),
              const Text(
                'SpenWriter',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: Icon(
                provider.themeMode == ThemeMode.dark
                    ? Icons.light_mode
                    : Icons.dark_mode,
              ),
              tooltip: 'Toggle theme',
              onPressed: () {
                final isDark = Theme.of(context).brightness == Brightness.dark;
                provider.setTheme(isDark ? 'light' : 'dark');
              },
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.mic, size: 20), text: 'Voice Chat'),
              Tab(icon: Icon(Icons.history, size: 20), text: 'History'),
              Tab(icon: Icon(Icons.audio_file, size: 20), text: 'Files'),
              Tab(icon: Icon(Icons.settings, size: 20), text: 'Settings'),
            ],
            labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            indicatorWeight: 3,
          ),
        ),

        // ── Tab content ──────────────────────────────────────────────────
        body: const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: TabBarView(
            children: [
              VoiceChatScreen(),
              ConversationHistoryScreen(),
              FileManagerScreen(),
              SettingsScreen(),
            ],
          ),
        ),
      ),
    );
  }
}
