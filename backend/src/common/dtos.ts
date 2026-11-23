/**
 * DTOs validados no servidor (H5 / T26). As mensagens dizem o problema e como corrigir (H9).
 * Nos DTOs de atualização todos os campos são opcionais (atualização parcial).
 */
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Cnpj, Cpf, DataPassada, Email, Obrigatorio, Telefone } from './validacao';
import { CAMPOS_EDITAVEIS_ESCOLA } from '../escolas/escolas.service';

const SETORES = ['infantil', 'fundamental'];
const PORTES = ['0-100', '101-500', '501-1000', '1000+'];
const TURNOS = ['Manhã', 'Tarde', 'Noite'];
const SERIES = ['1', '2', '3', '4', '5'];
const AREAS = ['Exatas', 'Natureza', 'Humanas', 'Linguagens', 'Idioma'];

export class LoginDto {
  @Email() email!: string;
  @IsString({ message: 'Informe a senha.' })
  @IsNotEmpty({ message: 'Informe a senha.' })
  senha!: string;
}

export class SolicitacaoCadastroDto {
  @Obrigatorio('Nome da instituição') nomeInstituicao!: string;
  @Cnpj() cnpj!: string;
  @Obrigatorio('Endereço') endereco!: string;
  @Telefone() telefone!: string;
  @Email('E-mail da instituição') emailInstituicao!: string;
  @IsIn(SETORES, { message: 'Escolha o setor educacional na lista.' }) setorEducacional!: string;
  @Obrigatorio('Nome do representante') nomeRepresentante!: string;
  @Cpf('CPF do representante') cpfRepresentante!: string;
  @Email('E-mail do representante') emailRepresentante!: string;
  @Obrigatorio('Cargo', 80) cargo!: string;
  @IsIn(PORTES, { message: 'Escolha o número de alunos na lista.' }) numeroAlunos!: string;
}

export class DecisaoDto {
  @IsIn(['APROVADA', 'REJEITADA'], { message: 'A decisão deve ser APROVADA ou REJEITADA.' }) status!: string;
}

export class SolicitacaoEdicaoDto {
  @IsIn(CAMPOS_EDITAVEIS_ESCOLA as unknown as string[], {
    message: 'Escolha na lista qual informação da escola deve ser alterada.',
  })
  informacao!: string;
  @Obrigatorio('Novo valor') alteracao!: string;
}

export class SolicitacaoRemocaoDto {
  @MinLength(10, { message: 'Explique o motivo com pelo menos 10 caracteres.' })
  @Obrigatorio('Justificativa', 1000)
  justificativa!: string;
}

export class EscolaDto {
  @Obrigatorio('Nome da escola') nome!: string;
  @Cnpj() cnpj!: string;
  @Obrigatorio('Endereço') endereco!: string;
  @Telefone() telefone!: string;
  @IsOptional() @Email('E-mail da escola') email?: string;
  @IsIn(SETORES, { message: 'Escolha o setor educacional na lista.' }) setorEducacional!: string;
  @IsIn(PORTES, { message: 'Escolha o número de alunos na lista.' }) numeroAlunos!: string;
  @Obrigatorio('Nome do administrador escolar') nomeRepresentante!: string;
  @IsOptional() @Cpf('CPF do administrador') cpfRepresentante?: string;
  @Email('E-mail do administrador escolar') emailRepresentante!: string;
  @Obrigatorio('Cargo', 80) cargoRepresentante!: string;
}

export class EscolaUpdateDto {
  @IsOptional() @Obrigatorio('Nome da escola') nome?: string;
  @IsOptional() @Cnpj() cnpj?: string;
  @IsOptional() @Obrigatorio('Endereço') endereco?: string;
  @IsOptional() @Telefone() telefone?: string;
  @IsOptional() @Email('E-mail da escola') email?: string;
  @IsOptional() @IsIn(SETORES, { message: 'Escolha o setor educacional na lista.' }) setorEducacional?: string;
  @IsOptional() @IsIn(PORTES, { message: 'Escolha o número de alunos na lista.' }) numeroAlunos?: string;
}

export class ProfessorDto {
  @Obrigatorio('Nome completo') nome!: string;
  @Cpf() cpf!: string;
  @DataPassada('Data de nascimento') dataNascimento!: string;
  @Email() email!: string;
  @Telefone() telefone!: string;
  @Obrigatorio('Formação') formacao!: string;
}

export class ProfessorUpdateDto {
  @IsOptional() @Obrigatorio('Nome completo') nome?: string;
  @IsOptional() @Cpf() cpf?: string;
  @IsOptional() @DataPassada('Data de nascimento') dataNascimento?: string;
  @IsOptional() @Email() email?: string;
  @IsOptional() @Telefone() telefone?: string;
  @IsOptional() @Obrigatorio('Formação') formacao?: string;
}

export class AlunoDto {
  @Obrigatorio('Nome do aluno') nomeAluno!: string;
  @Cpf('CPF do aluno') cpfAluno!: string;
  @DataPassada('Data de nascimento') dataNascimentoAluno!: string;
  @Obrigatorio('Nome do responsável') nomeResponsavel!: string;
  @Email('E-mail do responsável') emailResponsavel!: string;
  @Telefone('Telefone do responsável') telefoneResponsavel!: string;
}

