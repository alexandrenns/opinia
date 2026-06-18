import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pergunta } from './pergunta.entity';
import { Alternativa } from './alternativa.entity';

@Injectable()
export class PerguntasService {
  constructor(
    @InjectRepository(Pergunta) private perguntaRepo: Repository<Pergunta>,
    @InjectRepository(Alternativa) private altRepo: Repository<Alternativa>,
  ) {}

  findByPesquisa(pesquisaId: string) {
    return this.perguntaRepo.find({
      where: { pesquisaId },
      relations: ['alternativas'],
      order: { ordem: 'ASC' },
    });
  }

  async create(data: any) {
    const { alternativas, ...perguntaData } = data;
    const pergunta = await this.perguntaRepo.save(perguntaData);
    if (alternativas?.length) {
      const alts = alternativas.map((a: any, i: number) => ({
        ...a, perguntaId: pergunta.id, ordem: i,
      }));
      await this.altRepo.save(alts);
    }
    return this.perguntaRepo.findOne({ where: { id: pergunta.id }, relations: ['alternativas'] });
  }

  async update(id: string, data: any) {
    const { alternativas, ...perguntaData } = data;
    await this.perguntaRepo.update(id, perguntaData);
    if (alternativas !== undefined) {
      await this.altRepo.delete({ perguntaId: id });
      if (alternativas.length) {
        const alts = alternativas.map((a: any, i: number) => ({ ...a, perguntaId: id, ordem: i }));
        await this.altRepo.save(alts);
      }
    }
    return this.perguntaRepo.findOne({ where: { id }, relations: ['alternativas'] });
  }

  remove(id: string) { return this.perguntaRepo.delete(id); }

  async reorder(pesquisaId: string, ids: string[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.perguntaRepo.update({ id: ids[i], pesquisaId }, { ordem: i });
    }
    return this.findByPesquisa(pesquisaId);
  }

  async duplicate(id: string) {
    const original = await this.perguntaRepo.findOne({ where: { id }, relations: ['alternativas'] });
    if (!original) return null;
    const { id: _, alternativas, ...data } = original as any;
    const nova = await this.perguntaRepo.save({ ...data, texto: `${data.texto} (cópia)` });
    if (alternativas?.length) {
      const alts = alternativas.map((a: any) => ({ texto: a.texto, ordem: a.ordem, perguntaId: nova.id }));
      await this.altRepo.save(alts);
    }
    return this.perguntaRepo.findOne({ where: { id: nova.id }, relations: ['alternativas'] });
  }
}
