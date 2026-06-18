import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { MunicipioDialogComponent } from './municipio-dialog/municipio-dialog.component';

@Component({
  selector: 'app-municipios',
  templateUrl: './municipios.component.html',
  styleUrls: ['./municipios.component.scss'],
})
export class MunicipiosComponent implements OnInit {
  municipios: any[] = [];
  filtered: any[]  = [];
  loading = true;
  search  = '';

  columns = ['brasao', 'nome', 'estado', 'populacao', 'bairros', 'status', 'acoes'];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private notify: NotificationService,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getMunicipios().subscribe({
      next: (data) => { this.municipios = data; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false,
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = this.municipios.filter(m =>
      m.nome.toLowerCase().includes(q) || m.estado.toLowerCase().includes(q),
    );
  }

  openDialog(municipio?: any) {
    const ref = this.dialog.open(MunicipioDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { municipio },
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  toggleStatus(m: any) {
    const fd = new FormData();
    fd.append('ativo', String(!m.ativo));
    this.api.updateMunicipio(m.id, fd).subscribe({
      next: () => { this.notify.success(`Município ${!m.ativo ? 'ativado' : 'inativado'}`); this.load(); },
      error: (e) => this.notify.error(e.error?.message || 'Erro ao atualizar'),
    });
  }

  delete(m: any) {
    if (!confirm(`Excluir "${m.nome}"? Esta ação não pode ser desfeita.`)) return;
    this.api.deleteMunicipio(m.id).subscribe({
      next: () => { this.notify.success('Município excluído'); this.load(); },
      error: (e) => this.notify.error(e.error?.message || 'Não é possível excluir este município'),
    });
  }

  getImageUrl(path: string | null): string {
    if (!path) return '';
    return path.startsWith('http') ? path : `http://localhost:3000${path}`;
  }
}
