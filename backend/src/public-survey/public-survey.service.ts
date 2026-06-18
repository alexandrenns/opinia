import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../tokens/token.entity';
import { Resposta } from '../respostas/resposta.entity';
import { ConfiguracaoSistema } from '../configuracao/configuracao-sistema.entity';

@Injectable()
export class PublicSurveyService {
  constructor(
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(Resposta) private respostaRepo: Repository<Resposta>,
    @InjectRepository(ConfiguracaoSistema) private configRepo: Repository<ConfiguracaoSistema>,
  ) {}

  async getSurveyByToken(codigo: string) {
    const token = await this.tokenRepo.findOne({
      where: { codigo: codigo.toUpperCase() },
      relations: [
        'lote',
        'lote.pesquisa',
        'lote.pesquisa.municipio',
        'lote.pesquisa.perguntas',
        'lote.pesquisa.perguntas.alternativas',
        'lote.bairro',
        'resposta',
      ],
    });

    if (!token) throw new NotFoundException('Token inválido ou não encontrado.');
    if (token.usado) throw new BadRequestException('Este token já foi utilizado. Cada convite permite apenas uma resposta.');

    const pesquisa = token.lote?.pesquisa;
    if (!pesquisa) throw new NotFoundException('Pesquisa não encontrada.');
    if (pesquisa.status === 'Encerrada' || pesquisa.status === 'Arquivada') {
      throw new BadRequestException('Esta pesquisa foi encerrada e não está aceitando novas respostas.');
    }

    const config = await this.configRepo.findOne({ where: {} });

    const perguntas = (pesquisa.perguntas || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map(p => ({
        id: p.id,
        texto: p.texto,
        tipo: p.tipo,
        ordem: p.ordem,
        escalaMin: p.escalaMin,
        escalaMax: p.escalaMax,
        escalaLabelMin: p.escalaLabelMin,
        escalaLabelMax: p.escalaLabelMax,
        perguntaCondicionalId: p.perguntaCondicionalId,
        alternativaCondicionalId: p.alternativaCondicionalId,
        alternativas: (p.alternativas || []).sort((a, b) => a.ordem - b.ordem).map(a => ({
          id: a.id,
          texto: a.texto,
        })),
      }));

    return {
      token: codigo.toUpperCase(),
      pesquisa: {
        id: pesquisa.id,
        nome: pesquisa.nome,
        tipo: pesquisa.tipo,
        municipio: pesquisa.municipio ? {
          nome: pesquisa.municipio.nome,
          estado: pesquisa.municipio.estado,
          brasao: pesquisa.municipio.brasao,
        } : null,
        bairro: token.lote?.bairro?.nome,
      },
      perguntas,
      config: {
        nomePlataforma: config?.nomePlataforma || 'Opinia',
        logo: config?.logo,
        textoInstitucional: config?.textoInstitucional,
      },
    };
  }

  async submitResposta(codigo: string, respostas: any, ip: string) {
    const token = await this.tokenRepo.findOne({
      where: { codigo: codigo.toUpperCase() },
      relations: ['lote'],
    });

    if (!token) throw new NotFoundException('Token inválido.');
    if (token.usado) throw new BadRequestException('Token já utilizado.');

    await this.respostaRepo.save({
      tokenId: token.id,
      pesquisaId: token.lote.pesquisaId,
      bairroId: token.lote.bairroId,
      respostas,
      ip,
    });

    await this.tokenRepo.update(token.id, { usado: true, usadoEm: new Date() });

    return { success: true, message: 'Resposta registrada com sucesso. Obrigado pela sua participação!' };
  }
}
