import 'package:flutter/material.dart';

/// Placeholder screen for managing audio files.
/// Audio file management requires platform-specific APIs
/// that can be expanded based on requirements.
class FileManagerScreen extends StatelessWidget {
  const FileManagerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.audio_file, size: 48, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Audio Files',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Audio file management will appear here.\n'
            'Record conversations to save audio files.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
