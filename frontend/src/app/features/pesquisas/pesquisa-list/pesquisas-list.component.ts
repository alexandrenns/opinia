import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-pesquisas-list',
  templateUrl: './pesquisas-list.component.html',
  styleUrls: ['./pesquisas-list.component.scss'],
})
export class PesquisasListComponent implements OnInit {
  pesquisas: any[] = [];
  filtered:  any[] = [];
  loading = true;
  search = '';
  filterStatus = '';
  filterTipo   = '';

  statuses = ['Planejamento','Distribuição','Em andamento','Encerrada','Arquivada'];
  tipos    = ['Opinião Pública','Administração Pública','Eleitoral','Temática'];

  statusColors: Record<string, string> = {
    'Planejamento':  'badge-default',
    'Distribuição':  'badge-info',
    'Em andamento':  'badge-success',
    'Encerrada':     'badge-warning',
    'Arquivada':     'badge-error',
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private notify: NotificationService,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getPesquisas().subscribe({
      next: (data) => { this.pesquisas = data; this.applyFilter(); this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = this.pesquisas.filter(p => {
      const ms = !q || p.nome.toLowerCase().includes(q) || p.municipio?.nome.toLowerCase().includes(q);
      const st = !this.filterStatus || p.status === this.filterStatus;
      const tp = !this.filterTipo   || p.tipo   === this.filterTipo;
      return ms && st && tp;
    });
  }

  updateStatus(p: any, status: string) {
    this.api.updatePesquisa(p.id, { status }).subscribe({
      next: () => { this.notify.success(`Status alterado para "${status}"`); this.load(); },
      error: (e) => this.notify.error(e.error?.message || 'Erro'),
    });
  }

  delete(p: any) {
    if (!confirm(`Excluir pesquisa "${p.nome}"? Todos os dados associados serão removidos.`)) return;
    this.api.deletePesquisa(p.id).subscribe({
      next: () => { this.notify.success('Pesquisa excluída'); this.load(); },
      error: (e) => this.notify.error(e.error?.message || 'Erro ao excluir'),
    });
  }

  downloadRelatorio(p: any) {
    this.api.gerarRelatorio(p.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `relatorio-${p.nome}.pdf`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  get countByStatus() {
    return this.statuses.map(s => ({
      status: s, count: this.pesquisas.filter(p => p.status === s).length,
    }));
  }
}
