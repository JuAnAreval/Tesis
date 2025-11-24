const db = require("../config/db");

const Usuario = {
    crear: (nombre, email, password, callback) => {
        const query = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
        db.query(query, [nombre, email, password], callback);
    },

    buscarPorEmail: (email, callback) => {
        const query = "SELECT * FROM usuarios WHERE email = ?";
        db.query(query, [email], callback);
    }
};

module.exports = Usuario;
