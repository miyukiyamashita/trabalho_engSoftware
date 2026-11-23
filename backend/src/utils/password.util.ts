import { randomInt } from 'crypto';

/** Gera uma senha aleatória com gerador criptográfico. */
export default function gerarSenhaAleatoria(tamanho: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*';
  let senha = '';
  for (let i = 0; i < tamanho; i++) {
    senha += chars[randomInt(chars.length)];
  }
  return senha;
}
