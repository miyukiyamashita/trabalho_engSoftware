import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { templateBaseSistemaCresce } from '../utils/credenciais';

/**
 * Envio de e-mails do sistema. As credenciais SMTP vêm do .env (T4).
 * Se SMTP_USER não estiver configurado, o serviço opera em "modo demonstração":
 * nenhum e-mail é enviado e os métodos retornam false, para que quem fez o
 * cadastro veja a senha gerada na tela (T8).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    this.from = config.get<string>('SMTP_FROM') || `"Sistema CRESCE" <${user}>`;
    this.transporter =
      user && pass
        ? nodemailer.createTransport({
            service: config.get<string>('SMTP_SERVICE') || 'gmail',
            auth: { user, pass },
          })
        : null;
  }

  get configurado() {
    return this.transporter !== null;
  }

  private async enviar(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      return true;
    } catch (erro: any) {
      this.logger.warn(`Falha ao enviar e-mail para ${to}: ${erro?.message}`);
      return false;
    }
  }

  enviarCredenciais(nome: string, email: string, senha: string, contextoAcesso: string) {
    const conteudoHtml = `
            <p style="font-size:14px; color:#4b5563; line-height:1.6; margin-top:0;">
              ${contextoAcesso}
            </p>
            <div style="margin:22px 0; padding:18px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
              <p style="margin:0 0 10px; font-size:13px; color:#6b7280;">Seus dados de acesso:</p>
              <p style="margin:6px 0; font-size:14px;"><strong>E-mail:</strong> ${email}</p>
              <p style="margin:6px 0; font-size:14px;"><strong>Senha:</strong> <span style="font-family:monospace; font-size:14px; color:#111827;">${senha}</span></p>
            </div>
        `;
    return this.enviar(
      email,
      'Acesso ao Sistema CRESCE',
      templateBaseSistemaCresce({
        nome,
        subtituloHeader: 'Controle e Registro Escolar de Suporte ao Comportamento e Evolução',
        conteudoHtml,
      }),
    );
  }

  enviarEmailAprovacao(nome: string, email: string, nomeInstituicao: string) {
    const conteudoHtml = `
            <p style="font-size:14px; color:#4b5563; line-height:1.6; margin-top:0;">
              Analisamos a solicitação de cadastro enviada para a instituição <strong>${nomeInstituicao}</strong>.
            </p>
            <div style="margin:22px 0; padding:18px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; color: #166534;">
              <p style="margin:0 0 6px; font-size:14px; font-weight: bold;">O que acontece agora?</p>
              <p style="margin:0; font-size:13px; color:#1e293b; line-height:1.5;">
                Sua instituição foi registrada em nossa base de dados. Em breve, você receberá um segundo e-mail com as credenciais de acesso do administrador.
              </p>
            </div>
        `;
    return this.enviar(
      email,
      'Sua solicitação no Sistema CRESCE foi aprovada!',
      templateBaseSistemaCresce({
        nome,
        subtituloHeader: 'Sua solicitação de cadastro foi aprovada',
        conteudoHtml,
      }),
    );
  }

  enviarEmailReprovacao(nome: string, email: string, nomeInstituicao: string) {
    const conteudoHtml = `
            <p style="font-size:14px; color:#4b5563; line-height:1.6; margin-top:0;">
              Analisamos a solicitação de cadastro enviada para a instituição <strong>${nomeInstituicao}</strong>. Infelizmente ela foi recusada neste momento.
            </p>
            <div style="margin:22px 0; padding:18px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; color: #991b1b;">
              <p style="margin:0 0 6px; font-size:14px; font-weight: bold;">Motivos comuns de não aprovação:</p>
              <ul style="margin:0; padding-left:20px; font-size:13px; color:#1e293b; line-height:1.5;">
                <li>Dados cadastrais ou CNPJ inconsistentes.</li>
                <li>Incompatibilidade nos dados cadastrais do representante.</li>
              </ul>
            </div>
            <p style="font-size:14px; color:#4b5563; line-height:1.6;">
              Caso queira corrigir os dados, sinta-se à vontade para submeter uma nova solicitação na plataforma.
            </p>
        `;
    return this.enviar(
      email,
      'Atualização sobre sua solicitação no Sistema CRESCE',
      templateBaseSistemaCresce({
        nome,
        subtituloHeader: 'Atualização sobre o status da sua solicitação',
        conteudoHtml,
        isErro: true,
      }),
    );
  }
}
