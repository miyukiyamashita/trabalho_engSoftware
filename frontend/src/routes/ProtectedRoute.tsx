import { Navigate } from "react-router-dom";
import { useAuth, type Perfil } from "../contexts/AuthContext";
import type { JSX } from "react/jsx-runtime";
import { Carregando } from "../components/Campos";

interface Props {
  children: JSX.Element;
  allowedRoles?: Perfil[];
}

/** Bloqueio de rota na interface (o backend também bloqueia: RNF02). */
export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <Carregando texto="Verificando sua sessão..." />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.tipo)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
