// ===== PERSISTÊNCIA DE SESSÃO (localStorage) =====
// A sessão fica em "user_session" = { token, user }, o save do jogador em
// "minirpg_save" (reescrito a cada mudança de progresso pelo Game.jsx) e o JWT
// também é espelhado em "token" para o interceptor do api.js.

export const SESSION_KEY = "user_session";
export const TOKEN_KEY = "token";
export const SAVE_KEY = "minirpg_save";

// O localStorage pode lançar exceção (navegação privada, storage desabilitado,
// cota estourada) — nenhuma dessas falhas pode derrubar o jogo.
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // armazenamento indisponível — a sessão segue apenas em memória
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // idem
  }
}

function parseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// O backend não expõe endpoint de validação de token, então conferimos apenas a
// data de expiração do JWT (campo "exp", em segundos) para não devolver ao jogo
// um jogador cujo save passaria a ser rejeitado com 401/403. A validação real
// continua sendo o authenticateToken do backend.
export function isTokenExpired(token) {
  if (!token) return true;
  const payload = token.split(".")[1];
  if (!payload) return false;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const json = decodeURIComponent(
      binary.split("").map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
    );
    const { exp } = JSON.parse(json);
    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    // token não legível como JWT: não bloqueia o jogador
    return false;
  }
}

// Grava a sessão ativa e semeia o save com o estado devolvido pelo login
export function saveSession({ token, user } = {}) {
  if (!token || !user) return;
  safeSet(SESSION_KEY, JSON.stringify({ token, user }));
  safeSet(TOKEN_KEY, token);
  savePlayerSnapshot(user);
}

// Lê a sessão salva; devolve null ( limpando o storage) se estiver corrompida ou expirada
export function getSession() {
  const raw = safeGet(SESSION_KEY);
  if (!raw) return null;

  const parsed = parseJSON(raw);
  if (!parsed || typeof parsed !== "object" || !parsed.user || typeof parsed.user !== "object") {
    clearSession();
    return null;
  }
  if (isTokenExpired(parsed.token)) {
    clearSession();
    return null;
  }
  return parsed;
}

// Encerra a sessão: some com o login, o token e o save daquele pirata
export function clearSession() {
  safeRemove(SESSION_KEY);
  safeRemove(TOKEN_KEY);
  safeRemove(SAVE_KEY);
}

export function savePlayerSnapshot(player) {
  if (!player) return;
  safeSet(SAVE_KEY, JSON.stringify(player));
}

export function getPlayerSnapshot() {
  const parsed = parseJSON(safeGet(SAVE_KEY));
  return parsed && typeof parsed === "object" ? parsed : null;
}

// Player a devolver no F5: o save local é sempre mais recente que o login, mas
// só vale a pena se for do mesmo pirata da sessão (navegador compartilhado).
export function restorePlayer(session) {
  if (!session?.user) return null;
  const snapshot = getPlayerSnapshot();
  return snapshot && snapshot.username === session.user.username ? snapshot : session.user;
}

// Token usado pelo interceptor do api.js (cai para a chave legada "token")
export function getSessionToken() {
  const parsed = parseJSON(safeGet(SESSION_KEY));
  return parsed?.token || safeGet(TOKEN_KEY);
}
