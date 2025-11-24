// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:usuarios/main.dart';

void main() {
  testWidgets('Login screen shows inputs and navigates to register', (WidgetTester tester) async {
    // Build the app
    await tester.pumpWidget(const ParqueaderosApp());

    // Verify login screen elements
    expect(find.text('Iniciar Sesión'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.widgetWithText(ElevatedButton, 'Ingresar'), findsOneWidget);
    expect(find.widgetWithText(TextButton, '¿No tienes cuenta? Regístrate'), findsOneWidget);

    // Tap the register text button and navigate
    await tester.tap(find.widgetWithText(TextButton, '¿No tienes cuenta? Regístrate'));
    await tester.pumpAndSettle();

    // Verify we are on the register screen
    expect(find.text('Registro de Usuario'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Registrarse'), findsOneWidget);
  });
}
