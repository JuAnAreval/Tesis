import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ReservationScreen extends StatefulWidget {
  const ReservationScreen({super.key});

  @override
  State<ReservationScreen> createState() => _ReservationScreenState();
}

class _ReservationScreenState extends State<ReservationScreen> {
  List reservas = [];
  bool loading = true;
  Timer? _notificationTimer;

  // Paleta de colores consistente con home_screen.dart
  static const Color primaryColor = Color(0xFF1E3A8A);
  static const Color secondaryColor = Color(0xFF2563EB);
  static const Color accentColor = Color(0xFF38BDF8);
  static const Color backgroundColor = Color(0xFFF9FAFB);
  static const Color textColor = Color(0xFF1E293B);

  @override
  void initState() {
    super.initState();
    _loadReservas();
    _startNotificationTimer();
  }

  @override
  void dispose() {
    _notificationTimer?.cancel();
    super.dispose();
  }

  void _startNotificationTimer() {
    _notificationTimer = Timer.periodic(const Duration(minutes: 1), (timer) {
      _checkNearingEnd();
    });
  }

  void _checkNearingEnd() {
    final now = DateTime.now();
    for (var r in reservas) {
      if (r['estado'] == 'activa') {
        final endTime = DateTime.parse('${r['fecha_reserva']}T${r['hora_fin']}');
        final diff = endTime.difference(now).inMinutes;
        if (diff <= 15 && diff > 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Reserva en ${r['parqueadero_nombre']} termina pronto.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    }
  }

  Future<void> _loadReservas() async {
    final userId = await ApiService.getUserId();
    if (userId == null) {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Usuario no autenticado'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    setState(() => loading = true);
    final result = await ApiService.getReservasUsuario(userId);
    if (result['success'] == true) {
      setState(() {
        reservas = result['data'];
        loading = false;
      });
    } else {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Error al cargar reservas'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _autorizarIngreso(int id) async {
    final result = await ApiService.autorizarIngreso(id);
    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ingreso autorizado.'),
          backgroundColor: Colors.green,
        ),
      );
      _loadReservas();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Error al autorizar ingreso'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _cancelarReserva(int id) async {
    final result = await ApiService.cancelarReserva(id);
    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reserva cancelada.'),
          backgroundColor: Colors.orange,
        ),
      );
      _loadReservas();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Error al cancelar reserva'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }





  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: primaryColor,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          "Mis Reservas",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator(color: primaryColor))
          : reservas.isEmpty
              ? const Center(
                  child: Text(
                    "No tienes reservas.",
                    style: TextStyle(fontSize: 16, color: textColor),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: reservas.length,
                  itemBuilder: (context, index) {
                    final r = reservas[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      elevation: 4,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              r['parqueadero_nombre'] ?? 'Parqueadero',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: textColor,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Dirección: ${r['direccion'] ?? 'N/A'}',
                              style: TextStyle(color: textColor.withOpacity(0.8)),
                            ),
                            Text(
                              'Fecha: ${r['fecha_reserva']} | ${r['hora_inicio']} - ${r['hora_fin']}',
                              style: TextStyle(color: textColor.withOpacity(0.8)),
                            ),
                            Text(
                              'Vehículo: ${r['tipo_vehiculo']} | Estado: ${r['estado']}',
                              style: TextStyle(color: textColor.withOpacity(0.8)),
                            ),
                            Text(
                              'Valor estimado: \$${r['valor_estimado']}',
                              style: TextStyle(color: textColor.withOpacity(0.8)),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                if (r['estado'] == 'pendiente') ...[
                                  ElevatedButton.icon(
                                    onPressed: () => _autorizarIngreso(r['id']),
                                    icon: const Icon(Icons.key),
                                    label: const Text('Autorizar Ingreso'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: secondaryColor,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton.icon(
                                    onPressed: () => _cancelarReserva(r['id']),
                                    icon: const Icon(Icons.cancel),
                                    label: const Text('Cancelar'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
