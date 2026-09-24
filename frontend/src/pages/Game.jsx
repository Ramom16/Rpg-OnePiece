import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import CombatModal from "../components/CombatModal";
import QuizModal from "../components/QuizModal";
import { WORLDS, SIDE_QUESTS, LEGENDARY_WEAPON_QUESTS } from "../data/quests";
import { WEAPONS } from "../data/weapons";
import { FRUITS } from "../data/fruits";
import { ACCESSORIES } from "../data/accessories";
import API from "../services/api";

const MAX_LEVEL = 50;
const xpToNext = (level) => 100 + level * 20;

const SEA_ORDER = ["Mundo 1", "Mundo 2", "Mundo 3"];

// COMPARADOR DE STATUS ENTRE ITEM DA LOJA E ITEM EQUIPADO
function StatDiff({ label, diff, unit }) {
  if (diff === 0) {
    return <span style={{ color: "var(--text-muted)", fontWeight: "bold" }}>{label}: 0 {unit}</span>;
  }
  const better = diff > 0;
  return (
    <span style={{ color: better ? "var(--accent-green)" : "#f87171", fontWeight: "bold" }}>
      {label}: {better ? `+${diff}` : diff} {unit}
    </span>
  );
}

// Sorteio (impuro) isolado no escopo do módulo — fora do corpo do componente
function pickRandomFruit() {
  const idx = Math.floor(Math.random() * FRUITS.length);
  return FRUITS[idx];
}

const CONFETTI_COLORS = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#eab308", "#ec4899"];

function makeConfettiPieces(count = 130) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.8,
    duration: 2.5 + Math.random() * 1.8,
  }));
}

