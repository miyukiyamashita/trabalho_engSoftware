import axios from "axios";

/**
 * Cliente HTTP único do frontend (T1/T21/RNF08).
 * - baseURL vem de VITE_API_URL (arquivo .env do frontend);
 * - envia o token JWT em toda requisição;
 * - se a sessão expirar (401), limpa o token e volta para o login.
 */
export const TOKEN_KEY = "token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const status = erro?.response?.status;
    const ehLogin = String(erro?.config?.url ?? "").includes("/auth/login");
    if (status === 401 && !ehLogin && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign("/login?sessao=expirada");
    }
    return Promise.reject(erro);
  }
);
