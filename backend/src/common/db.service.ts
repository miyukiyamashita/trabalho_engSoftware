import { Global, Injectable, Module, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Acesso único ao json-server. Somente o backend fala com o banco (T1).
 * Observação: o json-server 1.0 sempre gera um id aleatório (string) no POST.
 */
@Injectable()
export class DbService {
  private readonly http: AxiosInstance;

  constructor(config: ConfigService) {
    this.http = axios.create({
      baseURL: config.get<string>('DB_URL') ?? 'http://localhost:3001',
    });
  }

  async list<T = any>(colecao: string, filtro: Record<string, any> = {}): Promise<T[]> {
    const { data } = await this.http.get(`/${colecao}`, { params: filtro });
    return Array.isArray(data) ? data : [];
  }

  async find<T = any>(colecao: string, id: string | number): Promise<T | null> {
    try {
      const { data } = await this.http.get(`/${colecao}/${encodeURIComponent(String(id))}`);
      return data ?? null;
    } catch (erro: any) {
      if (erro?.response?.status === 404) return null;
      throw erro;
    }
  }

  async get<T = any>(colecao: string, id: string | number, mensagem = 'Registro não encontrado.'): Promise<T> {
    const item = await this.find<T>(colecao, id);
    if (!item) throw new NotFoundException(mensagem);
    return item;
  }

  async create<T = any>(colecao: string, dados: Record<string, any>): Promise<T> {
    const { data } = await this.http.post(`/${colecao}`, dados);
    return data;
  }

  async patch<T = any>(colecao: string, id: string | number, dados: Record<string, any>): Promise<T> {
    const { data } = await this.http.patch(`/${colecao}/${encodeURIComponent(String(id))}`, dados);
    return data;
  }

  async remove(colecao: string, id: string | number): Promise<void> {
    try {
      await this.http.delete(`/${colecao}/${encodeURIComponent(String(id))}`);
    } catch (erro: any) {
      if (erro?.response?.status !== 404) throw erro;
    }
  }
}

@Global()
@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
