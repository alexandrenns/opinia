import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Municipio } from '../municipios/municipio.entity';
import { Contratante } from '../contratantes/contratante.entity';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { Token } from '../tokens/token.entity';
import { Resposta } from '../respostas/resposta.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Municipio) private municipioRepo: Repository<Municipio>,
    @InjectRepository(Contratante) private contratanteRepo: Repository<Contratante>,
    @InjectRepository(Pesquisa) private pesquisaRepo: Repository<Pesquisa>,
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(Resposta) private respostaRepo: Repository<Resposta>,
  ) {}

  async getIndicadores() {
    const [municipios, contratantes, pesquisasAtivas, pesquisasFinalizadas, tokensGerados, tokensRespondidos] =
      await Promise.all([
        this.municipioRepo.count({ where: { ativo: true } }),
        this.contratanteRepo.count({ where: { ativo: true } }),
        this.pesquisaRepo.count({ where: { status: 'Em andamento' } }),
        this.pesquisaRepo.count({ where: { status: 'Encerrada' } }),
        this.tokenRepo.count(),
        this.tokenRepo.count({ where: { usado: true } }),
      ]);

    return { municipios, contratantes, pesquisasAtivas, pesquisasFinalizadas, tokensGerados, tokensRespondidos };
  }

  async getPesquisasPorMunicipio() {
    return this.pesquisaRepo
      .createQueryBuilder('p')
      .leftJoin('p.municipio', 'm')
      .select('m.nome', 'municipio')
      .addSelect('COUNT(p.id)', 'total')
      .groupBy('m.nome')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async getParticipacaoPorPesquisa() {
    const pesquisas = await this.pesquisaRepo.find({
      where: [{ status: 'Em andamento' }, { status: 'Encerrada' }],
      relations: ['municipio'],
    });

    const result = [];
    for (const p of pesquisas.slice(0, 10)) {
      const tokens = await this.tokenRepo.count({
        where: { lote: { pesquisaId: p.id } } as any,
      });
      const respostas = await this.respostaRepo.count({ where: { pesquisaId: p.id } });
      result.push({
        pesquisa: p.nome,
        municipio: p.municipio?.nome,
        tokens,
        respostas,
        taxa: tokens > 0 ? Math.round((respostas / tokens) * 100) : 0,
      });
    }
    return result;
  }

  async getEvolucaoRespostas() {
    const ultimos30dias = new Date();
    ultimos30dias.setDate(ultimos30dias.getDate() - 30);

    const respostas = await this.respostaRepo
      .createQueryBuilder('r')
      .select("DATE_TRUNC('day', r.createdAt)", 'dia')
      .addSelect('COUNT(r.id)', 'total')
      .where('r.createdAt >= :data', { data: ultimos30dias })
      .groupBy("DATE_TRUNC('day', r.createdAt)")
      .orderBy('dia', 'ASC')
      .getRawMany();

    return respostas;
  }
}
