import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY } from "../services/api";

export type Perfil = "admin_sistema" | "admin_escolar" | "prof" | "responsavel";

export type User = {
  id: string;
  nome: string;
  email: string;
  tipo: Perfil;
  escolaId: string | null;
  perfilId: string | null;
  escola?: { id: string; nome: string; setorEducacional: string } | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/** Rota inicial de cada perfil. */
export const ROTA_INICIAL: Record<Perfil, string> = {
  admin_sistema: "/admin-sistema",
  admin_escolar: "/admin-escolar/dashboard",
  prof: "/prof/dashboard",
  responsavel: "/responsavel",
};

/** O usuário é identificado pelo token + GET /auth/me (T11), nunca por um e-mail salvo no navegador. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function login(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    const response = await api.get<User>("/auth/me");
    setUser(response.data);
    return response.data;
  }

  /** Logout real (T10): apaga o token e o usuário em memória. */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("usuario_email");
    setUser(null);
  }, []);

  useEffect(() => {
    async function carregarUsuario() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<User>("/auth/me");
        setUser(response.data);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    }
    carregarUsuario();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
