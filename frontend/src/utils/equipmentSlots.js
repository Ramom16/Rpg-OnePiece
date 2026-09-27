import { WEAPONS } from "../data/weapons";
import { FRUITS } from "../data/fruits";

// ==========================================
// SISTEMA DE SLOTS DE ARMAS E AKUMA NO MI
// ==========================================
// Cada tipo de equipamento (arma / fruta) possui 3 slots. O jogador começa
// com 1 slot liberado e desbloqueia os demais por 50.000 Berries cada.
// Somente o item do slot ATIVO entra no cálculo de ATK/HP do personagem.
//
// Formato persistido (JSON no banco + localStorage):
//   {
//     maxUnlocked: 1..3,
//     activeSlotIndex: 0..maxUnlocked-1,
//     items: [ { id, name, atk, refine } | null, null, null ]         // armas
//     items: [ { id, name, atk, hp, isAwakened } | null, null, null ]  // frutas
//   }
// ==========================================

export const MAX_SLOTS = 3;
export const SLOT_UNLOCK_COST = 50000;
export const MAX_REFINE = 10;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toInt = (value, fallback) => (Number.isFinite(Number(value)) ? Math.round(Number(value)) : fallback);
const toNum = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

// Os slots são JSON livre no banco: normaliza os campos numéricos de cada tipo
// para que um save antigo ou editado à mão nunca quebre o cálculo de atributos.
const sanitizeWeaponItem = (item) => ({
  ...item,
  id: item.id ?? null,
  name: item.name || "Espada desconhecida",
  atk: toNum(item.atk),
  refine: clamp(toInt(item.refine, 0), 0, MAX_REFINE),
});

const sanitizeFruitItem = (item) => ({
  ...item,
  id: item.id ?? null,
  name: item.name || "Akuma no Mi desconhecida",
  atk: toNum(item.atk),
  hp: toNum(item.hp),
  isAwakened: !!item.isAwakened,
});

// Estrutura inicial: 1 slot liberado e todos os slots vazios
const createSlots = () => ({ maxUnlocked: 1, activeSlotIndex: 0, items: [null, null, null] });

// Converte um item do catálogo (loja/gacha) para o formato guardado no slot
export const toWeaponSlotItem = (weapon, refine = 0) => ({
  id: weapon.id,
  name: weapon.name,
  atk: toNum(weapon.atk),
  refine: clamp(toInt(refine, 0), 0, MAX_REFINE),
});

export const toFruitSlotItem = (fruit) => ({
  id: fruit.id,
  name: fruit.name,
  atk: toNum(fruit.bonusAtk),
  hp: toNum(fruit.bonusHp),
  isAwakened: false,
});

const findWeaponById = (id) => WEAPONS.find((weapon) => weapon.id === id) || null;
const findFruitById = (id) => FRUITS.find((fruit) => fruit.id === id) || null;
const findWeaponByName = (name) => WEAPONS.find((weapon) => weapon.name === name) || null;
const findFruitByName = (name) => FRUITS.find((fruit) => fruit.name === name) || null;

// Garante que a lista tenha exatamente MAX_SLOTS posições
const padItems = (items) =>
  Array.from({ length: MAX_SLOTS }, (_, index) => {
    const item = Array.isArray(items) ? items[index] : null;
    return item && typeof item === "object" ? item : null;
  });

// Valida e completa uma estrutura de slots que já existe no save
const hydrateSlots = (raw, sanitizeItem) => {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) return null;

  const maxUnlocked = clamp(toInt(raw.maxUnlocked, 1), 1, MAX_SLOTS);
  const items = padItems(raw.items).map((item) => (item ? sanitizeItem(item) : null));

  return {
    maxUnlocked,
    activeSlotIndex: clamp(toInt(raw.activeSlotIndex, 0), 0, maxUnlocked - 1),
    items,
  };
};

// Reconstrói os slots a partir dos campos antigos do save (weapon_name / fruit_name)
const slotsFromLegacy = (legacyName, findByName, toSlotItem) => {
  const slots = createSlots();
  const catalogItem = legacyName ? findByName(legacyName) : null;
  if (catalogItem) slots.items[0] = toSlotItem(catalogItem);
  return slots;
};

// Normaliza os slots de arma, aceitando saves antigos ainda sem o sistema
export function normalizeWeaponSlots(raw, legacy) {
  return (
    hydrateSlots(raw, sanitizeWeaponItem) ??
    slotsFromLegacy(legacy?.weapon_name, findWeaponByName, (weapon) => toWeaponSlotItem(weapon, toInt(legacy?.refine_weapon, 0)))
  );
}

