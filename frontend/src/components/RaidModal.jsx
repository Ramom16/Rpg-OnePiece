import React, { useState, useEffect, useRef, useCallback } from "react";
import { RACES } from "../data/races";

const END_DELAY = 1000;
const SPEEDS = [
  { label: "1x", ms: 2000 },
  { label: "2x", ms: 1000 },
  { label: "Instantâneo", ms: 300 },
];

export default function RaidModal({ player, raid, totalAtk, playerMaxHp, onVictory, onDefeat }) {
  const [waveIndex, setWaveIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(playerMaxHp ?? player.hp);
  const [enemyHp, setEnemyHp] = useState(raid.waves[0].hp);
  const [combatLog, setCombatLog] = useState(["☠️ Raid iniciada! Prepare-se para enfrentar todas as ondas."]);
  const [status, setStatus] = useState("waiting"); // waiting | player | enemy | finished
  const [result, setResult] = useState(null); // victory | defeat
  const [floats, setFloats] = useState([]);
  const [speed, setSpeed] = useState(() => {
    const saved = Number(localStorage.getItem("battleSpeed"));
    return SPEEDS.some((s) => s.ms === saved) ? saved : 2000;
  });
  const endedRef = useRef(false);
  const firstTurnRef = useRef(true);
  const floatIdRef = useRef(0);

  const currentWave = raid.waves[waveIndex];
  const waveHp = currentWave.hp;
  const waveAtk = currentWave.atk;
  const enemyName = currentWave.name;

  // HAKI: estado normalizado (compatível com saves antigos onde haki era boolean)
  const hakiState = player.haki && typeof player.haki === "object" ? player.haki : {};
  const hakiArm = !!hakiState.armamento;
  const hakiObs = !!hakiState.observacao;
  const hakiRei = !!hakiState.rei;

  // RAÇA: bônus passivos
  const raceInfo = RACES.find((r) => r.name === player.race) || RACES[0];
  const raceDodge = raceInfo.dodgeChance || 0;

  const selectSpeed = (ms) => {
    setSpeed(ms);
    localStorage.setItem("battleSpeed", String(ms));
  };

  // DANO FLUTUANTE (sobe e some em ~0.95s)
  const pushFloat = useCallback((side, text) => {
    const id = ++floatIdRef.current;
    setFloats((prev) => [...prev, { id, side, text }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 950);
  }, []);

  // ONDA LIMPA: cura entre rodadas ou vitória final
  const handleWaveClear = useCallback((waveName, dmgText) => {
    const isLast = waveIndex + 1 >= raid.waves.length;

    if (isLast) {
      setCombatLog((log) => [
        `🎉 RAID COMPLETA! Todos os chefes foram derrotados!`,
        `👑 ${waveName} derrotado (${dmgText} de dano)!`,
        `🏆 Recompensas: 💰 ${raid.rewardBerries.toLocaleString()} Berries · ⭐ ${raid.rewardXp} XP · 🎲 +${raid.rewardRaceRolls} giro(s) de raça`,
        ...log,
      ]);
      setStatus("finished");
      setResult("victory");
      return;
    }

    const heal = Math.floor(playerMaxHp * 0.5);
    const nextWave = raid.waves[waveIndex + 1];

    setPlayerHp(Math.min(playerMaxHp, playerHp + heal));
    setCombatLog((log) => [
      `✅ ${waveName} derrotado!`,
      `❤️ [Intervalo] Você recuperou 50% de HP para a próxima rodada!`,
      `☠️ Próxima rodada: ${nextWave.name} − HP ${nextWave.hp} · ATK ${nextWave.atk}`,
      ...log,
    ]);
    setWaveIndex(waveIndex + 1);
    setEnemyHp(nextWave.hp);
    setStatus("enemy");
  }, [waveIndex, playerHp, playerMaxHp, raid]);

  // LOOP DE COMBATE AUTOMÁTICO DA RAID
  useEffect(() => {
    if (status === "finished") return;

    const timer = setTimeout(() => {
      if (status === "waiting" || status === "player") {
        // 👑 HAKI DO REI: sorteio de 30% apenas no 1º turno da batalha
        if (hakiRei && firstTurnRef.current) {
          firstTurnRef.current = false;
          if (Math.random() < 0.3) {
            const conquerorDamage = Math.floor(waveHp * 0.2);
            const newEnemyHp = Math.max(0, enemyHp - conquerorDamage);
            setEnemyHp(newEnemyHp);
            pushFloat("enemy", `-${conquerorDamage}`);

            if (newEnemyHp <= 0) {
              handleWaveClear(enemyName, `${conquerorDamage} de Dano de Conquistador`);
              return;
            }

            setCombatLog((log) => [
              `👑 [Haki do Rei] A presença do Conquistador atordoou ${enemyName}!`,
              `💥 Dano de Conquistador: ${conquerorDamage} de dano! O inimigo perdeu o turno de ataque.`,
              ...log,
            ]);
            setStatus("player");
            return;
          }
        }

        let damage = Math.floor(totalAtk * (0.8 + Math.random() * 0.4));
        if (hakiArm) damage = Math.floor(damage * 1.25);
        const newEnemyHp = Math.max(0, enemyHp - damage);
        setEnemyHp(newEnemyHp);
        pushFloat("enemy", `-${damage}`);

        if (newEnemyHp <= 0) {
          handleWaveClear(enemyName, String(damage));
          return;
        }

        const attackLog = hakiArm
          ? `⚔️ Você atacou e causou ${damage} de dano! (🖤 Armamento +25%)`
          : `⚔️ Você atacou e causou ${damage} de dano!`;
        setCombatLog((log) => [attackLog, ...log]);
        setStatus("enemy");
      } else {
        // 💨 ESQUIVA NATURAL DA RAÇA
        if (raceDodge > 0 && Math.random() * 100 < raceDodge) {
          setCombatLog((log) => [`💨 [Esquiva - ${raceInfo.name}] Você desviou do ataque!`, ...log]);
          setStatus("player");
          return;
        }

        // 👁️ HAKI DA OBSERVAÇÃO: 20% de chance de Esquiva Perfeita
        if (hakiObs && Math.random() < 0.2) {
          setCombatLog((log) => [`👁️ [Observação] Você previu o movimento e esquivou do ataque!`, ...log]);
          setStatus("player");
          return;
        }

        let damage = Math.floor(waveAtk * (0.8 + Math.random() * 0.4));
        if (hakiArm) damage = Math.floor(damage * 0.85);
        const newPlayerHp = Math.max(0, playerHp - damage);
        setPlayerHp(newPlayerHp);
        pushFloat("player", `-${damage}`);

        if (newPlayerHp <= 0) {
          setCombatLog((log) => [`☠️ Você foi derrotado...`, `💥 ${enemyName} causou ${damage} de dano em você!`, ...log]);
          setStatus("finished");
          setResult("defeat");
          return;
        }

        const damageLog = hakiArm
          ? `💥 Você recebeu ${damage} de dano! (🖤 Armamento −15%)`
          : `💥 Você recebeu ${damage} de dano!`;
        setCombatLog((log) => [damageLog, ...log]);
        setStatus("player");
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [status, speed, totalAtk, waveAtk, enemyHp, playerHp, pushFloat, hakiArm, hakiObs, hakiRei, raceDodge, raceInfo, waveHp, enemyName, playerMaxHp, waveIndex, raid, handleWaveClear]);

  // FIM DA BATALHA: aguarda 1 segundo e executa o callback correspondente
  useEffect(() => {
    if (status !== "finished" || endedRef.current) return;

    const endTimer = setTimeout(() => {
      endedRef.current = true;
      if (result === "victory") onVictory(raid);
      else onDefeat();
    }, END_DELAY);

    return () => clearTimeout(endTimer);
  }, [status, result, raid, onVictory, onDefeat]);

  const turnLabel =
    status === "waiting" ? "⏳ Aguardando..." :
    status === "player" ? "⚔️ Seu turno..." :
    status === "enemy" ? "💥 Turno do Inimigo..." : "";

  const statusColor =
    status === "player" ? "#14532d" :
    status === "enemy" ? "#7f1d1d" : "#1e3a8a";

  const renderFloats = (side) =>
    floats
      .filter((f) => f.side === side)
      .map((f, i) => (
        <span key={f.id} className="float-damage" style={{ left: `calc(50% + ${(i % 3) * 26 - 26}px)` }}>
          {f.text}
        </span>
      ));

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }}>
      <div style={{ backgroundColor: "#0f172a", color: "#fff", padding: "25px", borderRadius: "10px", maxWidth: "680px", width: "92%", textAlign: "center" }}>
        <h2>☠️ Raid: {raid.title}</h2>
        <p style={{ fontSize: "13px", opacity: 0.8, margin: "6px 0" }}>
          Onda {waveIndex + 1}/{raid.waves.length} · Recompensa: 💰 {raid.rewardBerries.toLocaleString()} Berries · ⭐ {raid.rewardXp} XP · 🎲 +{raid.rewardRaceRolls} giro(s) de raça
        </p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", margin: "12px 0" }}>
          <span style={{ fontSize: "13px", opacity: 0.8 }}>⚡ Velocidade:</span>
          {SPEEDS.map((s) => (
            <button
              key={s.ms}
              onClick={() => selectSpeed(s.ms)}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                borderRadius: "5px",
                cursor: "pointer",
                backgroundColor: speed === s.ms ? "#eab308" : "#334155",
                color: speed === s.ms ? "#000" : "#fff",
                border: "none",
                fontWeight: "bold",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", margin: "18px 0" }}>
          <div style={{ flex: 1, position: "relative", backgroundColor: "#1e293b", borderRadius: "8px", padding: "14px" }}>
            {renderFloats("player")}
            <h4>🏴‍☠️ {player.username}</h4>
            <p>❤️ Vida: {playerHp}/{playerMaxHp ?? player.hp}</p>
            <p>⚔️ Ataque Total: {totalAtk}</p>
          </div>
          <div style={{ flex: 1, position: "relative", backgroundColor: "#1e293b", borderRadius: "8px", padding: "14px" }}>
            {renderFloats("enemy")}
            <h4>👹 {enemyName}</h4>
            <p>❤️ Vida: {enemyHp}/{waveHp}</p>
            <p>⚔️ Ataque: {waveAtk}</p>
          </div>
        </div>

        <div
          style={{
            margin: "15px 0",
            padding: "12px",
            borderRadius: "5px",
            fontWeight: "bold",
            fontSize: "16px",
            backgroundColor: statusColor,
            color: "#fff",
          }}
        >
          {status === "finished" ? (result === "victory" ? "🎉 Raid Concluída!" : "☠️ Raid Falhou...") : turnLabel}
        </div>

        <div style={{ marginTop: "20px", height: "140px", overflowY: "auto", border: "1px solid #334155", padding: "10px", textAlign: "left", fontSize: "14px", backgroundColor: "#1e293b" }}>
          {combatLog.map((log, index) => (
            <p key={index} style={{ margin: "3px 0" }}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}