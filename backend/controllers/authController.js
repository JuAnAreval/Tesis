const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuarioModel");

const SECRET_KEY = process.env.JWT_SECRET || "secreto123"; // prefer env var, fallback for compatibility

exports.registrar = (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ mensaje: "Faltan datos", message: "Missing data" });
    }

    Usuario.buscarPorEmail(email, (err, results) => {
        if (results.length > 0) {
            return res.status(400).json({ mensaje: "El correo ya está registrado", message: "Email already registered" });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);

        Usuario.crear(nombre, email, hashedPassword, (err) => {
            if (err) return res.status(500).json({ mensaje: "Error al registrar usuario" });
            res.json({ mensaje: "Usuario registrado con éxito", message: "Usuario registrado con éxito" });
        });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    Usuario.buscarPorEmail(email, (err, results) => {
        if (results.length === 0) {
            return res.status(400).json({ mensaje: "Usuario no encontrado", message: "User not found" });
        }

        const usuario = results[0];
        const passwordValida = bcrypt.compareSync(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta", message: "Incorrect password" });
        }

        const token = jwt.sign({ id: usuario.id }, SECRET_KEY, { expiresIn: "1h" });

        // Enviamos también los datos del usuario (excepto la contraseña)
        const { password: _, ...usuarioSinPassword } = usuario;
        res.json({ 
            mensaje: "Login exitoso", 
            message: "Login successful", 
            token,
            usuario: usuarioSinPassword
        });
    });
};
