/* eslint-disable @typescript-eslint/no-require-imports */
// Layout reaproveitado de backend/server.js (desativado). PDFKit não tem tipos instalados.
const PDFDocument: any = require('pdfkit');
import { NOTA_MAX_FINAL } from '../common/notas';

const AZUL = '#1637b7';
const LARGURA = 595.28;

const fmt = (v: number | null | undefined, sufixo = '') =>
  v === null || v === undefined ? 'Sem registros' : `${String(v).replace('.', ',')}${sufixo}`;

/** Gera o PDF do relatório final em memória (para conferir o tamanho antes de gravar, RNF05). */
export function gerarPdfRelatorio(boletim: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 0, left: 40, right: 40 } });
    const partes: Buffer[] = [];
    doc.on('data', (p: Buffer) => partes.push(p));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const rodape = () => {
      doc.rect(0, 805, LARGURA, 36.89).fill(AZUL);
      doc
        .fillColor('#FFFFFF')
        .fontSize(9)
        .text(
          `Documento gerado pelo Sistema CRESCE em ${new Date().toLocaleDateString('pt-BR')}.`,
          40,
          818,
          { align: 'center', width: LARGURA - 80 },
        );
    };

    doc.rect(0, 0, LARGURA, 140).fill(AZUL);
    doc.fillColor('#FFFFFF').fontSize(22).text('RELATÓRIO FINAL DE DESEMPENHO', 40, 55, { align: 'center' });
    doc.fontSize(11).text(boletim.escola?.nome ?? '', 40, 90, { align: 'center' });

    doc.fillColor(AZUL).fontSize(14).text('DADOS DO ALUNO', 40, 170);
    doc.moveTo(40, 190).lineTo(555, 190).strokeColor(AZUL).lineWidth(1).stroke();
    doc.fillColor('#333333').fontSize(11).text(`Nome completo: ${boletim.aluno.nomeAluno}`, 40, 205);
    doc.text(`Turma: ${boletim.turma?.nomeTurma ?? 'Não vinculada'}`, 40, 225);
    doc.text(`Segmento: ${boletim.segmento}`, 40, 245);
    doc.text(`Responsável: ${boletim.aluno.nomeResponsavel}`, 40, 265);

    doc.fillColor(AZUL).fontSize(14).text('DESEMPENHO GLOBAL', 40, 310);
    doc.moveTo(40, 330).lineTo(555, 330).strokeColor(AZUL).lineWidth(1).stroke();

    doc.rect(40, 350, 240, 70).lineWidth(1).strokeColor(AZUL).stroke();
    doc.fillColor(AZUL).fontSize(10).text(`NOTA GERAL (0 A ${NOTA_MAX_FINAL})`, 50, 360, { width: 220, align: 'center' });
    doc.fillColor('#333333').fontSize(20).text(fmt(boletim.resumo.notaGeral), 50, 385, { width: 220, align: 'center' });

    doc.rect(315, 350, 240, 70).lineWidth(1).strokeColor(AZUL).stroke();
    doc.fillColor(AZUL).fontSize(10).text('FREQUÊNCIA FINAL', 325, 360, { width: 220, align: 'center' });
    doc.fillColor('#333333').fontSize(20).text(fmt(boletim.resumo.frequenciaGeral, '%'), 325, 385, { width: 220, align: 'center' });

    doc.fillColor(AZUL).fontSize(14).text('DETALHAMENTO POR DISCIPLINA', 40, 450);
    doc.moveTo(40, 470).lineTo(555, 470).strokeColor(AZUL).lineWidth(1).stroke();

    const cabecalhoTabela = (y: number) => {
      doc.rect(40, y, 515, 20).fill(AZUL);
      doc.fillColor('#FFFFFF').fontSize(10);
      doc.text('Disciplina', 50, y + 6);
      doc.text('Nota final (soma)', 320, y + 6);
      doc.text('Frequência', 460, y + 6);
    };
    cabecalhoTabela(485);

    let y = 515;
    for (const d of boletim.disciplinas) {
      if (y > 770) {
        rodape();
        doc.addPage();
        cabecalhoTabela(40);
        y = 70;
      }
      doc.fillColor('#333333').fontSize(10);
      doc.text(d.nome, 50, y, { width: 260 });
      doc.text(d.notaFinal === null ? 'Sem notas' : `${fmt(d.notaFinal)}${d.notaParcial ? ' (parcial)' : ''}`, 320, y);
      doc.text(fmt(d.frequencia.percentual, '%'), 460, y);
      doc.moveTo(40, y + 15).lineTo(555, y + 15).strokeColor('#E0E0E0').lineWidth(0.5).stroke();
      y += 25;
    }
    if (boletim.disciplinas.length === 0) {
      doc.fillColor('#333333').fontSize(10).text('O aluno não está matriculado em nenhuma turma.', 50, y);
    }

    doc
      .fillColor('#555555')
      .fontSize(8)
      .text(
        `Regra: cada bimestre vale de 0 a 25 pontos; a nota final da disciplina é a soma dos bimestres (0 a ${NOTA_MAX_FINAL}).`,
        40,
        785,
        { width: 515 },
      );
    rodape();
    doc.end();
  });
}