export class AlunoUpdateDto {
  @IsOptional() @Obrigatorio('Nome do aluno') nomeAluno?: string;
  @IsOptional() @Cpf('CPF do aluno') cpfAluno?: string;
  @IsOptional() @DataPassada('Data de nascimento') dataNascimentoAluno?: string;
  @IsOptional() @Obrigatorio('Nome do responsável') nomeResponsavel?: string;
  @IsOptional() @Email('E-mail do responsável') emailResponsavel?: string;
  @IsOptional() @Telefone('Telefone do responsável') telefoneResponsavel?: string;
}

export class TurmaDto {
  @Obrigatorio('Nome da turma', 60) nomeTurma!: string;
  @Type(() => Number)
  @Max(60, { message: 'Capacidade: use no máximo 60 alunos.' })
  @Min(1, { message: 'Capacidade: informe pelo menos 1 aluno.' })
  @IsInt({ message: 'Capacidade: informe um número inteiro (ex.: 30).' })
  capacidade!: number;
  @IsIn(SERIES, { message: 'Escolha o ano/série na lista.' }) anoSerie!: string;
  @IsIn(TURNOS, { message: 'Escolha o turno na lista.' }) turno!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) alunos?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) disciplinas?: string[];
}

export class TurmaUpdateDto {
  @IsOptional() @Obrigatorio('Nome da turma', 60) nomeTurma?: string;
  @IsOptional()
  @Type(() => Number)
  @Max(60, { message: 'Capacidade: use no máximo 60 alunos.' })
  @Min(1, { message: 'Capacidade: informe pelo menos 1 aluno.' })
  @IsInt({ message: 'Capacidade: informe um número inteiro (ex.: 30).' })
  capacidade?: number;
  @IsOptional() @IsIn(SERIES, { message: 'Escolha o ano/série na lista.' }) anoSerie?: string;
  @IsOptional() @IsIn(TURNOS, { message: 'Escolha o turno na lista.' }) turno?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) alunos?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) disciplinas?: string[];
}

export class DisciplinaDto {
  @Obrigatorio('Nome da disciplina') nomeDisciplina!: string;
  @Obrigatorio('Código', 20) codigo!: string;
  @Type(() => Number)
  @Max(40, { message: 'Carga horária: use no máximo 40 horas semanais.' })
  @Min(1, { message: 'Carga horária: informe pelo menos 1 hora semanal.' })
  @IsInt({ message: 'Carga horária: informe um número inteiro de horas por semana (ex.: 4).' })
  cargaHoraria!: number;
  @IsIn(AREAS, { message: 'Escolha a área do conhecimento na lista.' }) areaConhecimento!: string;
  @Obrigatorio('Descrição', 500) descricao!: string;
  @IsNotEmpty({ message: 'Escolha o professor responsável.' }) @IsString() professorId!: string;
}

export class DisciplinaUpdateDto {
  @IsOptional() @Obrigatorio('Nome da disciplina') nomeDisciplina?: string;
  @IsOptional() @Obrigatorio('Código', 20) codigo?: string;
  @IsOptional()
  @Type(() => Number)
  @Max(40, { message: 'Carga horária: use no máximo 40 horas semanais.' })
  @Min(1, { message: 'Carga horária: informe pelo menos 1 hora semanal.' })
  @IsInt({ message: 'Carga horária: informe um número inteiro de horas por semana (ex.: 4).' })
  cargaHoraria?: number;
  @IsOptional() @IsIn(AREAS, { message: 'Escolha a área do conhecimento na lista.' }) areaConhecimento?: string;
  @IsOptional() @Obrigatorio('Descrição', 500) descricao?: string;
  @IsOptional() @IsNotEmpty({ message: 'Escolha o professor responsável.' }) @IsString() professorId?: string;
}

export class AvisoDto {
  @IsArray({ message: 'Escolha ao menos uma turma.' })
  @ArrayMinSize(1, { message: 'Escolha ao menos uma turma.' })
  @IsString({ each: true })
  publico!: string[];
  @IsIn(['informativo', 'alerta'], { message: 'Escolha o tipo de aviso.' }) tipoAviso!: string;
  @MinLength(3, { message: 'Título: use pelo menos 3 caracteres.' })
  @Obrigatorio('Título', 120)
  tituloAviso!: string;
  @MinLength(5, { message: 'Mensagem: use pelo menos 5 caracteres.' })
  @Obrigatorio('Mensagem', 2000)
  descricao!: string;
}

const bim = () => (target: object, prop: string) => {
  IsOptional()(target, prop);
  IsNumber({}, { message: 'A nota deve ser um número (use vírgula ou ponto para decimais).' })(target, prop);
};

export class LancamentoNotaDto {
  @IsString() @IsNotEmpty() alunoId!: string;
  @bim() bim1?: number | null;
  @bim() bim2?: number | null;
  @bim() bim3?: number | null;
  @bim() bim4?: number | null;
}

export class LancarNotasDto {
  @IsString() @IsNotEmpty({ message: 'Escolha a turma.' }) turmaId!: string;
  @IsString() @IsNotEmpty({ message: 'Escolha a disciplina.' }) disciplinaId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => LancamentoNotaDto) lancamentos!: LancamentoNotaDto[];
}

export class RegistroChamadaDto {
  @IsString() @IsNotEmpty() alunoId!: string;
  @IsBoolean() presente!: boolean;
}

export class FrequenciaDto {
  @IsString() @IsNotEmpty({ message: 'Escolha a turma.' }) turmaId!: string;
  @IsString() @IsNotEmpty({ message: 'Escolha a disciplina.' }) disciplinaId!: string;
  @DataPassada('Data da aula') data!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => RegistroChamadaDto) chamada!: RegistroChamadaDto[];
}

