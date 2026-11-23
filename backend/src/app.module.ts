import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { DbModule } from './common/db.service';
import { AcessoModule } from './common/acesso.service';
import { UsuariosModule } from './usuarios/usuarios.service';
import { ProfessoresModule } from './professores/professores.module';
import { SolicitacaoCadastroModule } from './solicitacao-cadastro/solicitacao-cadastro.module';
import { AlunosModule } from './alunos/alunos.module';
import { EscolasModule } from './escolas/escolas.module';
import { AvisosModule } from './avisos/avisos.module';
import { AdministradoresEscolaresModule } from './administrador-escolar/administrador-escolar.module';
import { TurmasModule } from './turmas/turmas.module';
import { DisciplinasModule } from './disciplinas/disciplinas.module';
import { SolicitacaoEdicaoModule } from './solicitacao-edicao/solicitacao-edicao.module';
import { SolicitacaoRemocaoModule } from './solicitacao-remocao/solicitacao-remocao.module';
import { NotasModule } from './notas/notas.module';
import { FrequenciaModule } from './frequencia/frequencia.module';
import { PainelModule } from './painel/painel.controller';
import { RelatoriosModule } from './relatorios/relatorios.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule,
    AcessoModule,
    UsuariosModule,
    AuthModule,
    ProfessoresModule,
    SolicitacaoCadastroModule,
    AlunosModule,
    EscolasModule,
    AvisosModule,
    AdministradoresEscolaresModule,
    TurmasModule,
    DisciplinasModule,
    SolicitacaoEdicaoModule,
    SolicitacaoRemocaoModule,
    NotasModule,
    FrequenciaModule,
    PainelModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
