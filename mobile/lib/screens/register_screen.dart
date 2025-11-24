import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool loading = false;
  bool _isPasswordVisible = false;

  void _showCustomSnackBar(String message, Color color, IconData icon) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontSize: 16))),
          ],
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _register() async {
    if (nameController.text.isEmpty || emailController.text.isEmpty || passwordController.text.isEmpty) {
      _showCustomSnackBar("Todos los campos son obligatorios.", Colors.red.shade400, Icons.error_outline);
      return;
    }

    setState(() => loading = true);
    try {
      final result = await ApiService.register(
        nameController.text,
        emailController.text,
        passwordController.text,
      );

      if (result['success'] == true) {
        _showCustomSnackBar("Cuenta creada con éxito 🎉", Colors.green.shade600, Icons.check_circle_outline);
        Future.delayed(const Duration(seconds: 1), () {
          Navigator.pushReplacementNamed(context, '/login');
        });
      } else {
        _showCustomSnackBar(result['message'] ?? "Error al registrar", Colors.red.shade400, Icons.error_outline);
      }
    } catch (e) {
      _showCustomSnackBar('Error de conexión: $e', Colors.red.shade400, Icons.error_outline);
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Registro de Usuario"), centerTitle: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Crea tu Cuenta',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Theme.of(context).primaryColor),
                    textAlign: TextAlign.center),
                const SizedBox(height: 10),
                Text('Únete a la plataforma para empezar a gestionar.',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade600), textAlign: TextAlign.center),
                const SizedBox(height: 40),
                TextField(controller: nameController, decoration: const InputDecoration(labelText: "Nombre completo", prefixIcon: Icon(Icons.person_rounded))),
                const SizedBox(height: 20),
                TextField(controller: emailController, decoration: const InputDecoration(labelText: "Correo electrónico", prefixIcon: Icon(Icons.email_rounded))),
                const SizedBox(height: 20),
                TextField(
                  controller: passwordController,
                  obscureText: !_isPasswordVisible,
                  decoration: InputDecoration(
                    labelText: "Contraseña",
                    prefixIcon: const Icon(Icons.lock_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(_isPasswordVisible ? Icons.visibility : Icons.visibility_off, color: Colors.grey),
                      onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                ElevatedButton(
                  onPressed: loading ? null : _register,
                  child: loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text("Registrarse"),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text("¿Ya tienes cuenta? Volver a Iniciar Sesión", style: TextStyle(color: Colors.grey.shade600)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