// Normaliza os slots de fruta, aceitando saves antigos ainda sem o sistema
export function normalizeFruitSlots(raw, legacy) {
  return (
    hydrateSlots(raw, sanitizeFruitItem) ??
    slotsFromLegacy(legacy?.fruit_name, findFruitByName, (fruit) => ({ ...toFruitSlotItem(fruit), isAwakened: !!legacy?.fruit_awakened }))
  );
}

// Item do slot indicado (ou null)
const slotItemAt = (slots, index) => slots.items[index] ?? null;

// Item equipado no momento — fonte de verdade dos atributos do personagem
export const getActiveWeaponItem = (slots) => slotItemAt(slots, slots.activeSlotIndex);
export const getActiveFruitItem = (slots) => slotItemAt(slots, slots.activeSlotIndex);

// Primeiro slot livre entre os desbloqueados (destino padrão de um item novo)
export const findFreeSlotIndex = (slots) => slots.items.findIndex((item, index) => index < slots.maxUnlocked && !item);

// Guarda o item no primeiro slot livre e o ativa.
// Devolve null quando todos os slots desbloqueados já estão ocupados.
export const storeInFreeSlot = (slots, item) => {
  const freeIndex = findFreeSlotIndex(slots);
  return freeIndex >= 0 ? putItemInSlot(slots, freeIndex, item) : null;
};

// Ativa um slot — só slots desbloqueados e ocupados podem ser ativados
export const setActiveSlot = (slots, index) => {
  if (index < 0 || index >= slots.maxUnlocked || !slots.items[index]) return slots;
  if (slots.activeSlotIndex === index) return slots;
  return { ...slots, activeSlotIndex: index };
};

// Guarda um item no slot indicado e o ativa (substitui o item anterior, se houver)
export const putItemInSlot = (slots, index, item) => {
  if (index < 0 || index >= slots.maxUnlocked) return slots;
  const items = [...slots.items];
  items[index] = item;
  return { ...slots, items, activeSlotIndex: index };
};

// Esvazia um slot (desequipar). O slot continua ativo, apenas sem item.
export const clearSlot = (slots, index) => {
  if (index < 0 || index >= MAX_SLOTS || !slots.items[index]) return slots;
  const items = [...slots.items];
  items[index] = null;
  return { ...slots, items };
};

// Desbloqueia o próximo slot (limite de MAX_SLOTS)
export const unlockNextSlot = (slots) => {
  if (slots.maxUnlocked >= MAX_SLOTS) return slots;
  return { ...slots, maxUnlocked: slots.maxUnlocked + 1 };
};

// Atualiza o item do slot ativo preservando os demais campos
export const updateActiveItem = (slots, patch) => {
  const index = slots.activeSlotIndex;
  if (!slots.items[index]) return slots;
  const items = [...slots.items];
  items[index] = { ...items[index], ...patch };
  return { ...slots, items };
}

// Indica se o save ainda usa os campos antigos (ou está incompleto) e exige migração
const needsMigration = (player) => !hydrateSlots(player.weaponSlots, sanitizeWeaponItem) || !hydrateSlots(player.fruitSlots, sanitizeFruitItem);

// Migra saves antigos (weapon_name / fruit_name) para o sistema de slots
export function migratePlayerToSlots(player) {
  if (!player || !needsMigration(player)) return player;
  return {
    ...player,
    weaponSlots: normalizeWeaponSlots(player.weaponSlots, player),
    fruitSlots: normalizeFruitSlots(player.fruitSlots, player),
  };
}

// Mantém as colunas antigas do banco em sincronia com o slot ativo, para que
// os saves continuem coerentes mesmo para quem ainda lê os campos legados.
export function syncLegacyEquipFields(player) {
  if (!player) return player;
  const weapon = getActiveWeaponItem(normalizeWeaponSlots(player.weaponSlots, player));
  const fruit = getActiveFruitItem(normalizeFruitSlots(player.fruitSlots, player));

  return {
    ...player,
    weapon_name: weapon ? weapon.name : null,
    refine_weapon: weapon ? weapon.refine : 0,
    fruit_name: fruit ? fruit.name : null,
    fruit_awakened: fruit ? !!fruit.isAwakened : false,
  };
}

// Busca o item original no catálogo (usado pela UI para exibir raridade e imagem)
export { findWeaponById, findFruitById };
