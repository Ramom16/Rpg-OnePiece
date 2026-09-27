import axios from "axios";
import { getSessionToken } from "../utils/session";

const API = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Anexa o Token JWT automaticamente em todas as requisições protegidas
API.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;