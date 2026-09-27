import React from "react";

// Identidade visual de cada mar: ícone temático + tom de cor aplicado via CSS
const WORLD_THEMES = {
  world1: { icon: "🌊", tone: "ocean" },
  world2: { icon: "⚔️", tone: "indigo" },
  world3: { icon: "👑", tone: "gold" },
};

const DEFAULT_THEME = { icon: "🌊", tone: "ocean" };

// Motivo de bloqueio exibido no card travado (aviso de chefê que libera o mar)
const DEFAULT_LOCK_HINT = "Derrote o chefê do mar anterior";

export default function WorldCard({ world, index, isActive, isLocked, progress, lockHint, onSelect }) {
  const theme = WORLD_THEMES[world.id] ?? DEFAULT_THEME;

  let badge = { icon: "🔓", label: "Desbloqueado", state: "" };
  if (isLocked) {
    badge = { icon: "🔒", label: `Requer Nível ${world.requiredLevel}`, state: "locked" };
  } else if (isActive) {
    badge = { icon: "📍", label: "Mar Atual", state: "active" };
  }

  const classNames = ["world-card", `world-card-${theme.tone}`];
  if (isActive) classNames.push("active");
  if (isLocked) classNames.push("locked");

  return (
    <button
      type="button"
      className={classNames.join(" ")}
      onClick={() => onSelect(index)}
      disabled={isLocked}
      aria-pressed={isActive}
      aria-label={`${world.name} — ${world.subtitle}, ${world.levels}${
        isLocked ? `, bloqueado: requer nível ${world.requiredLevel}` : ""
      }`}
    >
      <span className={`world-card-badge ${badge.state}`}>
        <span aria-hidden="true">{badge.icon}</span>
        {badge.label}
      </span>

      <span className="world-card-body">
        <span className="world-card-icon" aria-hidden="true">
          {theme.icon}
        </span>
        <span className="world-card-info">
          <strong className="world-card-name">{world.name}</strong>
          <span className="world-card-subtitle">{world.subtitle}</span>
          <span className="world-card-levels">{world.levels}</span>
          {isLocked && <span className="world-card-hint">{lockHint ?? DEFAULT_LOCK_HINT}</span>}
        </span>
      </span>

      <span className="world-card-progress">
        <span className="world-card-progress-info">
          <span>Progresso</span>
          <strong className="world-card-progress-value">{progress}%</strong>
        </span>
        <span className="world-card-progress-bar">
          <span className="world-card-progress-fill" style={{ width: `${progress}%` }} />
        </span>
      </span>
    </button>
  );
}
