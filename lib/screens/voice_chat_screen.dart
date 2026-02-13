import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/app_types.dart';
import '../providers/app_provider.dart';
import '../widgets/audio_orb.dart';
import '../widgets/handwriting_pad.dart';

/// Voice chat screen — the main interaction view.
/// Supports voice recording, text input, and handwriting input.
class VoiceChatScreen extends StatefulWidget {
  const VoiceChatScreen({super.key});

  @override
  State<VoiceChatScreen> createState() => _VoiceChatScreenState();
}

class _VoiceChatScreenState extends State<VoiceChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isRecording = false;
  bool _isProcessing = false;

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _toggleRecording() {
    final provider = context.read<AppProvider>();
    if (_isRecording) {
      final text = provider.recognitionService.stopListening();
      if (text.isNotEmpty) {
        _addMessage(text);
      }
      setState(() => _isRecording = false);
    } else {
      provider.recognitionService.startListening(provider.settings.language);
      setState(() => _isRecording = true);
    }
  }

  void _sendText() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _addMessage(text);
    _textController.clear();
  }

  void _addMessage(String text) {
    final provider = context.read<AppProvider>();
    final msg = Message(
      role: MessageRole.user,
      text: text,
      language: provider.settings.language,
    );
    provider.addMessage(msg);
    _scrollToBottom();
  }

  void _openHandwritingPad() {
    final provider = context.read<AppProvider>();
    showDialog(
      context: context,
      builder: (ctx) => ChangeNotifierProvider.value(
        value: provider,
        child: HandwritingPad(
          language: provider.settings.language.name,
          onTextRecognized: (text) {
            _addMessage(text);
          },
        ),
      ),
    );
  }

  void _playMessage(Message msg) {
    final provider = context.read<AppProvider>();
    final speech = provider.speechService;
    if (speech.isSpeaking) {
      speech.stopSpeaking();
    } else {
      speech.speak(msg.text, msg.language, provider.settings.speaker);
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final messages = provider.activeConversation?.messages ?? [];
    final colorScheme = Theme.of(context).colorScheme;
    final dateFormat = DateFormat('d MMM, h:mm a');

    return Column(
      children: [
        // Conversation header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  provider.activeConversation?.title ?? 'New Conversation',
                  style: Theme.of(context).textTheme.titleMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (provider.activeConversation != null)
                TextButton(
                  onPressed: provider.newConversation,
                  child: const Text('+ New'),
                ),
            ],
          ),
        ),

        // Messages area
        Expanded(
          child: Card(
            clipBehavior: Clip.antiAlias,
            child: messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.mic, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        const Text(
                          'Start a conversation',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Tap the orb to record, type a message, or use handwriting',
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final isUser = msg.role == MessageRole.user;

                      return Align(
                        alignment:
                            isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.75,
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: isUser
                                ? colorScheme.primary
                                : colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                msg.text,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isUser
                                      ? colorScheme.onPrimary
                                      : colorScheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    dateFormat.format(msg.timestamp),
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isUser
                                          ? colorScheme.onPrimary
                                              .withValues(alpha: 0.6)
                                          : Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  InkWell(
                                    onTap: () => _playMessage(msg),
                                    borderRadius: BorderRadius.circular(12),
                                    child: Icon(
                                      provider.speechService.isSpeaking
                                          ? Icons.volume_off
                                          : Icons.volume_up,
                                      size: 14,
                                      color: isUser
                                          ? colorScheme.onPrimary
                                              .withValues(alpha: 0.6)
                                          : Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),

        const SizedBox(height: 12),

        // Voice input area
        Column(
          children: [
            AudioOrb(
              isActive: _isRecording,
              isProcessing: _isProcessing,
              onTap: _toggleRecording,
            ),
            const SizedBox(height: 8),
            Text(
              _isRecording
                  ? 'Listening... Tap to stop'
                  : _isProcessing
                      ? 'Processing...'
                      : 'Tap to record',
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),

            // Text input + handwriting button
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'Or type a message...',
                        isDense: true,
                      ),
                      onSubmitted: (_) => _sendText(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sendText,
                    icon: const Icon(Icons.send, size: 18),
                    tooltip: 'Send',
                  ),
                  const SizedBox(width: 4),
                  IconButton.outlined(
                    onPressed: _openHandwritingPad,
                    icon: const Icon(Icons.edit_note, size: 18),
                    tooltip: 'Add via handwriting',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Prominent Add button
            FilledButton.tonalIcon(
              onPressed: _openHandwritingPad,
              icon: const Icon(Icons.edit_note, size: 18),
              label: const Text('Add — Handwriting Input'),
            ),
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
