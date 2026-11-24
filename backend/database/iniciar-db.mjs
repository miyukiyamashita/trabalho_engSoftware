/**
 * Inicia o json-server sobre database/db.json SEM recarregar o arquivo a cada escrita.
 *
 * Motivo: no modo padrão o json-server 1.0 relê o db.json logo depois de gravá-lo.
 * Quando duas gravações acontecem em sequência (ex.: salvar notas de vários alunos,
 * remoção em cascata), a releitura pode sobrescrever a memória com o arquivo antigo e
 * a segunda gravação se perde. Com NODE_ENV=production o próprio json-server desativa
 * esse observador de arquivo. Consequência: depois de rodar a semente (seed.js),
 * reinicie este processo.
 *
 * Uso: npm run json-server   (porta padrão 3001; DB_PORT altera)
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

process.env.NODE_ENV = 'production';
const pasta = path.dirname(fileURLToPath(import.meta.url));
const arquivo = path.join(pasta, 'db.json');
// No modo production o json-server exige a pasta ./public (arquivos estáticos).
// Rodamos a partir de uma pasta vazia para não expor nenhum arquivo do projeto.
const vazia = path.join(pasta, '.estatico-vazio');
mkdirSync(path.join(vazia, 'public'), { recursive: true });
process.chdir(vazia);
process.argv.push(arquivo, '--port', process.env.DB_PORT ?? '3001');

await import('json-server/lib/bin.js');
