import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pesquisa } from './pesquisa.entity';

@Injectable()
export class PesquisasService {
  constructor(@InjectRepository(Pesquisa) private repo: Repository<Pesquisa>) {}

  findAll() {
    return this.repo.find({
      relations: ['municipio', 'contratante'],
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['municipio', 'contratante', 'perguntas', 'perguntas.alternativas', 'lotes', 'lotes.bairro', 'lotes.tokens'],
    });
  }

  create(data: Partial<Pesquisa>) { return this.repo.save(data); }

  async update(id: string, data: Partial<Pesquisa>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  remove(id: string) { return this.repo.delete(id); }

  async getStats() {
    const total = await this.repo.count();
    const ativas = await this.repo.count({ where: { status: 'Em andamento' } });
    const finalizadas = await this.repo.count({ where: { status: 'Encerrada' } });
    return { total, ativas, finalizadas };
  }
}
