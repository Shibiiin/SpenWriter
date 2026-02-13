import 'package:flutter/material.dart';

/// Animated orb button for voice recording — mirrors the React AudioOrb.
class AudioOrb extends StatefulWidget {
  final bool isActive;
  final bool isProcessing;
  final VoidCallback onTap;
  final double size;

  const AudioOrb({
    super.key,
    required this.isActive,
    this.isProcessing = false,
    required this.onTap,
    this.size = 80,
  });

  @override
  State<AudioOrb> createState() => _AudioOrbState();
}

class _AudioOrbState extends State<AudioOrb>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(covariant AudioOrb oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.isActive && _controller.isAnimating) {
      _controller.stop();
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final orbColor = widget.isActive
        ? colorScheme.error
        : colorScheme.primary;

    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final scale =
              widget.isActive ? _pulseAnimation.value : 1.0;
          return Stack(
            alignment: Alignment.center,
            children: [
              // Pulse ring (when active)
              if (widget.isActive)
                Container(
                  width: widget.size * scale * 1.2,
                  height: widget.size * scale * 1.2,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: orbColor.withValues(alpha: 0.15),
                  ),
                ),
              // Main orb
              Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      orbColor,
                      orbColor.withValues(alpha: 0.7),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: orbColor.withValues(alpha: 0.3),
                      blurRadius: 16,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Center(
                  child: widget.isProcessing
                      ? SizedBox(
                          width: widget.size * 0.35,
                          height: widget.size * 0.35,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation(
                                colorScheme.onPrimary),
                          ),
                        )
                      : Icon(
                          widget.isActive ? Icons.stop : Icons.mic,
                          color: colorScheme.onPrimary,
                          size: widget.size * 0.4,
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
