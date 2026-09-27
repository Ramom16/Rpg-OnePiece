import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import WorldCard from "../components/WorldCard";
import EquipmentSlots from "../components/EquipmentSlots";
import SlotPickerModal from "../components/SlotPickerModal";
import CombatModal from "../components/CombatModal";
import RaidModal from "../components/RaidModal";
import QuizModal from "../components/QuizModal";
import { useToast } from "../components/toastContext";
import FruitImage from "../components/FruitImage";
import { WORLDS, SIDE_QUESTS, LEGENDARY_WEAPON_QUESTS } from "../data/quests";
import { WEAPONS } from "../data/weapons";
import { FRUITS } from "../data/fruits";
import { ACCESSORIES } from "../data/accessories";
import { RACES } from "../data/races";
import { RAIDS } from "../data/raids";
import { TITLES } from "../data/titles";
import { getWorldProgress } from "../utils/worldProgress";
import {
  MAX_REFINE,
  MAX_SLOTS,
  SLOT_UNLOCK_COST,
  clearSlot,
  getActiveFruitItem,
  getActiveWeaponItem,
  migratePlayerToSlots,
  normalizeFruitSlots,
  normalizeWeaponSlots,
  putItemInSlot,
  setActiveSlot,
  storeInFreeSlot,
  syncLegacyEquipFields,
  toFruitSlotItem,
  toWeaponSlotItem,
  unlockNextSlot,
  updateActiveItem,
} from "../utils/equipmentSlots";
import API from "../services/api";

const MAX_LEVEL = 50;
const xpToNext = (level) => 100 + level * 20;

const SEA_ORDER = ["Mundo 1", "Mundo 2", "Mundo 3"];

// Condição extra (além do nível) que libera cada mar, exibida no card bloqueado
const WORLD_LOCK_HINTS = {
  world2: "Derrote Doflamingo em Dressrosa",
  world3: "Derrote Kaido em Wano",
};

// ==================== MENU DE NAVEGAÇÃO (AGRUPADO POR CATEGORIA) ====================
const NAV_GROUPS = [
  {
    label: "🗺️ Mundo",
    items: [
      { key: "story", icon: "🌍", label: "Explorar Mares" },
      { key: "side", icon: "💰", label: "Caças" },
      { key: "raids", icon: "☠️", label: "Raids" },
    ],
  },
  {
    label: "⚔️ Equipamento",
    items: [
      { key: "slots", icon: "🗂️", label: "Slots" },
      { key: "shop", icon: "🛒", label: "Loja de Espadas" },
      { key: "accessories", icon: "💍", label: "Acessórios" },
      { key: "legendary", icon: "🗡️", label: "Armas Lendárias" },
    ],
  },
  {
    label: "🧘 Evolução",
    items: [
      { key: "haki", icon: "🧘", label: "Haki" },
      { key: "race", icon: "🧬", label: "Raça" },
      { key: "gacha", icon: "🎲", label: "Roleta de Frutas" },
    ],
  },
  {
    label: "🏆 Conquistas",
    items: [{ key: "titles", icon: "🏆", label: "Títulos" }],
  },
];

// ==================== SISTEMA DE HAKI ====================
const DEFAULT_HAKI = { armamento: false, observacao: false, rei: false };

const HAKI_TRAINING = [
  {
    key: "armamento",
    icon: "🖤",
    name: "Haki do Armamento",
    reqLevel: 15,
    cost: 50000,
    effects: ["+25% de dano físico/espada", "+15% de resistência (reduz o dano recebido)"],
  },
  {
    key: "observacao",
    icon: "👁️",
    name: "Haki da Observação",
    reqLevel: 25,
    cost: 150000,
    effects: ["20% de chance de Esquiva Perfeita (anula completamente o dano do turno)"],
  },
  {
    key: "rei",
    icon: "👑",
    name: "Haki do Rei",
    reqLevel: 35,
    bossRequirement: true,
    cost: 0,
    effects: [
      "30% de chance no 1º turno de paralisar/atordoar o inimigo por 1 turno",
      "Causa 20% do HP do inimigo como Dano de Conquistador",
    ],
  },
];

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

// TÍTULOS QUE SÃO LIBERADOS AO VENCER RAIDS ESPECÍFICAS
const RAID_TITLE_REWARDS = {
  shichibukai_lineup: "shichibukai",
  beast_pirates: "yonkou",
  roger_pirates: "pirate_king",
};

