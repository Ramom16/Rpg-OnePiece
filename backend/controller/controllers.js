import prisma from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Converte BigInt do Prisma para Number antes de responder com JSON
const formatPlayerResponse = (player) => {
    const { password, ...playerWithoutPassword } = player;
    return {
        ...playerWithoutPassword,
        bounty: Number(player.bounty),
        berries: Number(player.berries)
    };
};

// CADASTRO
export async function register(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: "Preencha usuário e senha!" });
    }

    try {
        const existingPlayer = await prisma.player.findUnique({
            where: { username }
        });

        if (existingPlayer) {
            return res.status(400).json({ msg: "Nome de pirata já em uso!" });
        }

        const hash = await bcrypt.hash(password, 10);

        await prisma.player.create({
            data: { username, password: hash, nickname: username }
        });

        res.status(201).json({ msg: "Pirata registrado com sucesso!" });

    } catch (err) {
        console.error("Erro no registro:", err);
        res.status(500).json({ msg: "Erro ao criar jogador." });
    }
}

// LOGIN (Gera JWT)
export async function login(req, res) {
    const { username, password } = req.body;

    try {
        const player = await prisma.player.findUnique({
            where: { username }
        });

        if (!player) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }

        const match = await bcrypt.compare(password, player.password);

        if (!match) {
            return res.status(401).json({ msg: "Senha incorreta." });
        }

        const token = jwt.sign(
            { id: player.id, username: player.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            player: formatPlayerResponse(player)
        });

    } catch (err) {
        console.error("Erro no login:", err);
        res.status(500).json({ msg: "Erro no servidor." });
    }
}

// SALVAR PROGRESSO (Protegido por JWT)
export async function saveGame(req, res) {
    const playerId = req.user.id;
    const { level, xp, hp, bounty, berries, fruit_name, weapon_name, accessory_name, haki, fruit_rolls, race, race_rolls, refine_weapon, refine_accessory, fruit_awakened, training_atk, training_hp, world_progress, nickname, unlocked_titles, equipped_title } = req.body;

    try {
        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: {
                level,
                xp,
                hp,
                bounty: bounty !== undefined ? BigInt(bounty) : undefined,
                berries: berries !== undefined ? BigInt(berries) : undefined,
                fruit_name,
                weapon_name,
                accessory_name,
                haki: haki !== undefined ? haki : undefined,
                race,
                race_rolls,
                refine_weapon,
                refine_accessory,
                fruit_awakened: fruit_awakened !== undefined ? Boolean(fruit_awakened) : undefined,
                training_atk,
                training_hp,
                fruit_rolls,
                world_progress: world_progress !== undefined ? Number(world_progress) : undefined,
                nickname: nickname !== undefined ? String(nickname).slice(0, 24) : undefined,
                unlocked_titles: Array.isArray(unlocked_titles) ? unlocked_titles : undefined,
                equipped_title: equipped_title !== undefined ? String(equipped_title) : undefined
            }
        });

        res.json({
            msg: "Progresso salvo com sucesso!",
            player: formatPlayerResponse(updatedPlayer)
        });

    } catch (err) {
        console.error("Erro ao salvar progresso:", err);
        res.status(500).json({ msg: "Erro ao salvar progresso." });
    }
}