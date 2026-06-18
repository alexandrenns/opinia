import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RespostasService } from './respostas.service';

@Controller('respostas')
@UseGuards(JwtAuthGuard)
export class RespostasController {
  constructor(private service: RespostasService) {}

  @Get('pesquisa/:pesquisaId')
  findByPesquisa(@Param('pesquisaId') pesquisaId: string) {
    return this.service.findByPesquisa(pesquisaId);
  }

  @Get('analytics/:pesquisaId')
  getAnalytics(@Param('pesquisaId') pesquisaId: string) {
    return this.service.getAnalytics(pesquisaId);
  }
}
