import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contratante } from './contratante.entity';

@Injectable()
export class ContratantesService {
  constructor(@InjectRepository(Contratante) private repo: Repository<Contratante>) {}

  findAll() { return this.repo.find({ order: { nome: 'ASC' } }); }
  findOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<Contratante>) { return this.repo.save(data); }

  async update(id: string, data: Partial<Contratante>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const c = await this.repo.findOne({ where: { id }, relations: ['pesquisas'] });
    if (c?.pesquisas?.length > 0) throw new BadRequestException('Contratante possui pesquisas vinculadas.');
    return this.repo.delete(id);
  }
}
