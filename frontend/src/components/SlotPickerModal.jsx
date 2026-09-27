import React from "react";
import FruitImage from "./FruitImage";
import { findFruitById, findWeaponById } from "../utils/equipmentSlots";

const WEAPON_ICONS = { Comum: "🪓", Rara: "🔱", Épica: "⚔️", Lendária: "🗡️" };

// Modal exibido quando todos os slots desbloqueados já estão ocupados:
// o jogador escolhe em qual slot guardar (substituindo) o item novo.
// Não há cancelamento de propósito — o item já foi conquistado/pago.
export default function SlotPickerModal({ kind, item, slots, onSelect }) {
  const isWeapon = kind === "weapon";
  const catalogItem = isWeapon ? findWeaponById(item.id) : findFruitById(item.id);
  const rarity = catalogItem?.rarity;
  const icon = isWeapon ? WEAPON_ICONS[rarity] || "⚔️" : catalogItem?.icon || "🍍";
  const unlockedIndexes = slots.items.map((slotItem, index) => (index < slots.maxUnlocked ? index : -1)).filter((index) => index >= 0);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Escolher slot">
      <div className="modal-content slot-picker">
        <h3 className="slot-picker-title">🗂️ Escolha o slot</h3>
        <p className="slot-picker-subtitle">
          Todos os {slots.maxUnlocked} slots já estão ocupados. Escolha onde guardar o item novo — o conteúdo atual do slot será substituído.
        </p>

        <div className="slot-picker-item">
          {isWeapon ? (
            <span className="slot-picker-icon" aria-hidden="true">
              {icon}
            </span>
          ) : (
            <FruitImage src={catalogItem?.image} alt={item.name} fallback={icon} size={56} />
          )}
          <div className="slot-picker-item-info">
            <strong>{item.name}</strong>
            <span className="slot-picker-item-stats">
              {isWeapon ? (
                <>⚔️ +{item.atk} ATK</>
              ) : (
                <>
                  ⚔️ +{item.atk} ATK · ❤️ +{item.hp} HP
                </>
              )}
            </span>
            {rarity && <span className={`slot-tag slot-tag-${rarity.toLowerCase()}`}>{rarity}</span>}
          </div>
        </div>

        <div className="slot-picker-options">
          {unlockedIndexes.map((index) => {
            const current = slots.items[index];
            const isActive = slots.activeSlotIndex === index;
            return (
              <button key={index} type="button" className={`slot-picker-option ${isActive ? "active" : ""}`} onClick={() => onSelect(index)}>
                <span className="slot-picker-option-head">Slot {index + 1}</span>
                <strong className="slot-picker-option-name">{current ? current.name : "Slot Vazio"}</strong>
                <span className="slot-picker-option-hint">
                  {isActive ? "⚠️ Equipado hoje · será substituído" : current ? "⚠️ Será substituído" : "✨ Guardar aqui"}
                </span>
              </button>
            );
          })}
        </div>

        <p className="slot-picker-note">💡 Desbloqueie mais slots na aba Slots para guardar todos os seus itens.</p>
      </div>
    </div>
  );
}
