import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ModeloDialogComponent } from './modelo-dialog/modelo-dialog.component';

@Component({
  selector: 'app-oficios',
  templateUrl: './oficios.component.html',
  styleUrls: ['./oficios.component.scss'],
})
export class OficiosComponent implements OnInit {
  modelos: any[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private notify: NotificationService,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getModelos().subscribe({
      next: (d) => { this.modelos = d; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  openDialog(modelo?: any) {
    const ref = this.dialog.open(ModeloDialogComponent, {
      width: '680px', maxWidth: '95vw', data: { modelo },
    });
    ref.afterClosed().subscribe(r => { if (r) this.load(); });
  }

  toggleStatus(m: any) {
    this.api.updateModelo(m.id, { ativo: !m.ativo }).subscribe({
      next: () => { this.notify.success('Status atualizado'); this.load(); },
    });
  }

  delete(m: any) {
    if (!confirm(`Excluir modelo "${m.nome}"?`)) return;
    this.api.deleteModelo(m.id).subscribe({
      next: () => { this.notify.success('Modelo excluído'); this.load(); },
      error: () => this.notify.error('Erro ao excluir'),
    });
  }
}
