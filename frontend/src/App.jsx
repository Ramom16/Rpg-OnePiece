import React, { useState } from "react";
import Login from "./pages/Login";
import Game from "./pages/Game";

export default function App() {
  const [player, setPlayer] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
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