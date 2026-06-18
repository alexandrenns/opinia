import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PerguntaDialogComponent } from './pergunta-dialog/pergunta-dialog.component';

@Component({
  selector: 'app-construtor-perguntas',
  templateUrl: './construtor-perguntas.component.html',
  styleUrls: ['./construtor-perguntas.component.scss'],
})
export class ConstrutorPerguntasComponent implements OnInit {
  pesquisaId!: string;
  pesquisa: any;
  perguntas: any[] = [];
  loading = true;

  tipoIcons: Record<string, string> = {
    escolha_unica:    'radio_button_checked',
    multipla_escolha: 'check_box',
    escala:           'linear_scale',
    condicional:      'account_tree',
  };

  tipoLabels: Record<string, string> = {
    escolha_unica:    'Escolha Única',
    multipla_escolha: 'Múltipla Escolha',
    escala:           'Escala',
    condicional:      'Condicional',
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private dialog: MatDialog,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.pesquisaId = this.route.snapshot.params['id'];
    this.api.getPesquisa(this.pesquisaId).subscribe(p => { this.pesquisa = p; });
    this.loadPerguntas();
  }

  loadPerguntas() {
    this.loading = true;
    this.api.getPerguntas(this.pesquisaId).subscribe({
      next: (data) => { this.perguntas = data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  openDialog(pergunta?: any) {
    const ref = this.dialog.open(PerguntaDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { pergunta, pesquisaId: this.pesquisaId, perguntas: this.perguntas },
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadPerguntas(); });
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.perguntas, event.previousIndex, event.currentIndex);
    const ids = this.perguntas.map(p => p.id);
    this.api.reorderPerguntas(this.pesquisaId, ids).subscribe({
      next: () => this.notify.success('Ordem salva!'),
      error: () => this.notify.error('Erro ao reordenar'),
    });
  }

  duplicate(p: any) {
    this.api.duplicatePergunta(p.id).subscribe({
      next: () => { this.notify.success('Pergunta duplicada!'); this.loadPerguntas(); },
      error: () => this.notify.error('Erro ao duplicar'),
    });
  }

  delete(p: any) {
    if (!confirm(`Excluir a pergunta "${p.texto}"?`)) return;
    this.api.deletePergunta(p.id).subscribe({
      next: () => { this.notify.success('Pergunta excluída'); this.loadPerguntas(); },
      error: () => this.notify.error('Erro ao excluir'),
    });
  }
}
