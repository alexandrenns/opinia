import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './token.entity';
import { Lote } from './lote.entity';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateToken(): string {
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(Lote) private loteRepo: Repository<Lote>,
  ) {}

  async gerarLote(pesquisaId: string, bairroId: string, quantidade: number) {
    const lote = await this.loteRepo.save({ pesquisaId, bairroId, quantidade });

    const tokens: Token[] = [];
    const codigos = new Set<string>();

    while (codigos.size < quantidade) {
      let codigo = generateToken();
      // Ensure global uniqueness
      const exists = await this.tokenRepo.findOne({ where: { codigo } });
      if (!exists && !codigos.has(codigo)) {
        codigos.add(codigo);
        tokens.push(this.tokenRepo.create({ codigo, loteId: lote.id }));
      }
    }

    await this.tokenRepo.save(tokens);
    return this.loteRepo.findOne({ where: { id: lote.id }, relations: ['tokens', 'bairro'] });
  }

  findByPesquisa(pesquisaId: string) {
    return this.loteRepo.find({
      where: { pesquisaId },
      relations: ['bairro', 'tokens', 'tokens.resposta'],
    });
  }

  findTokenByCode(codigo: string) {
    return this.tokenRepo.findOne({
      where: { codigo },
      relations: ['lote', 'lote.pesquisa', 'lote.bairro', 'lote.pesquisa.municipio', 'lote.pesquisa.perguntas', 'lote.pesquisa.perguntas.alternativas', 'resposta'],
    });
  }

  async getStats(pesquisaId: string) {
    const lotes = await this.loteRepo.find({ where: { pesquisaId }, relations: ['tokens'] });
    const total = lotes.reduce((sum, l) => sum + l.tokens.length, 0);
    const usados = lotes.reduce((sum, l) => sum + l.tokens.filter(t => t.usado).length, 0);
    return { total, usados, pendentes: total - usados, taxa: total > 0 ? Math.round((usados / total) * 100) : 0 };
  }

  async getAllTokensForPdf(pesquisaId: string) {
    const lotes = await this.loteRepo.find({
      where: { pesquisaId },
      relations: ['bairro', 'tokens'],
    });
    const tokens = [];
    for (const lote of lotes) {
      for (const token of lote.tokens) {
        tokens.push({ token: token.codigo, bairro: lote.bairro.nome, usado: token.usado });
      }
    }
    return tokens;
  }
}
