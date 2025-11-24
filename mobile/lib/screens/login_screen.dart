  import 'package:flutter/material.dart';
  import '../services/api_service.dart';

  class LoginScreen extends StatefulWidget {
    final VoidCallback? onLoginSuccess;

    const LoginScreen({super.key, this.onLoginSuccess});

    @override
    State<LoginScreen> createState() => _LoginScreenState();
  }

  class _LoginScreenState extends State<LoginScreen> {
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    bool loading = false;
    bool _isPasswordVisible = false;

    void _showCustomMessage(String message, {Color color = Colors.green}) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Center(
            child: Text(
              message,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ),
          backgroundColor: color,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
    }

    void _login() async {
      if (emailController.text.isEmpty || passwordController.text.isEmpty) {
        _showCustomMessage("Por favor, ingresa correo y contraseña.", color: Colors.red);
        return;
      }

      setState(() => loading = true);
      try {
        final result = await ApiService.login(
          emailController.text,
          passwordController.text,
        );

        if (result['success'] == true) {
          // Guardar token y user_id
          await ApiService.saveToken(result['data']['token']);
          await ApiService.saveUserId(result['data']['usuario']['id']);
          _showCustomMessage("Inicio de sesión exitoso ✅", color: Colors.green);
          Future.delayed(const Duration(seconds: 2), () {
            widget.onLoginSuccess?.call();
          });
        } else {
          _showCustomMessage(result['message'] ?? 'Error al iniciar sesión', color: Colors.red);
        }
      } catch (e) {
        _showCustomMessage('Error de conexión: $e', color: Colors.red);
      } finally {
        setState(() => loading = false);
      }
    }

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Iniciar Sesión", style: TextStyle(fontWeight: FontWeight.w600)),
          centerTitle: true,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Fast Parking',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: Theme.of(context).primaryColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Accede a tu cuenta para gestionar tus parqueaderos.',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),
                  TextField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: "Correo electrónico",
                      hintText: "ejemplo@dominio.com",
                      prefixIcon: Icon(Icons.email_rounded),
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: passwordController,
                    obscureText: !_isPasswordVisible,
                    decoration: InputDecoration(
                      labelText: "Contraseña",
                      hintText: "Ingresa tu contraseña",
                      prefixIcon: const Icon(Icons.lock_rounded),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                          color: Colors.grey,
                        ),
                        onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: loading ? null : _login,
                    child: loading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text("Ingresar"),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/register'),
                    child: Text("¿No tienes cuenta? Regístrate aquí", style: TextStyle(color: Theme.of(context).primaryColor)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
  }