export default function Game({ player, setPlayer, onLogout }) {
  const [activeTab, setActiveTab] = useState("story");
  const [activeWorld, setActiveWorld] = useState(0);
  const [expandedIsland, setExpandedIsland] = useState(WORLDS[0].islands[0].id);
  const [activeCombat, setActiveCombat] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [message, setMessage] = useState("");

  // ESTADOS DA ROLETA DE AKUMA NO MI
  const [confirmReroll, setConfirmReroll] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [gachaAnimKey, setGachaAnimKey] = useState(0);

  // AUTO-SAVE SILENCIOSO
  const [savedFlash, setSavedFlash] = useState(false);
  const savedFlashTimerRef = useRef(null);

  // ESTADOS DA NOTIFICAÇÃO DE LEVEL UP
  const [levelToast, setLevelToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Função para acionar o Toast sobrescrevendo o anterior
  const triggerLevelToast = (newLevel, extraRolls = 0) => {
    // Se houver um timer rodando, cancela imediatamente
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Sobrescreve a notificação atual
    const rollText = extraRolls > 0 ? ` · +${extraRolls} giro(s) de fruta!` : "";
    setLevelToast(`🎉 Nível ${newLevel} Alcançado!${rollText}`);

    // Inicia um novo contador de 3 segundos
    toastTimeoutRef.current = setTimeout(() => {
      setLevelToast(null);
    }, 3000);
  };

  const currentWeapon = WEAPONS.find((w) => w.name === player.weapon_name);
  const currentFruit = FRUITS.find((f) => f.name === player.fruit_name);
  const currentAccessory = ACCESSORIES.find((a) => a.name === player.accessory_name);

  const weaponAtk = currentWeapon ? currentWeapon.atk : 0;
  const fruitAtk = currentFruit ? currentFruit.bonusAtk : 0;
  const fruitBonusHp = currentFruit ? currentFruit.bonusHp : 0;
  const accessoryBonusHp = currentAccessory ? currentAccessory.bonusHp : 0;
  const accessoryWeaponBoost = currentAccessory ? currentAccessory.weaponAtkBoost : 0;
  const accessoryFruitBoost = currentAccessory ? currentAccessory.fruitAtkBoost : 0;
  const totalAtk = 20 + player.level * 5 + weaponAtk + accessoryWeaponBoost + fruitAtk + accessoryFruitBoost;
  const totalHp = 100 + player.level * 10 + fruitBonusHp + accessoryBonusHp;

  // ============ NAVEGAÇÃO ENTRE MUNDOS (BLOX FRUITS) ============
  const worldProgress = player.world_progress || 1;
  const world2Unlocked = player.level >= 15 && worldProgress >= 2;
  const world3Unlocked = player.level >= 30 && worldProgress >= 3;

  const canAccessWorld = (worldIndex) => {
    if (worldIndex === 0) return true;
    if (worldIndex === 1) return world2Unlocked;
    if (worldIndex === 2) return world3Unlocked;
    return false;
  };

  const selectWorld = (worldIndex) => {
    const world = WORLDS[worldIndex];
    if (!canAccessWorld(worldIndex)) {
      alert(
        world.id === "world2"
          ? "🌊 Mundo 2 bloqueado! Alcance o Nível 15 e derrote Doflamingo em Dressrosa."
          : "🌊 Mundo 3 bloqueado! Alcance o Nível 30 e derrote Kaido em Wano."
      );
      return;
    }
    setActiveWorld(worldIndex);
    setExpandedIsland(world.islands[0].id);
  };

  // AUTO-SAVE: grava no localStorage + API em background e mostra o ícone 💾 por 2s
  const persistPlayer = (nextPlayer) => {
    try {
      localStorage.setItem("minirpg_save", JSON.stringify(nextPlayer));
    } catch {
      // armazenamento indisponível — ignora
    }
    API.post("/save", nextPlayer).catch(() => {
      // salvamento automático em background; falhas silenciosas
    });

    setSavedFlash(true);
    if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    savedFlashTimerRef.current = setTimeout(() => setSavedFlash(false), 2000);
  };

  const startQuest = (island, quest) => {
    if (player.level < island.minLevel) {
      alert(`Você precisa ser Nível ${island.minLevel} para acessar ${island.name}!`);
      return;
    }
    setActiveCombat({ ...quest, islandName: island.name });
  };

  const startLegendaryQuest = (quest) => {
    if (player.level < quest.minLevel) {
      alert(`Nível insuficiente! Requer Nível ${quest.minLevel}.`);
      return;
    }
    setActiveQuiz(quest);
  };

  const handleVictory = (enemy) => {
    setActiveCombat(null);

    let newBerries = player.berries + (enemy.rewardBerries || 1000);
    let newXp = player.xp + (enemy.rewardXp || 100);
    let newLevel = player.level;
    let newBounty = player.bounty + (enemy.rewardBerries ? enemy.rewardBerries * 2 : 5000);
    let newWeapon = player.weapon_name;
    let newFruitRolls = player.fruit_rolls;
    let newWorldProgress = player.world_progress || 1;

    if (enemy.weaponReward) {
      const rewardWeaponObj = WEAPONS.find((w) => w.id === enemy.weaponReward);
      if (rewardWeaponObj) {
        newWeapon = rewardWeaponObj.name;
        alert(`🏆 Você obteve a lendária espada: ${rewardWeaponObj.name}!`);
      }
    }

    // LEVEL UP: custo = 100 + nívelAtual*20. Cada nível dá +1 giro de fruta.
    let levelsGained = 0;
    while (newLevel < MAX_LEVEL && newXp >= xpToNext(newLevel)) {
      newXp -= xpToNext(newLevel);
      newLevel += 1;
      levelsGained += 1;
      newFruitRolls += 1;
    }

    if (levelsGained > 0) {
      triggerLevelToast(newLevel, levelsGained); // Dispara a notificação sem travar a tela
    }

    // DESBLOQUEIO DE MUNDOS (DERROTAR O CHEFE FINAL DA ILHA)
    if (enemy.unlockWorld && newWorldProgress < enemy.unlockWorld) {
      newWorldProgress = enemy.unlockWorld;
      const unlocked = WORLDS[enemy.unlockWorld - 1];
      alert(`🌊 ${unlocked.name} (${unlocked.subtitle}) desbloqueado! Navegue para explorá-lo.`);
    }

    if (enemy.finalBoss) {
      alert("🏆 PARABÉNS! Você derrotou o Lorde Supremo de Elbaf e ZEROU o RPG One Piece!");
    }

    const nextPlayer = {
      ...player,
      level: newLevel,
      xp: newXp,
      berries: newBerries,
      bounty: newBounty,
      weapon_name: newWeapon,
      fruit_rolls: newFruitRolls,
      world_progress: newWorldProgress,
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
  };

  const buyWeapon = (weapon) => {
    if (player.berries < weapon.price) {
      alert("Berries insuficientes para comprar esta espada!");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - weapon.price,
      weapon_name: weapon.name,
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    alert(`Você comprou e equipou a espada ${weapon.name}!`);
  };

  const triggerConfetti = () => {
    setConfetti(makeConfettiPieces());
    setTimeout(() => setConfetti([]), 5200);
  };

  const doRollFruit = () => {
    if (player.fruit_rolls <= 0) {
      setMessage("❌ Você não tem giros de fruta restantes!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const rolledFruit = pickRandomFruit();

    const nextPlayer = {
      ...player,
      fruit_rolls: player.fruit_rolls - 1,
      fruit_name: rolledFruit.name,
      hp: 100 + player.level * 10 + rolledFruit.bonusHp + accessoryBonusHp,
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);

    setGachaAnimKey((k) => k + 1);

    if (rolledFruit.rarity === "Lendária") {
      triggerConfetti();
    }
  };

  const handleSpinClick = () => {
    if (player.fruit_rolls <= 0) {
      setMessage("❌ Você não tem giros de fruta restantes!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const equipped = FRUITS.find((f) => f.name === player.fruit_name);
    if (equipped && equipped.rarity === "Lendária") {
      setConfirmReroll(true);
      return;
    }

    doRollFruit();
  };

  const buyAccessory = (accessory) => {
    if (player.berries < accessory.price) {
      alert("Berries insuficientes para comprar este acessório!");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - accessory.price,
      accessory_name: accessory.name,
      hp: 100 + player.level * 10 + fruitBonusHp + accessory.bonusHp,
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    alert(`Você comprou e equipou o acessório ${accessory.name}!`);
  };

  const activeWorldData = WORLDS[activeWorld];

  // ==== BARRA DE PROGRESSO DA JORNADA (MUNDO ATUAL) ====
  const reachableCount = activeWorldData.islands.filter((i) => player.level >= i.minLevel).length;
  const activeIslandIdx = Math.max(0, reachableCount - 1);
  const activeIsland = activeWorldData.islands[activeIslandIdx];
  const nextIsland = activeWorldData.islands[activeIslandIdx + 1];
  let islandFraction = 1;
  if (nextIsland && nextIsland.minLevel > activeIsland.minLevel) {
    islandFraction = Math.min(1, Math.max(0, (player.level - activeIsland.minLevel) / (nextIsland.minLevel - activeIsland.minLevel)));
  }
  const islandProgress = activeIslandIdx + islandFraction;
  const worldPct = Math.round((islandProgress / activeWorldData.islands.length) * 100);
  const missionIdx = Math.min(3, Math.floor(islandFraction * 3) + 1);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar player={player} onLogout={onLogout} />

      {message && (
        <div style={{ backgroundColor: "var(--accent-blue)", padding: "10px", textAlign: "center", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <div className="game-container">
        <div className="progress-journey">
          <div className="progress-journey-info">
            <span>
              📍 {activeWorldData.name}: Ilha {activeIslandIdx + 1}/{activeWorldData.islands.length} ({activeIsland.name} - Missão {missionIdx} de 3)
            </span>
            <strong>{worldPct}%</strong>
          </div>
          <div className="progress-journey-bar">
            <div className="progress-journey-fill" style={{ width: `${worldPct}%` }} />
          </div>
        </div>

        <div className="equipment-panel">
          <div>
            <span>⚔️ Espada: </span>
            <strong>{player.weapon_name || "Nenhuma"}</strong>
            <small style={{ color: "var(--accent-green)", marginLeft: "8px" }}>
              (+{weaponAtk} ATK)
            </small>
          </div>
          <div>
            <span>🥭 Akuma no Mi: </span>
            <strong>{player.fruit_name || "Nenhuma"}</strong>
            <small style={{ color: "var(--accent-green)", marginLeft: "8px" }}>
              (+{fruitAtk} ATK)
            </small>
          </div>
          <div>
            <span>💍 Acessório: </span>
            <strong>{player.accessory_name || "Nenhum"}</strong>
            <small style={{ color: "var(--accent-green)", marginLeft: "8px" }}>
              (+{accessoryBonusHp} HP)
            </small>
          </div>
          <div>
            <span>❤️ Vida Total: </span>
            <strong style={{ color: "var(--accent-green)" }}>{totalHp}</strong>
          </div>
          <div>
            <span>🔥 Ataque Total: </span>
            <strong style={{ color: "var(--accent-gold)" }}>{totalAtk}</strong>
          </div>
          <div>
            <span>🎲 Giros: </span>
            <strong>{player.fruit_rolls}</strong>
          </div>
        </div>

        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "story" ? "active" : ""}`}
            onClick={() => setActiveTab("story")}
          >
            🌍 Explorar Mares
          </button>
          <button
            className={`tab-button ${activeTab === "side" ? "active" : ""}`}
            onClick={() => setActiveTab("side")}
          >
            💰 Caças
          </button>
          <button
            className={`tab-button ${activeTab === "legendary" ? "active" : ""}`}
            onClick={() => setActiveTab("legendary")}
          >
            ⚔️ Armas Lendárias
          </button>
          <button
            className={`tab-button ${activeTab === "shop" ? "active" : ""}`}
            onClick={() => setActiveTab("shop")}
          >
            🛒 Loja de Espadas
          </button>
          <button
            className={`tab-button ${activeTab === "accessories" ? "active" : ""}`}
            onClick={() => setActiveTab("accessories")}
          >
            💍 Loja de Acessórios
          </button>
          <button
            className={`tab-button ${activeTab === "gacha" ? "active" : ""}`}
            onClick={() => setActiveTab("gacha")}
          >
            🎲 Roleta de Frutas
          </button>
        </div>

        {/* =================== EXPLORAR MARES (MUNDOS + ILHAS) =================== */}
        {activeTab === "story" && (
          <div>
            <h3 style={{ marginBottom: "15px" }}>🗺️ Escolha o seu Mar e navegue entre as ilhas</h3>

            <div className="world-selector">
              {WORLDS.map((world, idx) => {
                const locked = !canAccessWorld(idx);
                return (
                  <button
                    key={world.id}
                    className={`world-card ${activeWorld === idx ? "active" : ""} ${locked ? "locked" : ""}`}
                    onClick={() => selectWorld(idx)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong>{world.name}</strong>
                      <span>·</span>
                      <span>{world.subtitle}</span>
                      {locked && <span>🔒</span>}
                    </div>
                    <small style={{ opacity: 0.75 }}>{world.levels}</small>
                    {locked && (
                      <small style={{ display: "block", marginTop: "6px", color: "var(--accent-gold)" }}>
                        {world.id === "world2" ? "Requer Nível 15 + derrotar Doflamingo" : "Requer Nível 30 + derrotar Kaido"}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>

            <h4 style={{ margin: "20px 0 10px 0", color: "var(--accent-gold)" }}>
              {activeWorldData.name} · {activeWorldData.subtitle} — Ilhas
            </h4>

            {activeWorldData.islands.map((island, iIdx) => {
              const isExpanded = expandedIsland === island.id;
              const reachable = player.level >= island.minLevel;
              return (
                <div key={island.id} className={`island-card ${isExpanded ? "expanded" : ""}`}>
                  <div className="island-header" onClick={() => setExpandedIsland(isExpanded ? null : island.id)}>
                    <div>
                      <h4 style={{ margin: 0 }}>
                        🏝️ {iIdx + 1}. {island.name}
                        <small style={{ color: "var(--text-muted)", marginLeft: "10px" }}>{island.area}</small>
                      </h4>
                      <small style={{ color: "var(--text-muted)" }}>
                        Nível mín. {island.minLevel} · 3 missões
                        {!reachable && <strong style={{ color: "var(--accent-gold)" }}> 🔒</strong>}
                      </small>
                    </div>
                    <span className="island-toggle">{isExpanded ? "▾" : "▸"}</span>
                  </div>

                  {isExpanded && (
                    <div className="island-quests">
                      {island.quests.map((quest, qIdx) => (
                        <div key={quest.id} className={`quest-card ${quest.isBoss ? "legendary" : ""}`}>
                          <div>
                            <h4>
                              <span className="quest-number">{quest.type === "Chefe" || quest.type === "Chefe Final" ? "👑" : qIdx + 1}</span>{" "}
                              {quest.title}
                            </h4>
                            <small style={{ color: "var(--text-muted)" }}>
                              <strong>{quest.type}</strong> · 🛡️ {quest.enemyHp} HP · ⚔️ {quest.enemyAtk} ATK
                              <br />
                              Recompensa: 💰 {quest.rewardBerries.toLocaleString()} Berries · ⭐ {quest.rewardXp} XP
                            </small>
                          </div>
                          <button
                            onClick={() => startQuest(island, quest)}
                            style={{
                              backgroundColor: quest.isBoss ? "var(--accent-gold)" : "var(--accent-green)",
                              color: "#000",
                            }}
                          >
                            {quest.isBoss ? "Enfrentar Chefe" : "Batalhar"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* =================== CAÇAS (SECUNDÁRIAS) =================== */}
        {activeTab === "side" && (
          <div>
            <h3 style={{ marginBottom: "15px" }}>Trabalhos e Caças de Recompensa (repetíveis)</h3>
            {SIDE_QUESTS.map((q) => (
              <div key={q.id} className="quest-card">
                <div>
                  <h4>{q.title}</h4>
                  <small style={{ color: "var(--text-muted)" }}>
                    {q.sea} · Nível Mínimo: {q.minLevel} | Recompensa: 💰 {q.rewardBerries.toLocaleString()} Berries · ⭐ {q.rewardXp} XP
                  </small>
                </div>
                <button
                  onClick={() => startQuest({ minLevel: q.minLevel, name: q.title }, q)}
                  style={{ backgroundColor: "var(--accent-blue)", color: "#fff" }}
                >
                  Iniciar Caça
                </button>
              </div>
            ))}
          </div>
        )}

        {/* =================== ARMAS LENDÁRIAS =================== */}
        {activeTab === "legendary" && (
          <div>
            <h3 style={{ marginBottom: "15px" }}>Provas do Conhecimento e Força (Quiz + Chefão)</h3>
            {LEGENDARY_WEAPON_QUESTS.map((q) => (
              <div key={q.id} className="quest-card legendary">
                <div>
                  <h4 style={{ color: "var(--accent-gold)" }}>{q.title}</h4>
                  <small style={{ color: "var(--text-muted)" }}>
                    {q.sea} · Nível Mínimo: {q.minLevel} | Oponente: {q.boss.name}
                  </small>
                </div>
                <button
                  onClick={() => startLegendaryQuest(q)}
                  style={{ backgroundColor: "var(--accent-gold)", color: "#000" }}
                >
                  Desafiar Prova
                </button>
              </div>
            ))}
          </div>
        )}

        {/* =================== LOJA DE ESPADAS (POR MAR) =================== */}
        {activeTab === "shop" && (
          <div>
            <h3 style={{ marginBottom: "15px" }}>🛒 Loja de Espadas</h3>
            {SEA_ORDER.map((sea) => {
              const seaWeapons = WEAPONS.filter((w) => w.price && w.sea === sea);
              if (!seaWeapons.length) return null;
              return (
                <div key={sea} style={{ marginBottom: "25px" }}>
                  <h4 style={{ color: "var(--accent-purple)", marginBottom: "10px" }}>🌊 {sea}</h4>
                  <div className="shop-grid">
                    {seaWeapons.map((weapon) => (
                      <div key={weapon.id} className={`card ${weapon.rarity === "Lendária" ? "card-legendary" : ""}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <h4>{weapon.name}</h4>
                          <span className={`badge badge-${weapon.rarity.toLowerCase()}`}>
                            {weapon.rarity}
                          </span>
                        </div>
                        <p style={{ fontSize: "14px" }}>Ataque: +{weapon.atk}</p>
                        <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                          <StatDiff label="Dano" diff={weapon.atk - weaponAtk} unit="ATK" />
                        </div>
                        <p style={{ color: "var(--accent-gold)", margin: "10px 0", fontWeight: "bold" }}>
                          💰 {weapon.price.toLocaleString()} Berries
                        </p>
                        <button
                          onClick={() => buyWeapon(weapon)}
                          style={{ width: "100%", backgroundColor: "var(--accent-blue)", color: "#fff" }}
                        >
                          Comprar Espada
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================== LOJA DE ACESSÓRIOS (POR MAR) =================== */}
        {activeTab === "accessories" && (
          <div>
            <h3 style={{ marginBottom: "5px" }}>💍 Loja de Acessórios</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
              Equipe um acessório para ganhar bônus de vida (HP), dano de espada e/ou poder de Akuma no Mi.
            </p>
            {SEA_ORDER.map((sea) => {
              const seaAccessories = ACCESSORIES.filter((a) => a.sea === sea);
              if (!seaAccessories.length) return null;
              return (
                <div key={sea} style={{ marginBottom: "25px" }}>
                  <h4 style={{ color: "var(--accent-purple)", marginBottom: "10px" }}>🌊 {sea}</h4>
                  <div className="shop-grid">
                    {seaAccessories.map((accessory) => (
                      <div key={accessory.id} className={`card ${accessory.rarity === "Lendária" ? "card-legendary" : ""}`}>
                        {accessory.image && (
                          <img
                            src={accessory.image}
                            alt={accessory.name}
                            referrerPolicy="no-referrer"
                            style={{ width: "70px", height: "70px", objectFit: "contain", margin: "0 auto 10px auto", display: "block" }}
                            onError={(e) => { e.target.style.visibility = "hidden"; }}
                          />
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <h4>{accessory.name}</h4>
                          <span className={`badge badge-${accessory.rarity.toLowerCase()}`}>
                            {accessory.rarity}
                          </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px", minHeight: "40px", lineHeight: "1.4" }}>
                          {accessory.description}
                        </p>
                        <p style={{ fontSize: "14px", color: "var(--accent-green)" }}>
                          +{accessory.bonusHp} HP{accessory.weaponAtkBoost > 0 && ` | +${accessory.weaponAtkBoost} ATK (Espada)`}{accessory.fruitAtkBoost > 0 && ` | +${accessory.fruitAtkBoost} ATK (Fruta)`}
                        </p>
                        <div style={{ fontSize: "13px", marginBottom: "4px", display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                          <StatDiff label="Vida" diff={accessory.bonusHp - accessoryBonusHp} unit="HP" />
                          <StatDiff
                            label="ATK"
                            diff={accessory.weaponAtkBoost + accessory.fruitAtkBoost - (accessoryWeaponBoost + accessoryFruitBoost)}
                            unit="ATK"
                          />
                        </div>
                        <p style={{ color: "var(--accent-gold)", margin: "10px 0", fontWeight: "bold" }}>
                          💰 {accessory.price.toLocaleString()} Berries
                        </p>
                        <button
                          onClick={() => buyAccessory(accessory)}
                          style={{ width: "100%", backgroundColor: "var(--accent-purple)", color: "#fff" }}
                        >
                          Comprar Acessório
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =================== ROLETA DE FRUTAS =================== */}
        {activeTab === "gacha" && (
          <div className="gacha-container">
            <h3>🎲 Roleta da Árvore de Akuma no Mi</h3>
            <p style={{ color: "var(--text-muted)", margin: "8px 0" }}>
              Obtenha frutos lendários com foto, descrição e bônus de atributos!
            </p>

            {currentFruit ? (
              <div key={gachaAnimKey} className="card card-legendary fruit-reveal" style={{ maxWidth: "360px", margin: "25px auto", textAlign: "center" }}>
                <img
                  src={currentFruit.image}
                  alt={currentFruit.name}
                  referrerPolicy="no-referrer"
                  style={{ width: "130px", height: "130px", objectFit: "contain", margin: "0 auto 10px auto", display: "block" }}
                />
                <h4 style={{ fontSize: "18px" }}>{currentFruit.name}</h4>
                <div style={{ margin: "8px 0" }}>
                  <span className={`badge badge-${currentFruit.rarity.toLowerCase()}`}>
                    {currentFruit.type} - {currentFruit.rarity}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "10px 0", lineHeight: "1.4" }}>
                  {currentFruit.description}
                </p>
                <div style={{ color: "var(--accent-green)", fontWeight: "bold", fontSize: "14px" }}>
                  +{currentFruit.bonusAtk} ATK | +{currentFruit.bonusHp} HP
                </div>
              </div>
            ) : (
              <div className="card" style={{ maxWidth: "360px", margin: "25px auto" }}>
                <p style={{ color: "var(--text-muted)" }}>Você ainda não ingeriu nenhuma Akuma no Mi.</p>
              </div>
            )}

            <button
              onClick={handleSpinClick}
              style={{
                padding: "14px 28px",
                fontSize: "16px",
                backgroundColor: "var(--accent-purple)",
                color: "#fff",
              }}
            >
              Girar Roleta! ({player.fruit_rolls} giros restantes)
            </button>
          </div>
        )}
      </div>

      {activeQuiz && (
        <QuizModal
          quest={activeQuiz}
          onPass={() => {
            const bossEnemy = activeQuiz.boss;
            setActiveQuiz(null);
            setActiveCombat({ ...bossEnemy, weaponReward: activeQuiz.weaponReward });
          }}
          onFail={(msg) => {
            alert(msg);
            setActiveQuiz(null);
          }}
          onClose={() => setActiveQuiz(null)}
        />
      )}

      {activeCombat && (
        <CombatModal
          player={player}
          enemy={activeCombat}
          totalAtk={totalAtk}
          playerMaxHp={totalHp}
          onVictory={handleVictory}
          onDefeat={() => {
            alert("Você foi derrotado! Treine mais e tente novamente.");
            setActiveCombat(null);
          }}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO AO REPETIR COM FRUTA LENDÁRIA EQUIPADA */}
      {confirmReroll && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card card-legendary" style={{ maxWidth: "430px", width: "90%", textAlign: "center", padding: "25px" }}>
            <h3 style={{ color: "var(--accent-gold)" }}>⚠️ Girar novamente?</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.5", margin: "12px 0" }}>
              Você já tem uma Akuma no Mi Lendária equipada (<strong>{currentFruit.name}</strong>)! Tem certeza de que deseja girar
              novamente e arriscar perdê-la?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setConfirmReroll(false)} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmReroll(false);
                  doRollFruit();
                }}
                style={{ backgroundColor: "var(--accent-gold)", color: "#000" }}
              >
                Sim, girar roleta!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFETES DE CELEBRAÇÃO PARA FRUTAS LENDÁRIAS */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 0.45}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* INDICADOR DE AUTO-SAVE */}
      {savedFlash && <div className="saved-indicator">💾 Salvo</div>}

      {/* NOTIFICAÇÃO TOAST NO CANTO INFERIOR ESQUERDO */}
      {levelToast && (
        <div className="toast-notification">
          <span>⚡</span>
          <span>{levelToast}</span>
        </div>
      )}
    </div>
  );
}