import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracaoSistema } from './configuracao-sistema.entity';

@Injectable()
export class ConfiguracaoService {
  constructor(
    @InjectRepository(ConfiguracaoSistema) private repo: Repository<ConfiguracaoSistema>,
  ) {}

  async get(): Promise<ConfiguracaoSistema> {
    let config = await this.repo.findOne({ where: {} });
    if (!config) {
      config = await this.repo.save({
        nomePlataforma: 'Opinia',
        textoInstitucional: 'Plataforma de Pesquisa de Opinião Pública e Inteligência Municipal.',
        rodapePadrao: 'Opinia — Todos os direitos reservados.',
        publicUrl: process.env.PUBLIC_URL || 'http://localhost:4200',
      });
    }
    return config;
  }

  async update(data: Partial<ConfiguracaoSistema>): Promise<ConfiguracaoSistema> {
    const config = await this.get();
    await this.repo.update(config.id, data);
    return this.get();
  }
}
