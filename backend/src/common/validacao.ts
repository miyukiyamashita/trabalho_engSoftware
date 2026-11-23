import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  Matches,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { applyDecorators } from '@nestjs/common';

/** Junta os erros do class-validator em { campo: mensagem } para a tela exibir abaixo de cada campo (H9). */
function achatar(erros: ValidationError[], prefixo = ''): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const erro of erros) {
    const caminho = prefixo ? `${prefixo}.${erro.property}` : erro.property;
    if (erro.constraints) {
      // A primeira regra declarada costuma ser "obrigatório"; o class-validator devolve na ordem inversa.
      const mensagens = Object.values(erro.constraints);
      campos[caminho] = mensagens[mensagens.length - 1];
    }
    if (erro.children?.length) Object.assign(campos, achatar(erro.children, caminho));
  }
  return campos;
}

/** ValidationPipe global (H5): remove campos desconhecidos e devolve mensagens por campo. */
export function criarValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (erros) => {
      const campos = achatar(erros);
      return new BadRequestException({
        message: 'Há campos com problema. Corrija os itens destacados e tente novamente.',
        campos,
      });
    },
  });
}

export const Obrigatorio = (rotulo: string, max = 200) =>
  applyDecorators(
    MaxLength(max, { message: `${rotulo}: use no máximo ${max} caracteres.` }),
    IsString({ message: `${rotulo}: informe um texto.` }),
    IsNotEmpty({ message: `Preencha o campo ${rotulo}.` }),
  );

export const Cpf = (rotulo = 'CPF') =>
  applyDecorators(
    Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
      message: `${rotulo} inválido: digite os 11 números (ex.: 123.456.789-09).`,
    }),
    IsNotEmpty({ message: `Preencha o campo ${rotulo}.` }),
  );

export const Cnpj = () =>
  applyDecorators(
    Matches(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, {
      message: 'CNPJ inválido: digite os 14 números (ex.: 12.345.678/0001-90).',
    }),
    IsNotEmpty({ message: 'Preencha o campo CNPJ.' }),
  );

export const Telefone = (rotulo = 'Telefone') =>
  applyDecorators(
    Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
      message: `${rotulo} inválido: informe DDD e número (ex.: (32) 99999-1234).`,
    }),
    IsNotEmpty({ message: `Preencha o campo ${rotulo}.` }),
  );

export const Email = (rotulo = 'E-mail') =>
  applyDecorators(
    IsEmail({}, { message: `${rotulo} inválido: use o formato nome@dominio.com.` }),
    IsNotEmpty({ message: `Preencha o campo ${rotulo}.` }),
  );

/** Data no formato AAAA-MM-DD, válida e não futura. */
export function DataPassada(rotulo: string, options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'dataPassada',
      target: object.constructor,
      propertyName,
      options: { message: `${rotulo} inválida: escolha uma data válida que não seja futura.`, ...options },
      validator: {
        validate(valor: unknown) {
          if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
          const data = new Date(`${valor}T12:00:00Z`);
          const agora = new Date();
          const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
          return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor && valor <= hoje;
        },
      },
    });
  };
}