// Sorteio ponderado genérico (impuro) isolado no escopo do módulo — fora do corpo do componente
function pickWeighted(items, weights) {
  const total = weights.reduce((acc, w) => acc + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Peso base por raridade de Fruta (fração das roletas)
const FRUIT_BASE_WEIGHTS = { Comum: 100, Rara: 45, Épica: 15, Lendária: 5 };

// Sorteio de fruta ponderado pela raridade, com bônus de sorte do título equipado
function pickRandomFruit(luckMultiplier = 1) {
  const weights = FRUITS.map((fruit) => {
    const base = FRUIT_BASE_WEIGHTS[fruit.rarity] ?? 10;
    const boost = fruit.rarity === "Épica" || fruit.rarity === "Lendária" ? luckMultiplier : 1;
    return base * boost;
  });
  return pickWeighted(FRUITS, weights);
}

// Sorteio de raça ponderado pelas porcentagens (chance) de RACES, com bônus de sorte
function pickRandomRace(luckMultiplier = 1) {
  const weights = RACES.map((race) => {
    const boost = race.rarity === "Épica" || race.rarity === "Lendária" ? luckMultiplier : 1;
    return race.chance * boost;
  });
  return pickWeighted(RACES, weights);
}

const RACE_ROLL_COST = 20000;

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
  const [activeRaid, setActiveRaid] = useState(null);
  const [message, setMessage] = useState("");

  // ESTADOS DA ROLETA DE AKUMA NO MI
  const [confirmReroll, setConfirmReroll] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [gachaAnimKey, setGachaAnimKey] = useState(0);

  // ESTADOS DA ROLETA DE RAÇAS
  const [raceRevealKey, setRaceRevealKey] = useState(0);

  // Item novo obtido sem slot livre: aguarda o jogador escolher onde guardar
  const [pendingItem, setPendingItem] = useState(null);

  // AUTO-SAVE SILENCIOSO
  const [savedFlash, setSavedFlash] = useState(false);
  const savedFlashTimerRef = useRef(null);

  // NOTIFICAÇÕES TOAST (canto inferior esquerdo, não-bloqueante)
  const { showToast } = useToast();

  // ===== NOME DE PIRATA PERSONALIZÁVEL =====
  const pirateNickname = player.nickname || player.username || "Pirata Sem Nome";
  const xpPercent = (player.xp / xpToNext(player.level)) * 100;

  // Salvar novo nome de pirata (persistência via persistPlayer → localStorage + API)
  const saveNickname = (newName) => {
    const trimmed = (newName || "").trim().slice(0, 24);
    if (!trimmed) {
      showToast("⚠️ O nome de pirata não pode estar vazio!", "warning");
      return false;
    }
    const nextPlayer = { ...player, nickname: trimmed };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`🏴‍☠️ Agora você é conhecido como "${trimmed}"!`, "success");
    return true;
  };

  // Função para acionar o Toast de Level Up
  const triggerLevelToast = (newLevel, extraRolls = 0) => {
    const rollText = extraRolls > 0 ? ` · +${extraRolls} giro(s) de fruta!` : "";
    showToast(`🎉 Nível ${newLevel} Alcançado!${rollText}`, "success");
  };

  // ===== SISTEMA DE SLOTS DE EQUIPAMENTO (ARMAS + AKUMA NO MI) =====
  // Os slots são normalizados a cada render: saves antigos (weapon_name/fruit_name)
  // são convertidos sob a demanda e persistidos uma única vez pelo efeito de migração.
  const weaponSlots = normalizeWeaponSlots(player.weaponSlots, player);
  const fruitSlots = normalizeFruitSlots(player.fruitSlots, player);
  const activeWeaponItem = getActiveWeaponItem(weaponSlots);
  const activeFruitItem = getActiveFruitItem(fruitSlots);

  // Ficha de catálogo do slot ativo (usada nas telas de detalhe: gacha, refinaria, HUD).
  // Os atributos, porém, vêm do próprio slot — e não do catálogo.
  const currentFruit = activeFruitItem ? FRUITS.find((f) => f.id === activeFruitItem.id) : null;
  const currentAccessory = ACCESSORIES.find((a) => a.name === player.accessory_name);
  const raceRolls = player.race_rolls ?? 3;
  const currentRace = RACES.find((r) => r.name === player.race) || RACES[0];
  const avatarIcon = currentRace.icon || "🏴‍☠️";

  // ===== SISTEMA DE TÍTULOS (bônus de sorte nos gachas) =====
  const unlockedTitles = Array.isArray(player.unlocked_titles) ? player.unlocked_titles : ["rookie"];
  const equippedTitle = player.equipped_title || "rookie";
  const currentTitle = TITLES.find((t) => t.id === equippedTitle) || TITLES[0];
  const luckMultiplier = 1 + (currentTitle.luckBonus || 0) / 100;
  const titleTag = `${currentTitle.icon} ${currentTitle.name}`;

  // Equipar um título desbloqueado (persistência via persistPlayer)
  const equipTitle = (titleId) => {
    if (!unlockedTitles.includes(titleId)) {
      showToast("🔒 Título ainda não desbloqueado!", "warning");
      return;
    }
    if (equippedTitle === titleId) return;
    const title = TITLES.find((t) => t.id === titleId);
    const nextPlayer = { ...player, equipped_title: titleId };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`🏆 Título equipado: ${title.icon} ${title.name}!`, "success");
  };

  // ENHANCE DE ENDGAME: refino de equipamentos, despertar de fruta e treinamento de status
  // (refino e despertar agora são POR SLOT — vivem dentro do item guardado)
  const refineWeaponLevel = activeWeaponItem?.refine ?? 0;
  const refineAccessoryLevel = player.refine_accessory ?? 0;
  const fruitAwakened = !!activeFruitItem?.isAwakened;
  const trainingAtk = player.training_atk ?? 0;
  const trainingHp = player.training_hp ?? 0;

  const weaponAtk = activeWeaponItem?.atk ?? 0;
  const fruitAtkBase = activeFruitItem?.atk ?? 0;
  const fruitHpBase = activeFruitItem?.hp ?? 0;
  const accessoryHpBase = currentAccessory ? currentAccessory.bonusHp : 0;
  const accessoryWeaponBase = currentAccessory ? currentAccessory.weaponAtkBoost : 0;
  const accessoryFruitBase = currentAccessory ? currentAccessory.fruitAtkBoost : 0;

  const fruitMult = fruitAwakened ? 10 : 1;
  const weaponRefineMult = 1 + refineWeaponLevel * 0.15;
  const accessoryRefineMult = 1 + refineAccessoryLevel * 0.15;

  const fruitAtk = fruitAtkBase * fruitMult;
  const fruitBonusHp = fruitHpBase * fruitMult;
  const accessoryBonusHp = accessoryHpBase * accessoryRefineMult;
  const accessoryWeaponBoost = accessoryWeaponBase * accessoryRefineMult;
  const accessoryFruitBoost = accessoryFruitBase * accessoryRefineMult;
  const boostedWeaponAtk = weaponAtk * weaponRefineMult;

  const baseAtk = 20 + player.level * 5 + trainingAtk + boostedWeaponAtk + accessoryWeaponBoost + fruitAtk + accessoryFruitBoost;
  const baseHp = 100 + player.level * 10 + trainingHp + fruitBonusHp + accessoryBonusHp;
  const totalAtk = Math.floor(baseAtk * currentRace.atkMultiplier);
  const totalHp = Math.floor(baseHp * currentRace.hpMultiplier);

  // HP gravado no save: só a fruta ativa altera a vida, então é ela que entra aqui
  const hpForSlots = (nextPlayer) => {
    const nextFruitSlots = normalizeFruitSlots(nextPlayer.fruitSlots, nextPlayer);
    const fruit = getActiveFruitItem(nextFruitSlots);
    const fruitHp = fruit ? fruit.hp * (fruit.isAwakened ? 10 : 1) : 0;
    return Math.floor((100 + nextPlayer.level * 10 + (nextPlayer.training_hp ?? 0) + fruitHp + accessoryBonusHp) * currentRace.hpMultiplier);
  };

  // HAKI: estado normalizado (compatível com saves antigos onde haki era boolean)
  const haki = {
    ...DEFAULT_HAKI,
    ...(player.haki && typeof player.haki === "object" ? player.haki : {}),
  };
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
      showToast(
        world.id === "world2"
          ? "🌊 Mundo 2 bloqueado! Alcance o Nível 15 e derrote Doflamingo em Dressrosa."
          : "🌊 Mundo 3 bloqueado! Alcance o Nível 30 e derrote Kaido em Wano.",
        "warning"
      );
      return;
    }
    setActiveWorld(worldIndex);
    setExpandedIsland(world.islands[0].id);
  };

  // AUTO-SAVE: grava no localStorage + API em background e mostra o ícone 💾 por 2s
  const persistPlayer = (rawPlayer) => {
    // Mantém as colunas legadas de equipamento em sincronia com os slots ativos
    const nextPlayer = syncLegacyEquipFields(rawPlayer);
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

  // ==========================================================
  // SLOTS DE EQUIPAMENTO: desbloquear, equipar, guardar item
  // ==========================================================
  const slotsField = (kind) => (kind === "weapon" ? "weaponSlots" : "fruitSlots");
  const itemTerm = (kind) => (kind === "weapon" ? { emoji: "🗡️", noun: "espada" } : { emoji: "🍍", noun: "Akuma no Mi" });

  // Salva o estado dos slots recalculando o HP persistido
  const saveSlots = (kind, nextSlots) => {
    const nextPlayer = { ...player, [slotsField(kind)]: nextSlots };
    nextPlayer.hp = hpForSlots(nextPlayer);
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
  };

  // Compra o próximo slot de armas ou de frutas (50.000 Berries cada)
  const unlockSlot = (kind) => {
    const { noun } = itemTerm(kind);
    const current = kind === "weapon" ? weaponSlots : fruitSlots;
    if (current.maxUnlocked >= MAX_SLOTS) {
      showToast(`Você já liberou todos os ${MAX_SLOTS} slots de ${noun}!`, "info");
      return;
    }
    if (player.berries < SLOT_UNLOCK_COST) {
      showToast(`Berries insuficientes! Desbloquear um slot custa ${SLOT_UNLOCK_COST.toLocaleString()} Berries.`, "warning");
      return;
    }
    const nextPlayer = { ...player, berries: player.berries - SLOT_UNLOCK_COST, [slotsField(kind)]: unlockNextSlot(current) };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`🔓 Slot ${current.maxUnlocked + 1} de ${noun} desbloqueado!`, "success");
  };

  // Equipa o item guardado em um slot desbloqueado e ocupado
  const equipSlot = (kind, index) => {
    const { emoji, noun } = itemTerm(kind);
    const current = kind === "weapon" ? weaponSlots : fruitSlots;
    if (index >= current.maxUnlocked) {
      showToast("🔒 Desbloqueie este slot antes de equipar.", "warning");
      return;
    }
    if (!current.items[index]) {
      showToast(`Este slot está vazio — obtenha uma ${noun} na loja ou na roleta.`, "warning");
      return;
    }
    if (current.activeSlotIndex === index) return;
    saveSlots(kind, setActiveSlot(current, index));
    showToast(`${emoji} ${current.items[index].name} equipada! (Slot ${index + 1})`, "success");
  };

  // Desequipa o item do slot informado (os atributos do slot saem do cálculo)
  const unequipSlot = (kind, index) => {
    const { emoji } = itemTerm(kind);
    const current = kind === "weapon" ? weaponSlots : fruitSlots;
    if (!current.items[index]) return;
    const itemName = current.items[index].name;
    saveSlots(kind, clearSlot(current, index));
    showToast(`${emoji} ${itemName} foi desequipada — o Slot ${index + 1} ficou vazio.`, "info");
  };

  // Guarda um item no slot indicado e passa a usá-lo como equipamento ativo
  const storeItemInSlot = (kind, index, item) => {
    const { emoji } = itemTerm(kind);
    const current = kind === "weapon" ? weaponSlots : fruitSlots;
    const replaced = current.items[index];
    saveSlots(kind, putItemInSlot(current, index, item));
    if (replaced) {
      showToast(`${emoji} ${item.name} guardada no Slot ${index + 1} (substituiu ${replaced.name}).`, "success");
    } else {
      showToast(`${emoji} ${item.name} guardada no Slot ${index + 1} e equipada!`, "success");
    }
  };

  // Fluxo de obtenção de item já resolvido em um único estado do jogador
  // (usado por loja/gacha/vitória): devolve os slots com o item guardado ou
  // null quando todos os slots desbloqueados estão ocupados.
  const prepareItemStorage = (kind, item) => {
    const current = kind === "weapon" ? weaponSlots : fruitSlots;
    const nextSlots = storeInFreeSlot(current, item);
    if (nextSlots) return { slots: nextSlots, pending: false };
    return { slots: current, pending: true };
  };

  // Item novo ainda sem destino: o jogador precisa escolher o slot
  const handlePendingSlotSelect = (index) => {
    if (!pendingItem) return;
    const { kind, item } = pendingItem;
    setPendingItem(null);
    storeItemInSlot(kind, index, item);
  };

  const startQuest = (island, quest) => {
    if (player.level < island.minLevel) {
      showToast(`Você precisa ser Nível ${island.minLevel} para acessar ${island.name}!`, "warning");
      return;
    }
    setActiveCombat({ ...quest, islandName: island.name });
  };

  const startLegendaryQuest = (quest) => {
    if (player.level < quest.minLevel) {
      showToast(`Nível insuficiente! Requer Nível ${quest.minLevel}.`, "warning");
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
    let newWeaponSlots = weaponSlots;
    let newFruitRolls = player.fruit_rolls;
    let newWorldProgress = player.world_progress || 1;

    // Recompensa de arma lendária: entra em um slot livre; se todos estiverem
    // ocupados, o jogador escolhe qual item substituir logo após a vitória.
    if (enemy.weaponReward) {
      const rewardWeapon = WEAPONS.find((w) => w.id === enemy.weaponReward);
      if (rewardWeapon) {
        const rewardItem = toWeaponSlotItem(rewardWeapon);
        const storage = prepareItemStorage("weapon", rewardItem);
        newWeaponSlots = storage.slots;
        if (storage.pending) {
          setPendingItem({ kind: "weapon", item: rewardItem });
        }
        showToast(`🏆 Você obteve a lendária espada: ${rewardWeapon.name}!`, "success");
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
      showToast(`🌊 ${unlocked.name} (${unlocked.subtitle}) desbloqueado! Navegue para explorá-lo.`, "success");
    }

    if (enemy.finalBoss) {
      showToast("🏆 PARABÉNS! Você derrotou o Lorde Supremo de Elbaf e ZEROU o RPG One Piece!", "success");
    }

    const nextPlayer = {
      ...player,
      level: newLevel,
      xp: newXp,
      berries: newBerries,
      bounty: newBounty,
      weaponSlots: newWeaponSlots,
      fruit_rolls: newFruitRolls,
      world_progress: newWorldProgress,
    };
    nextPlayer.hp = hpForSlots(nextPlayer);
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
  };

  const buyWeapon = (weapon) => {
    if (player.berries < weapon.price) {
      showToast("Berries insuficientes para comprar esta espada!", "warning");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - weapon.price,
      weaponSlots,
    };
    // A espada comprada ocupa um slot livre; se não houver, o jogador escolhe qual substituir
    const boughtItem = toWeaponSlotItem(weapon);
    const storage = prepareItemStorage("weapon", boughtItem);
    nextPlayer.weaponSlots = storage.slots;
    nextPlayer.hp = hpForSlots(nextPlayer);
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    if (storage.pending) setPendingItem({ kind: "weapon", item: boughtItem });
    showToast(`🛒 Você comprou a espada ${weapon.name}!`, "success");
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

    const rolledFruit = pickRandomFruit(luckMultiplier);
    const rolledItem = toFruitSlotItem(rolledFruit);

    // A fruta obtida ocupa um slot livre; se não houver, o jogador escolhe qual substituir
    const storage = prepareItemStorage("fruit", rolledItem);

    const nextPlayer = {
      ...player,
      fruit_rolls: player.fruit_rolls - 1,
      fruitSlots: storage.slots,
    };
    nextPlayer.hp = hpForSlots(nextPlayer);
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);

    if (storage.pending) setPendingItem({ kind: "fruit", item: rolledItem });

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

    // Aviso antes de trocar a fruta lendária que está sendo usada
    if (currentFruit && currentFruit.rarity === "Lendária") {
      setConfirmReroll(true);
      return;
    }

    doRollFruit();
  };

  const buyAccessory = (accessory) => {
    if (player.berries < accessory.price) {
      showToast("Berries insuficientes para comprar este acessório!", "warning");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - accessory.price,
      accessory_name: accessory.name,
      refine_accessory: 0,
      hp: Math.floor((100 + player.level * 10 + fruitBonusHp + accessory.bonusHp) * currentRace.hpMultiplier),
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`Você comprou e equipou o acessório ${accessory.name}!`, "success");
  };

  // DESPERTAR HAKI
  const awakenHaki = (hakiType, cost, label) => {
    if (haki[hakiType]) {
      showToast(`${label} já está despertado!`, "warning");
      return;
    }
    if (player.berries < cost) {
      showToast("Berries insuficientes para despertar este Haki!", "warning");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - cost,
      haki: { ...haki, [hakiType]: true },
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`✨ ${label} despertado! Seu poder de vontade fortalecerá seu combate.`, "info");
  };

  // ⛏️ REFINAR ESPADA DO SLOT ATIVO (+1 a +10, cada nível = +15% do ATK base)
  const refineWeapon = () => {
    if (!activeWeaponItem) {
      showToast("Nenhuma espada equipada para refinar!", "warning");
      return;
    }
    if (refineWeaponLevel >= MAX_REFINE) {
      showToast(`Sua espada já está no nível máximo +${MAX_REFINE}!`, "info");
      return;
    }
    const cost = (refineWeaponLevel + 1) * 50000;
    if (player.berries < cost) {
      showToast(`Berries insuficientes! Refinar para +${refineWeaponLevel + 1} custa ${cost.toLocaleString()} Berries.`, "warning");
      return;
    }
    const nextLevel = refineWeaponLevel + 1;
    saveSlots("weapon", updateActiveItem(weaponSlots, { refine: nextLevel }));
    showToast(`⛏️ ${activeWeaponItem.name} refinada para +${nextLevel}! (ATK agora +${Math.round(weaponAtk * (1 + nextLevel * 0.15))})`, "success");
  };

  // ⛏️ REFINAR ACESSÓRIO EQUIPADO (+1 a +10, cada nível = +15% dos atributos base)
  const refineAccessory = () => {
    if (!currentAccessory) {
      showToast("Nenhum acessório equipado para refinar!", "warning");
      return;
    }
    if (refineAccessoryLevel >= 10) {
      showToast("Seu acessório já está no nível máximo +10!", "info");
      return;
    }
    const cost = (refineAccessoryLevel + 1) * 50000;
    if (player.berries < cost) {
      showToast(`Berries insuficientes! Refinar para +${refineAccessoryLevel + 1} custa ${cost.toLocaleString()} Berries.`, "warning");
      return;
    }
    const nextAccMult = 1 + (refineAccessoryLevel + 1) * 0.15;
    const nextBonusHp = accessoryHpBase * nextAccMult;
    const nextPlayer = {
      ...player,
      berries: player.berries - cost,
      refine_accessory: refineAccessoryLevel + 1,
      hp: Math.floor((100 + player.level * 10 + trainingHp + fruitBonusHp + nextBonusHp) * currentRace.hpMultiplier),
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`⛏️ ${currentAccessory.name} refinado para +${refineAccessoryLevel + 1}! (Bônus +15% adicionais)`, "success");
  };

  // ⚡ DESPERTAR AKUMA NO MI DO SLOT ATIVO (Nível 40+ e 500.000 Berries → bônus ×10)
  const awakenFruit = () => {
    if (!activeFruitItem) {
      showToast("Você precisa estar com uma Akuma no Mi equipada!", "warning");
      return;
    }
    if (fruitAwakened) {
      showToast(`${activeFruitItem.name} já está despertada!`, "warning");
      return;
    }
    if (player.level < 40) {
      showToast("Requer Nível 40 para despertar a Akuma no Mi!", "warning");
      return;
    }
    if (player.berries < 500000) {
      showToast("Berries insuficientes! Despertar custa 500.000 Berries.", "warning");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - 500000,
      fruitSlots: updateActiveItem(fruitSlots, { isAwakened: true }),
    };
    nextPlayer.hp = hpForSlots(nextPlayer);
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    triggerConfetti();
    showToast(`✨ ${activeFruitItem.name} despertada! Bônus de ATK e HP multiplicados por 10.`, "success");
  };

  // 💪 TREINAR FORÇA: +100 ATK Base permanente (30.000 Berries)
  const trainStrength = () => {
    if (player.berries < 30000) {
      showToast("Berries insuficientes! O treino de Força custa 30.000 Berries.", "warning");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - 30000,
      training_atk: trainingAtk + 100,
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`💪 Força treinada! +100 ATK Base permanente (total de treino: +${trainingAtk + 100} ATK)`, "info");
  };

  // ❤️ TREINAR VITALIDADE: +350 HP Base permanente (30.000 Berries)
  const trainVitality = () => {
    if (player.berries < 30000) {
      showToast("Berries insuficientes! O treino de Vitalidade custa 30.000 Berries.", "warning");
      return;
    }
    const nextPlayer = {
      ...player,
      berries: player.berries - 30000,
      training_hp: trainingHp + 350,
      hp: Math.floor((100 + player.level * 10 + trainingHp + 350 + fruitBonusHp + accessoryBonusHp) * currentRace.hpMultiplier),
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);
    showToast(`❤️ Vitalidade treinada! +350 HP Base permanente (total de treino: +${trainingHp + 350} HP)`, "info");
  };

  // GIRAR ROLETA DE RAÇAS (1 giro grátis ou 20.000 Berries)
  const doRollRace = () => {
    let nextRolls = raceRolls;
    let nextBerries = player.berries;

    if (nextRolls > 0) {
      nextRolls -= 1;
    } else if (nextBerries >= RACE_ROLL_COST) {
      nextBerries -= RACE_ROLL_COST;
    } else {
      setMessage("❌ Sem giros de raça! Você precisa pagar 20.000 Berries para girar.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    const rolledRace = pickRandomRace(luckMultiplier);

    const nextPlayer = {
      ...player,
      race: rolledRace.name,
      race_rolls: nextRolls,
      berries: nextBerries,
      hp: Math.floor((100 + player.level * 10 + fruitBonusHp + accessoryBonusHp) * rolledRace.hpMultiplier),
    };
    setPlayer(nextPlayer);
    persistPlayer(nextPlayer);

    setRaceRevealKey((k) => k + 1);

    if (rolledRace.rarity === "Lendária") {
      triggerConfetti();
    }

    setMessage(rolledRace.name === "Humano" ? "🫥 Você sorteou Humano... que azar!" : `🎲 Nova raça: ${rolledRace.icon} ${rolledRace.name}!`);
    setTimeout(() => setMessage(""), 3500);
  };

  // INICIAR RAID
  const startRaid = (raid) => {
    if (player.level < raid.minLevel) {
      showToast(`Nível insuficiente! Esta Raid requer Nível ${raid.minLevel}.`, "warning");
      return;
    }
    setActiveRaid(raid);
  };

  // VITÓRIA NA RAID: entrega Berries, XP e Giros de Raça bônus
  const handleRaidVictory = (raid) => {
    setActiveRaid(null);

    let newBerries = player.berries + raid.rewardBerries;
    let newXp = player.xp + raid.rewardXp;
    let newLevel = player.level;
    let newFruitRolls = player.fruit_rolls;
    let newRaceRolls = raceRolls + raid.rewardRaceRolls;

    let levelsGained = 0;
    while (newLevel < MAX_LEVEL && newXp >= xpToNext(newLevel)) {
      newXp -= xpToNext(newLevel);
      newLevel += 1;
      levelsGained += 1;
      newFruitRolls += 1;
    }

    if (levelsGained > 0) {
      triggerLevelToast(newLevel, levelsGained);
    }

    const nextPlayer = {
      ...player,
      berries: newBerries,
      xp: newXp,
      level: newLevel,
      fruit_rolls: newFruitRolls,
      race_rolls: newRaceRolls,
      hp: totalHp,
    };

    // DESBLOQUEIO DE TÍTULOS POR RAID VENCIDA
    let finalPlayer = nextPlayer;
    const titleId = RAID_TITLE_REWARDS[raid.id];
    if (titleId && !unlockedTitles.includes(titleId)) {
      const unlocked = TITLES.find((t) => t.id === titleId);
      finalPlayer = { ...nextPlayer, unlocked_titles: [...unlockedTitles, titleId] };
      showToast(`🏆 Novo Título Desbloqueado: ${unlocked.icon} ${unlocked.name}!`, "success");
    }

    setPlayer(finalPlayer);
    persistPlayer(finalPlayer);
    showToast(
      `🏆 Raid "${raid.title}" completa! 💰 +${raid.rewardBerries.toLocaleString()} Berries · ⭐ +${raid.rewardXp} XP · 🎲 +${raid.rewardRaceRolls} giro(s) de raça`,
      "success"
    );
  };

  // MIGAÇÃO ÚNICA: saves antigos (weapon_name / fruit_name) viram slots e são
  // gravados uma vez, para que o sistema de slots persista no banco do jogador.
  useEffect(() => {
    const migrated = migratePlayerToSlots(player);
    if (migrated !== player) {
      setPlayer(migrated);
      persistPlayer(migrated);
    }
    // Executa apenas na montagem: o save já migrado volta normalizado do backend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeWorldData = WORLDS[activeWorld];

  // ==== BARRA DE PROGRESSO DA JORNADA (MUNDO ATUAL) ====
  const { activeIslandIdx, activeIsland, missionIdx, percent: worldPct } = getWorldProgress(activeWorldData, player.level);

  return (
    <div className="game-page" style={{ minHeight: "100vh" }}>
      <Navbar
        player={player}
        nickname={pirateNickname}
        avatarIcon={avatarIcon}
        titleTag={titleTag}
        xpPercent={xpPercent}
        onLogout={onLogout}
        onSaveNickname={saveNickname}
      />

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

        {/* =================== HUD DO PERSONAGEM (2 CARDS) =================== */}
        <div className="hud-grid">
          {/* CARD 1: EQUIPAMENTO ATUAL */}
          <div className="glass-card">
            <h3 className="glass-card-title">🗡️ Equipamento Atual</h3>
            <div className="equip-list">
              <div className="equip-row">
                <span className="equip-icon">⚔️</span>
                <div className="equip-info">
                  <span className="equip-name">
                    {activeWeaponItem ? activeWeaponItem.name : "Nenhuma espada"}
                    {refineWeaponLevel > 0 ? <span className="equip-refine">+{refineWeaponLevel}</span> : ""}
                    <span className="equip-slot-tag">
                      Slot {weaponSlots.activeSlotIndex + 1}/{weaponSlots.maxUnlocked}
                    </span>
                  </span>
                  <span className="equip-sub">Bônus de ATK</span>
                </div>
                <span className="equip-value">+{Math.round(boostedWeaponAtk)}</span>
              </div>

              <div className="equip-row">
                {currentFruit ? (
                  <FruitImage
                    src={currentFruit.image}
                    alt={currentFruit.name}
                    fallback={currentFruit.icon}
                    size={38}
                  />
                ) : (
                  <span className="equip-icon">🥭</span>
                )}
                <div className="equip-info">
                  <span className="equip-name">
                    {activeFruitItem ? activeFruitItem.name : "Nenhuma fruta"}
                    {fruitAwakened && <span className="tag-awakened">✨ Despertada</span>}
                    <span className="equip-slot-tag">
                      Slot {fruitSlots.activeSlotIndex + 1}/{fruitSlots.maxUnlocked}
                    </span>
                  </span>
                  <span className="equip-sub">
                    +{Math.round(fruitAtk)} ATK · +{Math.round(fruitBonusHp)} HP
                  </span>
                </div>
              </div>

              <div className="equip-row">
                <span className="equip-icon">💍</span>
                <div className="equip-info">
                  <span className="equip-name">
                    {currentAccessory ? currentAccessory.name : "Nenhum acessório"}
                    {refineAccessoryLevel > 0 ? <span className="equip-refine">+{refineAccessoryLevel}</span> : ""}
                  </span>
                  <span className="equip-sub">Bônus de HP</span>
                </div>
                <span className="equip-value">+{Math.round(accessoryBonusHp)}</span>
              </div>

              <div className="equip-row">
                <span className="equip-icon">🎲</span>
                <div className="equip-info">
                  <span className="equip-name">Giros disponíveis</span>
                  <span className="equip-sub">Fruta + Raça</span>
                </div>
                <span className="equip-value">
                  {player.fruit_rolls} · {raceRolls}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: STATUS E PODERES */}
          <div className="glass-card">
            <h3 className="glass-card-title">⚡ Status e Poderes</h3>

            <div className="hud-stats">
              <div className="hud-stat hud-stat-hp">
                <span className="hud-stat-label">❤️ Vida Total</span>
                <strong className="hud-stat-value">{totalHp}</strong>
              </div>
              <div className="hud-stat hud-stat-atk">
                <span className="hud-stat-label">🔥 Ataque Total</span>
                <strong className="hud-stat-value">{totalAtk}</strong>
              </div>
            </div>

            <div className="hud-section">
              <span className="hud-section-label">🌀 Hakis Despertados</span>
              <div className="haki-badges">
                <span className={`haki-badge haki-arm ${haki.armamento ? "on" : "off"}`}>🖤 Armamento</span>
                <span className={`haki-badge haki-obs ${haki.observacao ? "on" : "off"}`}>👁️ Observação</span>
                <span className={`haki-badge haki-king ${haki.rei ? "on" : "off"}`}>👑 Haki do Rei</span>
              </div>
            </div>

            <div className="hud-section">
              <span className="hud-section-label">🧬 Raça Equipada</span>
              <div className="race-tag-row">
                <span className={`race-tag race-${currentRace.rarity.toLowerCase()}`}>
                  {currentRace.icon} {currentRace.name}
                </span>
                <span className={`badge badge-${currentRace.rarity.toLowerCase()}`}>{currentRace.rarity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =================== MENU DE NAVEGAÇÃO (ABAS) =================== */}
        <div className="tab-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="tab-group">
              <span className="tab-group-label">{group.label}</span>
              <div className="tab-group-items">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    className={`tab-button ${activeTab === item.key ? "active" : ""}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* =================== EXPLORAR MARES (MUNDOS + ILHAS) =================== */}
        {activeTab === "story" && (
          <div>
            <div className="section-header">
              <h3 className="section-title">
                <span aria-hidden="true">🗺️</span> Escolha o seu Mar e navegue entre as ilhas
              </h3>
              <p className="section-subtitle">
                Selecione a região para explorar novas ilhas, caças e missões disponíveis.
              </p>
            </div>

            <div className="world-grid">
              {WORLDS.map((world, idx) => {
                const isLocked = !canAccessWorld(idx);
                return (
                  <WorldCard
                    key={world.id}
                    world={world}
                    index={idx}
                    isActive={activeWorld === idx}
                    isLocked={isLocked}
                    progress={isLocked ? 0 : getWorldProgress(world, player.level).percent}
                    lockHint={WORLD_LOCK_HINTS[world.id]}
                    onSelect={selectWorld}
                  />
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

        {/* =================== SLOTS DE ARMAS E AKUMA NO MI =================== */}
        {activeTab === "slots" && (
          <div>
            <div className="section-header">
              <h3 className="section-title">
                <span aria-hidden="true">🗂️</span> Slots de Equipamento
              </h3>
              <p className="section-subtitle">
                Guarde até {MAX_SLOTS} espadas e {MAX_SLOTS} Akuma no Mi e escolha qual está equipada a qualquer momento. Só o item do slot
                equipado soma ATK e HP ao personagem.
              </p>
            </div>

            <EquipmentSlots
              weaponSlots={weaponSlots}
              fruitSlots={fruitSlots}
              berries={player.berries}
              onEquip={equipSlot}
              onUnequip={unequipSlot}
              onUnlock={unlockSlot}
            />
          </div>
        )}

        {/* =================== LOJA DE ESPADAS (POR MAR) =================== */}
        {activeTab === "shop" && (
          <div>
            <h3 style={{ marginBottom: "5px" }}>🛒 Loja de Espadas</h3>

            {/* ===== REFINARIA DE EQUIPAMENTOS (+0 a +10) ===== */}
            <div style={{ marginBottom: "25px", padding: "16px", border: "1px solid var(--border-color)", borderRadius: "12px", backgroundColor: "var(--bg-card)" }}>
              <h4 style={{ marginBottom: "4px", color: "var(--accent-gold)" }}>⛏️ Refinaria de Equipamentos</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Cada nível de refino (+1 a +10) concede <strong>+15%</strong> dos atributos base do item (no +10, o item dá +150% de status). Custo: <strong>Nível × 50.000 Berries</strong>. O refino acompanha o slot: cada espada guarda o seu próprio nível.
              </p>
              <div className="shop-grid">
                <div className="card">
                  <h4>⚔️ Refinar Espada: {activeWeaponItem ? activeWeaponItem.name : "Nenhuma"}</h4>
                  {activeWeaponItem ? (
                    <>
                      <p style={{ fontSize: "13px", color: "var(--accent-green)" }}>
                        ATK base: +{weaponAtk} → Refinado: +{Math.round(boostedWeaponAtk)} ({refineWeaponLevel}/10)
                      </p>
                      {refineWeaponLevel < MAX_REFINE ? (
                        <>
                          <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold" }}>
                            Custo: 💰 {((refineWeaponLevel + 1) * 50000).toLocaleString()} Berries
                          </p>
                          <button
                            onClick={refineWeapon}
                            style={{ width: "100%", backgroundColor: "var(--accent-gold)", color: "#000" }}
                          >
                            ⛏️ Refinar para +{refineWeaponLevel + 1}
                          </button>
                        </>
                      ) : (
                        <p style={{ color: "var(--accent-green)", fontWeight: "bold", margin: 0 }}>✔ Nível máximo +{MAX_REFINE} alcançado!</p>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Compre uma espada para poder refiná-la.</p>
                  )}
                </div>

                <div className="card">
                  <h4>💍 Refinar Acessório: {currentAccessory ? currentAccessory.name : "Nenhum"}</h4>
                  {currentAccessory ? (
                    <>
                      <p style={{ fontSize: "13px", color: "var(--accent-green)" }}>
                        HP base: +{accessoryHpBase} → Refinado: +{Math.round(accessoryBonusHp)} ({refineAccessoryLevel}/10)
                      </p>
                      {refineAccessoryLevel < 10 ? (
                        <>
                          <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold" }}>
                            Custo: 💰 {((refineAccessoryLevel + 1) * 50000).toLocaleString()} Berries
                          </p>
                          <button
                            onClick={refineAccessory}
                            style={{ width: "100%", backgroundColor: "var(--accent-purple)", color: "#fff" }}
                          >
                            ⛏️ Refinar para +{refineAccessoryLevel + 1}
                          </button>
                        </>
                      ) : (
                        <p style={{ color: "var(--accent-green)", fontWeight: "bold", margin: 0 }}>✔ Nível máximo +10 alcançado!</p>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Compre um acessório para poder refiná-lo.</p>
                  )}
                </div>
              </div>
            </div>

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
                          <FruitImage
                            src={accessory.image}
                            alt={accessory.name}
                            fallback="💍"
                            size={70}
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

        {/* =================== TREINAMENTO DE HAKI =================== */}
        {activeTab === "haki" && (
          <div>
            <h3 style={{ marginBottom: "5px" }}>🧘 Treinamento de Haki</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
              Desperte as três formas de Haki para fortalecer seu pirata no combate automático.
            </p>
            <div className="shop-grid">
              {HAKI_TRAINING.map((h) => {
                const unlocked = haki[h.key];
                const bossCleared = h.bossRequirement ? worldProgress >= 3 : true;
                const meetsReq = player.level >= h.reqLevel && bossCleared;
                const canAfford = h.cost === 0 || player.berries >= h.cost;
                const canAwaken = !unlocked && meetsReq && canAfford;
                const buttonText = !meetsReq
                  ? "🔒 Requisitos não atendidos"
                  : !canAfford
                  ? "💰 Berries insuficientes"
                  : "⚡ Despertar Haki";
                return (
                  <div key={h.key} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h4>
                        {h.icon} {h.name}
                      </h4>
                      {unlocked && <span className="badge badge-lendaria">Despertado ✓</span>}
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                      🔓 Nível {h.reqLevel}
                      {h.bossRequirement && " + Chefe do Mundo 2 derrotado"}
                    </p>
                    {h.cost > 0 && (
                      <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold", marginBottom: "8px" }}>
                        💰 {h.cost.toLocaleString()} Berries
                      </p>
                    )}
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.6" }}>
                      {h.effects.map((effect, i) => (
                        <div key={i}>✨ {effect}</div>
                      ))}
                    </div>
                    {unlocked ? (
                      <p style={{ color: "var(--accent-green)", fontWeight: "bold", margin: 0 }}>
                        ✔ Haki ativo no combate!
                      </p>
                    ) : (
                      <button
                        onClick={() => awakenHaki(h.key, h.cost, h.name)}
                        disabled={!canAwaken}
                        style={{
                          width: "100%",
                          backgroundColor: canAwaken ? "var(--accent-purple)" : "var(--border-color)",
                          color: canAwaken ? "#fff" : "var(--text-muted)",
                          cursor: canAwaken ? "pointer" : "not-allowed",
                        }}
                      >
                        {buttonText}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ===== ACADEMIA DE TREINAMENTO DE STATUS ===== */}
            <div style={{ marginTop: "30px" }}>
              <h4 style={{ marginBottom: "4px", color: "var(--accent-gold)" }}>🏋️ Academia de Treinamento de Status</h4>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Treine permanentemente seus atributos base gastando Berries. Treinos atuais: 💪 +{trainingAtk} ATK · ❤️ +{trainingHp} HP.
              </p>
              <div className="shop-grid">
                <div className="card">
                  <h4>💪 Treinar Força</h4>
                  <p style={{ fontSize: "13px", color: "var(--accent-green)", marginBottom: "6px" }}>
                    Aumenta o Ataque Base em <strong>+100 ATK</strong> (permanente).
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold", marginBottom: "10px" }}>
                    Custo: 💰 30.000 Berries
                  </p>
                  <button
                    onClick={trainStrength}
                    style={{ width: "100%", backgroundColor: "var(--accent-blue)", color: "#fff" }}
                  >
                    💪 Treinar Força
                  </button>
                </div>
                <div className="card">
                  <h4>❤️ Treinar Vitalidade</h4>
                  <p style={{ fontSize: "13px", color: "var(--accent-green)", marginBottom: "6px" }}>
                    Aumenta a Vida Base em <strong>+350 HP</strong> (permanente).
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold", marginBottom: "10px" }}>
                    Custo: 💰 30.000 Berries
                  </p>
                  <button
                    onClick={trainVitality}
                    style={{ width: "100%", backgroundColor: "var(--accent-green)", color: "#fff" }}
                  >
                    ❤️ Treinar Vitalidade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== ROLETA DE RAÇAS =================== */}
        {activeTab === "race" && (
          <div>
            <h3 style={{ marginBottom: "5px" }}>🧬 Roleta de Raças</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
              Gire a roleta para trocar de raça. Cada raça concede bônus passivos de vida, ataque e esquiva.
            </p>

            <div key={raceRevealKey} className="card fruit-reveal" style={{ maxWidth: "420px", margin: "0 auto 20px auto", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4>
                  {currentRace.icon} {currentRace.name}
                </h4>
                <span className={`badge badge-${currentRace.rarity.toLowerCase()}`}>{currentRace.rarity}</span>
              </div>
              <div style={{ fontSize: "14px", color: "var(--accent-green)", fontWeight: "bold", marginBottom: "6px" }}>
                HP x{currentRace.hpMultiplier} · ATK x{currentRace.atkMultiplier}
                {currentRace.dodgeChance > 0 && <> · Esquiva {currentRace.dodgeChance}%</>}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
                {currentRace.description}
              </p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              {currentTitle.luckBonus > 0 && (
                <div className="luck-indicator" style={{ marginBottom: "12px" }}>
                  ✨ Bônus de Sorte Ativo: +{currentTitle.luckBonus}% ({titleTag})
                </div>
              )}
              <button
                onClick={doRollRace}
                style={{
                  padding: "14px 28px",
                  fontSize: "16px",
                  backgroundColor: "var(--accent-green)",
                  color: "#fff",
                }}
              >
                Girar Raça ({raceRolls} giro(s) grátis · depois 20.000 💰 Berries)
              </button>
            </div>

            <h4 style={{ marginBottom: "10px", color: "var(--accent-gold)" }}>Todas as Raças Existentes</h4>
            <div className="shop-grid">
              {RACES.map((race) => {
                const isCurrent = race.name === currentRace.name;
                return (
                  <div key={race.id} className="card" style={isCurrent ? { borderColor: "var(--accent-green)" } : {}}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4>
                        {race.icon} {race.name}
                      </h4>
                      <span className={`badge badge-${race.rarity.toLowerCase()}`}>{race.rarity}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold", marginBottom: "6px" }}>
                      🎲 Chance: {race.chance}%
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--accent-green)", marginBottom: "6px" }}>
                      ❤️ HP x{race.hpMultiplier} · ⚔️ ATK x{race.atkMultiplier}
                      {race.dodgeChance > 0 && <> · 💨 Esquiva {race.dodgeChance}%</>}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
                      {race.description}
                    </p>
                    {isCurrent && (
                      <p style={{ fontSize: "13px", color: "var(--accent-green)", fontWeight: "bold", margin: "10px 0 0 0" }}>
                        ✔ Raça equipada
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== RAIDS (BATALHAS EM ONDAS) =================== */}
        {activeTab === "raids" && (
          <div>
            <h3 style={{ marginBottom: "5px" }}>☠️ Raids — Batalhas em Ondas Sequenciais</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
              Enfrente chefes em rodadas seguidas. Entre as ondas você recupera 25% da vida perdida. As recompensas são altíssimas!
            </p>
            <div className="shop-grid">
              {RAIDS.map((raid) => {
                const locked = player.level < raid.minLevel;
                return (
                  <div key={raid.id} className="card" style={locked ? { opacity: 0.75 } : {}}>
                    <h4 style={{ marginBottom: "6px" }}>☠️ {raid.title}</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "8px" }}>
                      {raid.description}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--accent-gold)", fontWeight: "bold", marginBottom: "6px" }}>
                      🔒 Nível mínimo: {raid.minLevel}
                      {locked && " (Bloqueado)"}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--accent-green)", marginBottom: "8px" }}>
                      💰 {raid.rewardBerries.toLocaleString()} Berries · ⭐ {raid.rewardXp} XP · 🎲 +{raid.rewardRaceRolls} giro(s) de raça
                    </p>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: "1.6" }}>
                      {raid.waves.map((wave, i) => (
                        <p key={i} style={{ margin: "2px 0" }}>
                          Rodada {i + 1}: {wave.name} (🛡️ {wave.hp} HP · ⚔️ {wave.atk} ATK)
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={() => startRaid(raid)}
                      disabled={locked}
                      style={{
                        width: "100%",
                        backgroundColor: locked ? "var(--border-color)" : "var(--accent-gold)",
                        color: locked ? "var(--text-muted)" : "#000",
                        cursor: locked ? "not-allowed" : "pointer",
                      }}
                    >
                      {locked ? "🔒 Nível insuficiente" : "⚔️ Iniciar Raid"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================== ROLETA DE FRUTAS =================== */}
        {activeTab === "gacha" && (
          <div className="gacha-container">
            <h3>🎲 Roleta da Árvore de Akuma no Mi</h3>
            <p style={{ color: "var(--text-muted)", margin: "8px 0" }}>
              Obtenha frutos lendários com foto, descrição e bônus de atributos!
            </p>

            {activeFruitItem ? (
              <div key={gachaAnimKey} className="card card-legendary fruit-reveal" style={{ maxWidth: "360px", margin: "25px auto", textAlign: "center" }}>
                <FruitImage
                  src={currentFruit?.image}
                  alt={activeFruitItem.name}
                  fallback={currentFruit?.icon}
                  size={130}
                  style={{ marginBottom: "10px" }}
                />
                <h4 style={{ fontSize: "18px" }}>{activeFruitItem.name}</h4>
                <div style={{ margin: "8px 0" }}>
                  <span className={`badge badge-${(currentFruit?.rarity || "comum").toLowerCase()}`}>
                    {currentFruit ? `${currentFruit.type} - ${currentFruit.rarity}` : "Akuma no Mi"}
                  </span>
                  <span className="slot-tag" style={{ marginLeft: "6px" }}>
                    Slot {fruitSlots.activeSlotIndex + 1}/{fruitSlots.maxUnlocked}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "10px 0", lineHeight: "1.4" }}>
                  {currentFruit?.description || "Fruta guardada em um dos seus slots."}
                </p>
                <div style={{ color: "var(--accent-green)", fontWeight: "bold", fontSize: "14px" }}>
                  +{Math.round(fruitAtk)} ATK | +{Math.round(fruitBonusHp)} HP{fruitAwakened && " ✨(Despertada ×10)"}
                </div>
                {fruitAwakened ? (
                  <p style={{ color: "var(--accent-green)", fontWeight: "bold", margin: "12px 0 0 0" }}>
                    ✨ Fruta Despertada — bônus multiplicados por 10!
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "10px 0 6px 0" }}>
                      🔓 Requisito: Nível 40 · Custo: 💰 500.000 Berries
                    </p>
                    <button
                      onClick={awakenFruit}
                      style={{
                        width: "100%",
                        backgroundColor: player.level >= 40 ? "var(--accent-purple)" : "var(--border-color)",
                        color: player.level >= 40 ? "#fff" : "var(--text-muted)",
                        cursor: player.level >= 40 ? "pointer" : "not-allowed",
                      }}
                    >
                      ⚡ Despertar Fruta
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="card" style={{ maxWidth: "360px", margin: "25px auto" }}>
                <p style={{ color: "var(--text-muted)" }}>Você ainda não possui nenhuma Akuma no Mi. Gire a roleta para obter a primeira!</p>
              </div>
            )}

            {currentTitle.luckBonus > 0 && (
              <div className="luck-indicator">
                ✨ Bônus de Sorte Ativo: +{currentTitle.luckBonus}% ({titleTag})
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

        {/* =================== TÍTULOS =================== */}
        {activeTab === "titles" && (
          <div>
            <h3 style={{ marginBottom: "5px" }}>🏆 Títulos de Pirata</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
              Equipe um título desbloqueado para ganhar bônus percentual de sorte nas roletas de Fruta e Raça. Título equipado:{" "}
              <strong style={{ color: "var(--accent-gold)" }}>{titleTag}</strong> (sorte +{currentTitle.luckBonus}%).
            </p>

            <div className="shop-grid">
              {TITLES.map((title) => {
                const isUnlocked = unlockedTitles.includes(title.id);
                const isEquipped = equippedTitle === title.id;
                return (
                  <div
                    key={title.id}
                    className={`card title-card ${isUnlocked ? "title-unlocked" : ""} ${isEquipped ? "title-equipped" : ""}`}
                  >
                    <div className="title-card-head">
                      <span className="title-icon">{title.icon}</span>
                      <h4 style={{ margin: 0, flex: 1 }}>{title.name}</h4>
                      {isEquipped && <span className="badge badge-lendaria">Equipado</span>}
                    </div>
                    <p className="title-luck">✨ Bônus de Sorte: +{title.luckBonus}%</p>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "8px" }}>
                      {title.description}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "12px" }}>
                      🔓 {title.requirement}
                    </p>

                    {!isUnlocked ? (
                      <span className="title-status title-locked">🔒 Bloqueado</span>
                    ) : !isEquipped ? (
                      <button className="title-equip-btn" onClick={() => equipTitle(title.id)}>
                        Equipar
                      </button>
                    ) : (
                      <span className="title-status title-current">✔ Título ativo</span>
                    )}
                  </div>
                );
              })}
            </div>
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
            showToast(msg, "error");
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
            showToast("Você foi derrotado! Treine mais e tente novamente.", "error");
            setActiveCombat(null);
          }}
        />
      )}

      {activeRaid && (
        <RaidModal
          player={player}
          raid={activeRaid}
          totalAtk={totalAtk}
          playerMaxHp={totalHp}
          onVictory={handleRaidVictory}
          onDefeat={() => {
            showToast("Você foi derrotado na Raid! Treine mais e tente novamente.", "error");
            setActiveRaid(null);
          }}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO AO REPETIR COM FRUTA LENDÁRIA EQUIPADA */}
      {confirmReroll && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card card-legendary" style={{ maxWidth: "430px", width: "90%", textAlign: "center", padding: "25px" }}>
            <h3 style={{ color: "var(--accent-gold)" }}>⚠️ Girar novamente?</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.5", margin: "12px 0" }}>
              Você já tem uma Akuma no Mi Lendária equipada (<strong>{activeFruitItem?.name}</strong>, Slot {fruitSlots.activeSlotIndex + 1})! Tem certeza de que deseja girar
              novamente e arriscar perdê-la? A fruta será guardada em outro slot ou substituirá a atual.
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

      {/* MODAL DE ESCOLHA DE SLOT (item novo obtido com todos os slots ocupados) */}
      {pendingItem && (
        <SlotPickerModal
          kind={pendingItem.kind}
          item={pendingItem.item}
          slots={pendingItem.kind === "weapon" ? weaponSlots : fruitSlots}
          onSelect={handlePendingSlotSelect}
        />
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
    </div>
  );
}