import React, { useState, useEffect, useRef, useCallback } from "react";

const END_DELAY = 1000;
const SPEEDS = [
  { label: "1x", ms: 2000 },
  { label: "2x", ms: 1000 },
  { label: "Instantâneo", ms: 300 },
];

export default function CombatModal({ player, enemy, totalAtk, playerMaxHp, onVictory, onDefeat }) {
  const [playerHp, setPlayerHp] = useState(playerMaxHp ?? player.hp);
  const [enemyHp, setEnemyHp] = useState(enemy.enemyHp || enemy.hp);
  const [combatLog, setCombatLog] = useState(["Batalha iniciada!"]);
  const [status, setStatus] = useState("waiting"); // waiting | player | enemy | finished
  const [result, setResult] = useState(null); // victory | defeat
  const [floats, setFloats] = useState([]);
  const [speed, setSpeed] = useState(() => {
    const saved = Number(localStorage.getItem("battleSpeed"));
    return SPEEDS.some((s) => s.ms === saved) ? saved : 2000;
  });
  const endedRef = useRef(false);
  const floatIdRef = useRef(0);

  const enemyMaxHp = enemy.enemyHp || enemy.hp;
  const enemyAtk = enemy.enemyAtk || enemy.atk;

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

  // LOOP DE COMBATE AUTOMÁTICO: joga primeiro, depois inimigo, alternando a cada cooldown
  useEffect(() => {
    if (status === "finished") return;

    const timer = setTimeout(() => {
      if (status === "waiting" || status === "player") {
        const damage = Math.floor(totalAtk * (0.8 + Math.random() * 0.4));
        const newEnemyHp = Math.max(0, enemyHp - damage);
        setEnemyHp(newEnemyHp);
        pushFloat("enemy", `-${damage}`);

        if (newEnemyHp <= 0) {
          setCombatLog((log) => [`🎉 Vitória espetacular!`, `⚔️ Você atacou e causou ${damage} de dano!`, ...log]);
          setStatus("finished");
          setResult("victory");
          return;
        }

        setCombatLog((log) => [`⚔️ Você atacou e causou ${damage} de dano!`, ...log]);
        setStatus("enemy");
      } else {
        const damage = Math.floor(enemyAtk * (0.8 + Math.random() * 0.4));
        const newPlayerHp = Math.max(0, playerHp - damage);
        setPlayerHp(newPlayerHp);
        pushFloat("player", `-${damage}`);

        if (newPlayerHp <= 0) {
          setCombatLog((log) => [`☠️ Você foi derrotado!`, `💥 O inimigo causou ${damage} de dano em você!`, ...log]);
          setStatus("finished");
          setResult("defeat");
          return;
        }

        setCombatLog((log) => [`💥 Você recebeu ${damage} de dano!`, ...log]);
        setStatus("player");
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [status, speed, totalAtk, enemyAtk, enemyHp, playerHp, pushFloat]);

  // FIM DA BATALHA: aguarda 1 segundo e executa o callback correspondente
  useEffect(() => {
    if (status !== "finished" || endedRef.current) return;

    const endTimer = setTimeout(() => {
      endedRef.current = true;
      if (result === "victory") onVictory(enemy);
      else onDefeat();
    }, END_DELAY);

    return () => clearTimeout(endTimer);
  }, [status, result, enemy, onVictory, onDefeat]);

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
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ backgroundColor: "#0f172a", color: "#fff", padding: "25px", borderRadius: "10px", maxWidth: "640px", width: "90%", textAlign: "center" }}>
        <h2>⚔️ Combate: {enemy.title || enemy.name}</h2>

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
            <h4>👹 {enemy.title || enemy.name}</h4>
            <p>❤️ Vida: {enemyHp}/{enemyMaxHp}</p>
            <p>⚔️ Ataque: {enemyAtk}</p>
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
          {status === "finished" ? (result === "victory" ? "🎉 Vitória!" : "☠️ Derrota...") : turnLabel}
        </div>

        <div style={{ marginTop: "20px", height: "120px", overflowY: "auto", border: "1px solid #334155", padding: "10px", textAlign: "left", fontSize: "14px", backgroundColor: "#1e293b" }}>
          {combatLog.map((log, index) => (
            <p key={index} style={{ margin: "3px 0" }}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}