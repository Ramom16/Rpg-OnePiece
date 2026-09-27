import React, { useState } from "react";
import API from "../services/api";
import { saveSession } from "../utils/session";

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const endpoint = isRegister ? "/register" : "/login";

    try {
      const response = await API.post(endpoint, { username, password });

      if (isRegister) {
        setMessage("Cadastrado com sucesso! Faça login para jogar.");
        setIsRegister(false);
      } else {
        // Persiste a sessão para o F5 não derrubar o jogador de volta no login
        saveSession({ token: response.data.token, user: response.data.player });
        onLoginSuccess(response.data.player);
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "Erro na requisição");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px", textAlign: "center" }}>
      <h2>🏴‍☠️ Mini RPG One Piece</h2>
      <h3>{isRegister ? "Criar Conta de Pirata" : "Entrar no Jogo"}</h3>

      {message && <p style={{ color: "orange" }}>{message}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input 
          type="text" 
          placeholder="Nome do Pirata" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Senha" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" style={{ padding: "10px", fontWeight: "bold" }}>
          {isRegister ? "Cadastrar" : "Entrar"}
        </button>
      </form>

      <button 
        onClick={() => setIsRegister(!isRegister)} 
        style={{ marginTop: "15px", background: "none", border: "none", color: "#007bff", cursor: "pointer" }}
      >
        {isRegister ? "Já tem conta? Faça Login" : "Não tem conta? Cadastre-se"}
      </button>
    </div>
  );
}