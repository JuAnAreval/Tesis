const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Token no proporcionado', message: 'Token not provided' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // decoded has id, email, role, etc.
        next();
    } catch (err) {
        return res.status(401).json({ mensaje: 'Token inválido', message: 'Invalid token' });
    }
};

module.exports = { verifyToken };
