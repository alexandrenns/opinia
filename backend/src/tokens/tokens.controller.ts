import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TokensService } from './tokens.service';

@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokensController {
  constructor(private service: TokensService) {}

  @Post('gerar-lote')
  gerarLote(@Body() body: { pesquisaId: string; bairroId: string; quantidade: number }) {
    return this.service.gerarLote(body.pesquisaId, body.bairroId, body.quantidade);
  }

  @Get('pesquisa/:pesquisaId')
  findByPesquisa(@Param('pesquisaId') pesquisaId: string) {
    return this.service.findByPesquisa(pesquisaId);
  }

  @Get('stats/:pesquisaId')
  getStats(@Param('pesquisaId') pesquisaId: string) {
    return this.service.getStats(pesquisaId);
  }
}
