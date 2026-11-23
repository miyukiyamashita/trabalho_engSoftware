import { ForbiddenException } from '@nestjs/common';
import { TipoUsuario } from '../classes/tipo-usuario';

/** Usuário extraído do token JWT (ver JwtStrategy.validate). */
export interface UsuarioLogado {
  id: string;
  email: string;
  tipo: TipoUsuario | string;
  nome?: string;
  escolaId?: string | null;
  perfilId?: string | null;
}

export function somenteDigitos(valor: unknown) {
  return String(valor ?? '').replace(/\D/g, '');
}

/** Escola do administrador escolar logado. */
export function escolaDoUsuario(user: UsuarioLogado): string {
  if (!user?.escolaId) {
    throw new ForbiddenException('Seu usuário não está vinculado a nenhuma escola.');
  }
  return String(user.escolaId);
}

/** Checagem de dono (RNF02): o registro precisa pertencer à escola do usuário. */
export function garantirMesmaEscola(user: UsuarioLogado, registro: { escolaId?: any } | null) {
  if (user?.tipo === TipoUsuario.ADMIN_SISTEMA) return;
  if (!registro || String(registro.escolaId ?? '') !== String(user?.escolaId ?? '')) {
    throw new ForbiddenException('Este registro pertence a outra escola.');
  }
}
