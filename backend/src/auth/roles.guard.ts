import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../common/decorators';
import { TipoUsuario } from '../classes/tipo-usuario';

/**
 * Restrição por perfil (RNF02), conforme a relação Perfil × RF do documento:
 *  Admin Escolar: RF01, RF02, RF05, RF06–RF10, RF14 · Admin Sistema: RF02–RF04
 *  Professor: RF02, RF10–RF12 · Responsável: RF02, RF13, RF14
 * A checagem de "dono" (escola, turma, filho) é feita nos serviços (AcessoService/escopo).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const alvo = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, alvo)) return true;

    const perfis = this.reflector.getAllAndOverride<TipoUsuario[]>(ROLES_KEY, alvo);
    if (!perfis || perfis.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !perfis.includes(user.tipo)) {
      throw new ForbiddenException('Seu perfil não tem permissão para esta ação.');
    }
    return true;
  }
}
