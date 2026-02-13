import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'services/db_service.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local database
  final db = DbService();
  await db.init();

  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider(db),
      child: const SpenWriterApp(),
    ),
  );
}

class SpenWriterApp extends StatelessWidget {
  const SpenWriterApp({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return MaterialApp(
      title: 'SpenWriter',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: provider.themeMode,
      home: const HomeScreen(),
    );
  }
}
