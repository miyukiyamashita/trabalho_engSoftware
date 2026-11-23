import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { TipoUsuario } from '../classes/tipo-usuario';

/** Usuário logado (preenchido pelo JwtAuthGuard). */
export const Usuario = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user;
});

export const IS_PUBLIC_KEY = 'isPublic';
/** Marca a rota como aberta (sem token). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Perfis autorizados a usar a rota (matriz Perfil × RF do documento). */
export const Roles = (...perfis: TipoUsuario[]) => SetMetadata(ROLES_KEY, perfis);
