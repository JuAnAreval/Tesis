import 'dart:convert';
import 'package:http/http.dart' as http; // Asegúrate de tener 'http: ^latest_version' en pubspec.yaml
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Lista de baseUrls para intentar en orden. El primero que responda será usado.
  // IMPORTANTE: Asegúrate de que tu servidor API esté corriendo en el puerto 3000
  static const List<String> _baseUrls = [
    'http://10.0.2.2:3000/api/auth', // Android emulator (default)
    'http://10.0.3.2:3000/api/auth', // Genymotion
    'http://192.168.1.32:3000/api/auth', // Host IP Wi-Fi (actualizada)
    'http://192.168.56.1:3000/api/auth', // Host IP VirtualBox
    'http://localhost:3000/api/auth', // Flutter web o Desktop
  ];

  // Base URLs para parqueaderos y reservas
  static const List<String> _parqueaderoBaseUrls = [
    'http://10.0.2.2:3000/api/parqueaderos',
    'http://10.0.3.2:3000/api/parqueaderos',
    'http://192.168.1.32:3000/api/parqueaderos',
    'http://192.168.56.1:3000/api/parqueaderos',
    'http://localhost:3000/api/parqueaderos',
  ];

  static const List<String> _reservasBaseUrls = [
    'http://10.0.2.2:3000/api/reservas',
    'http://10.0.3.2:3000/api/reservas',
    'http://192.168.1.32:3000/api/reservas',
    'http://192.168.56.1:3000/api/reservas',
    'http://localhost:3000/api/reservas',
  ];

  // Helper para procesar el cuerpo de la respuesta JSON de forma segura
  static Map<String, dynamic> _parseBody(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (e) {
      // Retorna el cuerpo sin parsear si no es un JSON válido
      return {'message': 'Invalid JSON response', 'raw': body};
    }
  }

  // Helper genérico para realizar POSTs con múltiples URLs de fallback
  static Future<Map<String, dynamic>> _postWithFallback(String endpoint, Map<String, dynamic> bodyPayload, {http.Client? client}) async {
    // Usamos el cliente proporcionado o creamos uno nuevo
    final httpClient = client ?? http.Client();

    for (final base in _baseUrls) {
      final url = '$base$endpoint';
      try {
        final response = await httpClient
            .post(
              Uri.parse(url),
              headers: {"Content-Type": "application/json"},
              body: jsonEncode(bodyPayload),
            )
            .timeout(const Duration(seconds: 1)); // Timeout reducido para más rapidez

        final parsed = _parseBody(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return {'success': true, 'data': parsed};
        }
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  // Métodos de autenticación
  static Future<Map<String, dynamic>> login(String email, String password) async {
    return _postWithFallback('/login', {'email': email, 'password': password});
  }

  static Future<Map<String, dynamic>> register(String nombre, String email, String password) async {
    return _postWithFallback('/register', {'nombre': nombre, 'email': email, 'password': password});
  }

  // Métodos para parqueaderos
  static Future<Map<String, dynamic>> getParqueaderos() async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _parqueaderoBaseUrls) {
      try {
        final response = await http.get(
          Uri.parse('$base'),
          headers: {'Authorization': 'Bearer $token'},
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        if (response.statusCode == 200) {
          return {'success': true, 'data': jsonDecode(response.body)};
        }
        final parsed = _parseBody(response.body);
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  static Future<Map<String, dynamic>> getTarifas(int parqueaderoId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _parqueaderoBaseUrls) {
      try {
        final response = await http.get(
          Uri.parse('$base/$parqueaderoId/tarifas'),
          headers: {'Authorization': 'Bearer $token'},
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        if (response.statusCode == 200) {
          return {'success': true, 'data': jsonDecode(response.body)};
        }
        final parsed = _parseBody(response.body);
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  // Métodos para reservas
  static Future<Map<String, dynamic>> crearReserva(Map<String, dynamic> reservaData) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _reservasBaseUrls) {
      try {
        final response = await http.post(
          Uri.parse('$base'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token'
          },
          body: jsonEncode(reservaData),
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        final parsed = _parseBody(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return {'success': true, 'data': parsed};
        }
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  static Future<Map<String, dynamic>> getReservasUsuario(int usuarioId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _reservasBaseUrls) {
      try {
        final response = await http.get(
          Uri.parse('$base/usuario/$usuarioId'),
          headers: {'Authorization': 'Bearer $token'},
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        if (response.statusCode == 200) {
          return {'success': true, 'data': jsonDecode(response.body)};
        }
        final parsed = _parseBody(response.body);
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  static Future<Map<String, dynamic>> autorizarIngreso(int reservaId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _reservasBaseUrls) {
      try {
        final response = await http.put(
          Uri.parse('$base/$reservaId/autorizar'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token'
          },
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        final parsed = _parseBody(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return {'success': true, 'data': parsed};
        }
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  static Future<Map<String, dynamic>> cancelarReserva(int reservaId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _reservasBaseUrls) {
      try {
        final response = await http.put(
          Uri.parse('$base/$reservaId/cancelar'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token'
          },
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        final parsed = _parseBody(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return {'success': true, 'data': parsed};
        }
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  static Future<Map<String, dynamic>> completarReserva(int reservaId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _reservasBaseUrls) {
      try {
        final response = await http.put(
          Uri.parse('$base/$reservaId/completar'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token'
          },
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        final parsed = _parseBody(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return {'success': true, 'data': parsed};
        }
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  static Future<Map<String, dynamic>> getTarifa(int reservaId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _reservasBaseUrls) {
      try {
        final response = await http.get(
          Uri.parse('$base/$reservaId/tarifa'),
          headers: {'Authorization': 'Bearer $token'},
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        if (response.statusCode == 200) {
          return {'success': true, 'data': jsonDecode(response.body)};
        }
        final parsed = _parseBody(response.body);
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  // Método para obtener tarifas de un parqueadero (actualizado para nueva estructura)
  static Future<Map<String, dynamic>> getTarifasParqueadero(int parqueaderoId) async {
    final token = await _getToken();
    if (token == null) {
      return {'success': false, 'message': 'Usuario no autenticado'};
    }

    for (final base in _parqueaderoBaseUrls) {
      try {
        final response = await http.get(
          Uri.parse('$base/$parqueaderoId/tarifas'),
          headers: {'Authorization': 'Bearer $token'},
        ).timeout(const Duration(seconds: 1)); // Timeout reducido

        if (response.statusCode == 200) {
          return {'success': true, 'data': jsonDecode(response.body)};
        }
        final parsed = _parseBody(response.body);
        return {'success': false, 'message': parsed['message'] ?? 'Error desconocido'};
      } catch (_) {}
    }
    return {'success': false, 'message': 'No se pudo conectar a ningún servidor'};
  }

  // Métodos de autenticación con token
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Opcional: almacenar y obtener user id (guardarlo tras el login si la app lo hace)
  static Future<void> saveUserId(int userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('user_id', userId);
  }

  static Future<int?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_id');
  }
}
