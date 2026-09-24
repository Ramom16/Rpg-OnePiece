import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Espera formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ msg: "Acesso negado. Token não fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ msg: "Token inválido ou expirado." });
        }
        
        req.user = decodedUser; // Guarda { id, username } na requisição
        next();
    });
}