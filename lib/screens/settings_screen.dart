import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/app_types.dart';
import '../providers/app_provider.dart';

/// Settings screen — voice, appearance, data management.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final settings = provider.settings;
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      children: [
        // ── Voice Settings ──────────────────────────────────────────────
        _SectionHeader(title: 'Voice Settings'),

        // Language
        ListTile(
          title: const Text('Language'),
          subtitle: Text(settings.language.label),
          leading: const Icon(Icons.language),
          trailing: DropdownButton<AppLanguage>(
            value: settings.language,
            underline: const SizedBox(),
            items: AppLanguage.values
                .map((lang) => DropdownMenuItem(
                      value: lang,
                      child: Text(lang.label, style: const TextStyle(fontSize: 14)),
                    ))
                .toList(),
            onChanged: (val) {
              if (val != null) {
                provider.updateSettings(settings..language = val);
              }
            },
          ),
        ),

        // Speaker
        ListTile(
          title: const Text('Speaker'),
          subtitle: Text(settings.speaker.label),
          leading: const Icon(Icons.record_voice_over),
          trailing: DropdownButton<VoiceSpeaker>(
            value: settings.speaker,
            underline: const SizedBox(),
            items: VoiceSpeaker.values
                .map((s) => DropdownMenuItem(
                      value: s,
                      child: Text(s.label, style: const TextStyle(fontSize: 14)),
                    ))
                .toList(),
            onChanged: (val) {
              if (val != null) {
                provider.updateSettings(settings..speaker = val);
              }
            },
          ),
        ),

        // Auto-play
        SwitchListTile(
          title: const Text('Auto-play Responses'),
          subtitle: const Text('Automatically read aloud responses'),
          secondary: const Icon(Icons.play_circle_outline),
          value: settings.autoPlayResponses,
          onChanged: (val) {
            provider.updateSettings(settings..autoPlayResponses = val);
          },
        ),

        // Save audio
        SwitchListTile(
          title: const Text('Save Audio Locally'),
          subtitle: const Text('Store audio recordings in local storage'),
          secondary: const Icon(Icons.save),
          value: settings.saveAudioLocally,
          onChanged: (val) {
            provider.updateSettings(settings..saveAudioLocally = val);
          },
        ),

        const Divider(height: 32),

        // ── Appearance ──────────────────────────────────────────────────
        _SectionHeader(title: 'Appearance'),

        ListTile(
          title: const Text('Theme'),
          leading: const Icon(Icons.palette),
          subtitle: Text(settings.theme[0].toUpperCase() +
              settings.theme.substring(1)),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              for (final t in ['light', 'dark', 'system']) ...[
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(t[0].toUpperCase() + t.substring(1)),
                      selected: settings.theme == t,
                      onSelected: (_) => provider.setTheme(t),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),

        const Divider(height: 32),

        // ── Data Management ─────────────────────────────────────────────
        _SectionHeader(title: 'Data Management'),

        ListTile(
          title: const Text('Export Data'),
          subtitle: const Text('Copy conversations as JSON'),
          leading: const Icon(Icons.upload),
          onTap: () async {
            final json = await provider.exportData();
            await Clipboard.setData(ClipboardData(text: json));
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Data copied to clipboard')),
              );
            }
          },
        ),

        ListTile(
          title: const Text('Import Data'),
          subtitle: const Text('Paste JSON data to import'),
          leading: const Icon(Icons.download),
          onTap: () => _showImportDialog(context, provider),
        ),

        ListTile(
          title: Text('Clear All Data',
              style: TextStyle(color: colorScheme.error)),
          subtitle: const Text('Delete all conversations and audio'),
          leading: Icon(Icons.delete_forever, color: colorScheme.error),
          onTap: () => _confirmClear(context, provider),
        ),

        const SizedBox(height: 32),
      ],
    );
  }

  void _showImportDialog(BuildContext context, AppProvider provider) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Import Data'),
        content: TextField(
          controller: controller,
          maxLines: 5,
          decoration: const InputDecoration(
            hintText: 'Paste JSON data here...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (controller.text.isNotEmpty) {
                provider.importData(controller.text);
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Data imported successfully')),
                );
              }
            },
            child: const Text('Import'),
          ),
        ],
      ),
    );
  }

  void _confirmClear(BuildContext context, AppProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear All Data'),
        content: const Text(
            'This will permanently delete all conversations and audio files. '
            'This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              provider.clearAll();
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All data cleared')),
              );
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Clear Everything'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
