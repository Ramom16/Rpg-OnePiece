import React from "react";
import FruitImage from "./FruitImage";
import { MAX_SLOTS, SLOT_UNLOCK_COST, findFruitById, findWeaponById } from "../utils/equipmentSlots";

// Emoji de cada raridade de espada (WEAPONS não possui imagem)
const WEAPON_ICONS = { Comum: "🪓", Rara: "🔱", Épica: "⚔️", Lendária: "🗡️" };

// Card de um único slot: ocupado/equipado, vazio ou bloqueado
function SlotCard({ index, item, isActive, isUnlocked, berries, kind, onEquip, onUnequip, onUnlock }) {
  const isWeapon = kind === "weapon";
  const catalogItem = isWeapon ? findWeaponById(item?.id) : findFruitById(item?.id);
  const rarity = catalogItem?.rarity;
  const icon = isWeapon ? WEAPON_ICONS[rarity] || "⚔️" : catalogItem?.icon || "🍍";

  // ---- SLOT BLOQUEADO ----
  if (!isUnlocked) {
    const canAfford = berries >= SLOT_UNLOCK_COST;
    return (
      <div className="slot-card slot-locked">
        <span className="slot-number">Slot {index + 1}</span>
        <span className="slot-icon" aria-hidden="true">
          🔒
        </span>
        <strong className="slot-empty-label">Slot Bloqueado</strong>
        <span className="slot-hint">Desbloqueie para guardar mais {isWeapon ? "espadas" : "frutas"}</span>
        <button
          type="button"
          className="slot-action"
          onClick={() => onUnlock(kind)}
          disabled={!canAfford}
          title={canAfford ? undefined : "Berries insuficientes"}
        >
          {canAfford ? `🔓 Desbloquear (${SLOT_UNLOCK_COST.toLocaleString()} 💰)` : "💰 Berries insuficientes"}
        </button>
      </div>
    );
  }

  // ---- SLOT DESBLOQUEADO E VAZIO ----
  if (!item) {
    return (
      <div className={`slot-card slot-empty ${isActive ? "active" : ""}`}>
        <span className="slot-number">Slot {index + 1}</span>
        <span className="slot-icon" aria-hidden="true">
          {isWeapon ? "🗡️" : "🍍"}
        </span>
        <strong className="slot-empty-label">Slot Vazio</strong>
        <span className="slot-hint">Pronto para receber um novo item</span>
      </div>
    );
  }

  // ---- SLOT COM ITEM ----
  const refinedAtk = isWeapon ? Math.round(item.atk * (1 + item.refine * 0.15)) : item.atk;
  const fruitMult = item.isAwakened ? 10 : 1;

  return (
    <div className={`slot-card slot-filled ${isActive ? "active" : ""}`}>
      <div className="slot-top">
        <span className="slot-number">Slot {index + 1}</span>
        {isActive ? (
          <span className="slot-badge slot-badge-active">EQUIPADO</span>
        ) : (
          <span className="slot-badge">Guardado</span>
        )}
      </div>

      <span className="slot-item-icon" aria-hidden="true">
        {isWeapon ? (
          <span className="slot-item-emoji">{icon}</span>
        ) : (
          <FruitImage src={catalogItem?.image} alt={item.name} fallback={icon} size={54} />
        )}
      </span>

      <strong className="slot-item-name">{item.name}</strong>

      <div className="slot-item-tags">
        {isWeapon ? (
          <span className={`slot-tag slot-tag-${(rarity || "comum").toLowerCase()}`}>+{item.refine}</span>
        ) : (
          <>
            {rarity && <span className={`slot-tag slot-tag-${rarity.toLowerCase()}`}>{rarity}</span>}
            {item.isAwakened && <span className="slot-tag slot-tag-awakened">✨ Desperta</span>}
          </>
        )}
      </div>

      <span className="slot-item-stats">
        {isWeapon ? (
          <>⚔️ +{refinedAtk} ATK{item.refine > 0 && <em> (base +{item.atk})</em>}</>
        ) : (
          <>
            ⚔️ +{Math.round(refinedAtk * fruitMult)} ATK · ❤️ +{Math.round(item.hp * fruitMult)} HP
            {item.isAwakened && <em> (×10)</em>}
          </>
        )}
      </span>

      {isActive ? (
        <button type="button" className="slot-action slot-action-ghost" onClick={() => onUnequip(kind, index)}>
          ✖ Desequipar
        </button>
      ) : (
        <button type="button" className="slot-action" onClick={() => onEquip(kind, index)}>
          ⚔️ Equipar
        </button>
      )}
    </div>
  );
}

// Painel de um tipo de equipamento (armas ou frutas) com seus 3 slots
function SlotPanel({ kind, title, subtitle, slots, berries, onEquip, onUnequip, onUnlock }) {
  const allUnlocked = slots.maxUnlocked >= MAX_SLOTS;

  return (
    <section className={`slots-panel slots-panel-${kind}`}>
      <header className="slots-panel-head">
        <div>
          <h3 className="slots-panel-title">{title}</h3>
          <p className="slots-panel-subtitle">{subtitle}</p>
        </div>
        <span className="slots-panel-count">
          {slots.maxUnlocked}/{MAX_SLOTS} liberados
        </span>
      </header>

      <div className="slots-row">
        {Array.from({ length: MAX_SLOTS }, (_, index) => (
          <SlotCard
            key={index}
            index={index}
            kind={kind}
            item={slots.items[index]}
            isActive={slots.activeSlotIndex === index}
            isUnlocked={index < slots.maxUnlocked}
            berries={berries}
            onEquip={onEquip}
            onUnequip={onUnequip}
            onUnlock={onUnlock}
          />
        ))}
      </div>

      {allUnlocked && <p className="slots-panel-note">✔ Todos os slots liberados — você pode guardar {kind === "weapon" ? "3 espadas" : "3 Akuma no Mi"}.</p>}
    </section>
  );
}

// Gerenciador de slots: dois painéis lado a lado (armas + Akuma no Mi)
export default function EquipmentSlots({ weaponSlots, fruitSlots, berries, onEquip, onUnequip, onUnlock }) {
  return (
    <div className="slots-manager">
      <SlotPanel
        kind="weapon"
        title="🗡️ Slots de Espadas"
        subtitle="Guarde várias armas e equipe a melhor para cada situação."
        slots={weaponSlots}
        berries={berries}
        onEquip={onEquip}
        onUnequip={onUnequip}
        onUnlock={onUnlock}
      />
      <SlotPanel
        kind="fruit"
        title="🍍 Slots de Akuma no Mi"
        subtitle="Cada fruta pode ser despertada individualmente e somada ao seu poder."
        slots={fruitSlots}
        berries={berries}
        onEquip={onEquip}
        onUnequip={onUnequip}
        onUnlock={onUnlock}
      />
    </div>
  );
}
