import React from "react";

export default function Navbar({ player, onLogout }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#1e293b", color: "#fff" }}>
      <div>
        <h2 style={{ margin: 0 }}>🏴‍☠️ {player.username}</h2>
        <small>Nível {player.level} | XP: {player.xp}</small>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <span>💰 Berries: <strong>{player.berries?.toLocaleString()}</strong></span>
        <span>☠️ Recompensa: <strong>{player.bounty?.toLocaleString()}</strong></span>
      </div>

      <button onClick={onLogout} style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}>
        Sair
      </button>
    </header>
  );
}