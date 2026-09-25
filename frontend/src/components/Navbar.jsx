import React, { useState } from "react";

export default function Navbar({ player, nickname, avatarIcon, titleTag, xpPercent, onLogout, onSaveNickname }) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(nickname);

  const handleSave = () => {
    if (onSaveNickname(nameInput)) {
      setEditing(false);
    }
  };

  return (
    <header className="game-header">
      <div className="header-left">
        <div className="header-avatar" title={nickname}>
          {avatarIcon}
        </div>

        <div className="header-identity">
          {titleTag && <span className="header-title-badge">{titleTag}</span>}

          {editing ? (
            <div className="header-name-editor">
              <input
                className="header-name-input"
                type="text"
                value={nameInput}
                maxLength={24}
                autoFocus
                placeholder="Nome do pirata"
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setNameInput(nickname);
                    setEditing(false);
                  }
                }}
              />
              <button className="btn-xs btn-save" onClick={handleSave}>
                Salvar
              </button>
              <button
                className="btn-xs btn-cancel"
                onClick={() => {
                  setNameInput(nickname);
                  setEditing(false);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="header-name-row">
              <h1 className="header-name">
                {nickname}
                <span className="header-level">Nível {player.level}</span>
              </h1>
              <button
                className="header-edit-btn"
                title="Editar nome de pirata"
                aria-label="Editar nome de pirata"
                onClick={() => {
                  setNameInput(nickname);
                  setEditing(true);
                }}
              >
                ✏️
              </button>
            </div>
          )}

          <div className="header-xp">
            <div className="header-xp-bar">
              <div className="header-xp-fill" style={{ width: `${Math.min(100, Math.max(0, xpPercent))}%` }} />
            </div>
            <span className="header-xp-label">{Math.round(xpPercent)}% para o próximo nível</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <span className="header-badge header-badge-berries">
          💰 <strong>{player.berries?.toLocaleString()}</strong>
        </span>
        <span className="header-badge header-badge-bounty">
          ☠️ <strong>{player.bounty?.toLocaleString()}</strong>
        </span>
        <button className="btn-logout" onClick={onLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}