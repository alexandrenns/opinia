import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resposta } from './resposta.entity';
import { Token } from '../tokens/token.entity';

@Injectable()
export class RespostasService {
  constructor(
    @InjectRepository(Resposta) private respostaRepo: Repository<Resposta>,
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
  ) {}

  async submitResposta(tokenCodigo: string, respostas: any, ip: string) {
    const token = await this.tokenRepo.findOne({
      where: { codigo: tokenCodigo },
      relations: ['lote'],
    });
    if (!token) throw new BadRequestException('Token inválido');
    if (token.usado) throw new BadRequestException('Token já utilizado');

    const resposta = await this.respostaRepo.save({
      tokenId: token.id,
      pesquisaId: token.lote.pesquisaId,
      bairroId: token.lote.bairroId,
      respostas,
      ip,
    });

    await this.tokenRepo.update(token.id, { usado: true, usadoEm: new Date() });
    return resposta;
  }

  findByPesquisa(pesquisaId: string) {
    return this.respostaRepo.find({
      where: { pesquisaId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAnalytics(pesquisaId: string) {
    const respostas = await this.respostaRepo.find({ where: { pesquisaId } });
    const porBairro: Record<string, number> = {};
    const porDia: Record<string, number> = {};

    for (const r of respostas) {
      porBairro[r.bairroId] = (porBairro[r.bairroId] || 0) + 1;
      const dia = r.createdAt.toISOString().split('T')[0];
      porDia[dia] = (porDia[dia] || 0) + 1;
    }

    return { total: respostas.length, porBairro, porDia, respostas };
  }
}
