import React, { useState } from "react";
import Login from "./pages/Login";
import Game from "./pages/Game";
import { clearSession, getSession, restorePlayer } from "./utils/session";

export default function App() {
  // SESSÃO RESTAURADA NO PRIMEIRO RENDER: o localStorage é síncrono, então não há
  // efeito nem estado de carregamento — o F5 devolve o pirata direto para o jogo,
  // sem a piscada da tela de login.
  const [player, setPlayer] = useState(() => restorePlayer(getSession()));

  const handleLogout = () => {
    clearSession();
    setPlayer(null);
  };

  return (
    <div>
      {!player ? (
        <Login onLoginSuccess={(playerData) => setPlayer(playerData)} />
      ) : (
        <Game player={player} setPlayer={setPlayer} onLogout={handleLogout} />
      )}
    </div>
  );
}
