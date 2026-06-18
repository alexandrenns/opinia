import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-pesquisa-detail',
  templateUrl: './pesquisa-detail.component.html',
  styleUrls: ['./pesquisa-detail.component.scss'],
})
export class PesquisaDetailComponent implements OnInit {
  pesquisa: any = null;
  stats: any    = {};
  loading = true;
  downloadingPdf    = false;
  downloadingOficio = false;
  pesquisaId!: string;

  statusColors: Record<string, string> = {
    'Planejamento': 'badge-default', 'Distribuição': 'badge-info',
    'Em andamento': 'badge-success', 'Encerrada': 'badge-warning', 'Arquivada': 'badge-error',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.pesquisaId = this.route.snapshot.params['id'];
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getPesquisa(this.pesquisaId).subscribe({
      next: (p) => {
        this.pesquisa = p;
        this.api.getTokenStats(this.pesquisaId).subscribe({
          next: (s) => { this.stats = s; this.loading = false; },
          error: () => { this.stats = {}; this.loading = false; },
        });
      },
      error: () => { this.notify.error('Pesquisa não encontrada'); this.router.navigate(['/pesquisas']); },
    });
  }

  downloadRelatorio() {
    this.downloadingPdf = true;
    this.api.gerarRelatorio(this.pesquisaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `relatorio-${this.pesquisa.nome}.pdf`; a.click();
        URL.revokeObjectURL(url);
        this.downloadingPdf = false;
      },
      error: () => { this.notify.error('Erro ao gerar relatório'); this.downloadingPdf = false; },
    });
  }

  downloadControle() {
    this.api.gerarControle(this.pesquisaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url; a.download = `controle-${this.pesquisaId}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notify.error('Erro ao gerar PDF de controle'),
    });
  }

  get taxaParticipacao(): number {
    if (!this.stats.total || this.stats.total === 0) return 0;
    return Math.round((this.stats.usados / this.stats.total) * 100);
  }
}
