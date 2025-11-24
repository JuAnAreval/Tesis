import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/home_map_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/reservation_screen.dart';
import 'services/api_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Esperar a que se inicialicen las dependencias
  try {
    await Future.wait([
      SharedPreferences.getInstance(),
    ]);
  } catch (e) {
    print('Error initializing app: $e');
  }
  
  runApp(const ParqueaderosApp());
}

class ParqueaderosApp extends StatefulWidget {
  const ParqueaderosApp({super.key});

  @override
  State<ParqueaderosApp> createState() => _ParqueaderosAppState();
}

class _ParqueaderosAppState extends State<ParqueaderosApp> {
  bool _isLoggedIn = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    // Check if user has a stored token
    final token = await ApiService.getToken();
    setState(() {
      _isLoggedIn = token != null;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: _isLoading
          ? const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            )
          : null,
      title: 'Parqueaderos App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: Colors.indigo.shade700,
        colorScheme: ColorScheme.fromSwatch(
          primarySwatch: Colors.indigo,
          accentColor: Colors.amber,
        ),
        scaffoldBackgroundColor: Colors.grey.shade50,
        fontFamily: 'Roboto',
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12.0),
            borderSide: BorderSide.none,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.indigo.shade700,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.0),
            ),
            padding: const EdgeInsets.symmetric(vertical: 14.0),
            textStyle: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
      initialRoute: _isLoggedIn ? '/home' : '/login',
      routes: {
        '/login': (context) => LoginScreen(onLoginSuccess: () {
          setState(() => _isLoggedIn = true);
          Navigator.pushReplacementNamed(context, '/home');
        }),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeMapScreen(),
        '/reservations': (context) => const ReservationScreen(),
      },
    );
  }
}
