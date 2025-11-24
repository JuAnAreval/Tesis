const mysql = require("mysql2");

let connection;
try {
    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    connection.connect((err) => {
        if (err) {
            console.error("❌ Error al conectar a la base de datos:", err);
            // keep connection variable as-is; queries will error
            return;
        }
        console.log("✅ Conectado a MySQL");
    });
} catch (err) {
    // Catch synchronous errors (e.g., TCP wrap) so requiring this module doesn't throw
    console.error('❌ Exception creating DB connection:', err.message || err);
    connection = null;
}

if (!connection) {
    // Fallback shim so require('config/db') always returns an object with query
    console.warn('⚠️  Database connection not available. Exports a shimbed query() that returns an error.');
    module.exports = {
        query: function(sql, params, cb) {
            const err = new Error('Database not connected. Set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME or run tests against a test database.');
            if (typeof cb === 'function') {
                return cb(err);
            }
            return Promise.reject(err);
        }
    };
} else {
    module.exports = connection;
}
