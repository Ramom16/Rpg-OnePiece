import express from "express";
import { login, register, saveGame } from "../controller/controllers.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/save", authenticateToken, saveGame);

export default router;