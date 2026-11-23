import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';

// Chave só para o teste (o JwtModule lê do ambiente via ConfigModule).
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'chave-de-teste-e2e';

import { AppModule } from './../src/app.module';
import { criarValidationPipe } from './../src/common/validacao';

/**
 * Verifica a base de segurança (RNF01/RNF02). Estes testes não dependem do json-server:
 * as respostas 401/403 acontecem nos guards, antes de qualquer acesso ao banco.
 */
describe('Segurança da API (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  const token = (tipo: string) =>
    jwt.sign({ sub: 'teste', email: `${tipo}@teste.test`, tipo, nome: 'Teste', escolaId: 'esc-x', perfilId: 'p-x' });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(criarValidationPipe());
    await app.init();
    jwt = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / é público e responde 200', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ message: 'Backend funcionando!' });
  });

  it('sem token → 401', async () => {
    for (const rota of ['/alunos', '/escolas', '/notas?turmaId=x', '/auth/me', '/relatorios/meu']) {
      await request(app.getHttpServer()).get(rota).expect(401);
    }
  });

  it('token inválido → 401', () => {
    return request(app.getHttpServer()).get('/alunos').set('Authorization', 'Bearer token-falso').expect(401);
  });

  it('perfil errado → 403', async () => {
    const servidor = app.getHttpServer();
    // Professor tentando listar escolas (RF04 é do admin do sistema)
    await request(servidor).get('/escolas').set('Authorization', `Bearer ${token('prof')}`).expect(403);
    // Responsável tentando lançar notas (RF11 é do professor)
    await request(servidor)
      .post('/notas/lancar')
      .set('Authorization', `Bearer ${token('responsavel')}`)
      .send({ turmaId: 't', disciplinaId: 'd', lancamentos: [] })
      .expect(403);
    // Admin escolar tentando aprovar solicitação (RF03 é do admin do sistema)
    await request(servidor)
      .patch('/solicitacoes-cadastro/x/status')
      .set('Authorization', `Bearer ${token('admin_escolar')}`)
      .send({ status: 'APROVADA' })
      .expect(403);
    // Admin do sistema tentando gerar relatórios (RF14 é do admin escolar)
    await request(servidor).post('/relatorios/gerar').set('Authorization', `Bearer ${token('admin_sistema')}`).expect(403);
  });

  it('dados inválidos → 400 com mensagem por campo', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/solicitacoes-cadastro')
      .send({ nomeInstituicao: '', cnpj: '123' })
      .expect(400);
    expect(resposta.body.campos.cnpj).toContain('CNPJ inválido');
    expect(resposta.body.campos.nomeInstituicao).toContain('Preencha o campo');
  });
});
