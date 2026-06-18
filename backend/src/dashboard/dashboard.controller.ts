import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('indicadores')
  getIndicadores() { return this.service.getIndicadores(); }

  @Get('pesquisas-por-municipio')
  getPorMunicipio() { return this.service.getPesquisasPorMunicipio(); }

  @Get('participacao')
  getParticipacao() { return this.service.getParticipacaoPorPesquisa(); }

  @Get('evolucao')
  getEvolucao() { return this.service.getEvolucaoRespostas(); }
}
