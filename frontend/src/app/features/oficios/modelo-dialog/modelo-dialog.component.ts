import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-modelo-dialog',
  template: `
    <div class="dialog-header">
      <mat-icon>description</mat-icon>
      <h3>{{ isEdit ? 'Editar Modelo' : 'Novo Modelo de Ofício' }}</h3>
      <span class="spacer"></span>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:20px 24px; max-height:72vh; overflow-y:auto">
      <p class="help-text">
        Os ofícios gerados incluem automaticamente: <strong>Brasão do município</strong>,
        <strong>Logo da plataforma</strong>, <strong>QR Code</strong> e <strong>Token em destaque</strong>.
        Configure abaixo os textos institucionais.
      </p>

      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:4px">

        <mat-form-field appearance="outline">
          <mat-label>Nome do Modelo</mat-label>
          <mat-icon matPrefix>label</mat-icon>
          <input matInput formControlName="nome" placeholder="Ex: Modelo Padrão Municipal" />
          <mat-error>Nome obrigatório</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cabeçalho / Título Institucional</mat-label>
          <textarea matInput formControlName="cabecalho" rows="2"
            placeholder="Ex: CONVITE PARA PARTICIPAÇÃO EM PESQUISA DE OPINIÃO PÚBLICA"></textarea>
          <mat-hint>Exibido como título principal do ofício</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Texto Institucional</mat-label>
          <textarea matInput formControlName="textoInstitucional" rows="6"
            placeholder="Ex: Prezado(a) cidadão(ã), Convidamos você a participar…"></textarea>
          <mat-hint>Corpo principal do ofício com instruções de participação</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rodapé</mat-label>
          <textarea matInput formControlName="rodape" rows="2"
            placeholder="Ex: Documento de uso exclusivo para fins de pesquisa. Participação voluntária e anônima."></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="ativo" color="primary" style="margin:8px 0">
          {{ form.get('ativo')?.value ? 'Modelo ativo' : 'Modelo inativo' }}
        </mat-slide-toggle>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding:12px 24px;gap:8px">
      <button mat-stroked-button (click)="dialogRef.close()" [disabled]="loading">Cancelar</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading">
        <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
        <mat-icon *ngIf="!loading">save</mat-icon>
        {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Modelo') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.help-text { font-size:12px; color:var(--text-muted); line-height:1.6; margin-bottom:16px; padding:10px 14px; background:#EBF5FB; border-radius:8px; border-left:3px solid var(--primary); }`],
})
export class ModeloDialogComponent implements OnInit {
  form = this.fb.group({
    nome:               ['', Validators.required],
    cabecalho:          ['CONVITE PARA PARTICIPAÇÃO EM PESQUISA DE OPINIÃO PÚBLICA'],
    textoInstitucional: ['Prezado(a) cidadão(ã),\n\nConvidamos você a participar da nossa pesquisa de opinião pública. Sua participação é voluntária e completamente anônima. Para responder, basta escanear o QR Code abaixo ou digitar o código de acesso no endereço indicado.\n\nConto com sua valiosa colaboração.'],
    rodape:             ['Este documento é de uso exclusivo para fins de pesquisa. Participação voluntária e anônima.'],
    ativo:              [true],
  });

  loading = false;
  isEdit  = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ModeloDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { modelo?: any },
  ) {}

  ngOnInit() {
    if (this.data.modelo) { this.isEdit = true; this.form.patchValue(this.data.modelo); }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const req = this.isEdit
      ? this.api.updateModelo(this.data.modelo.id, this.form.value)
      : this.api.createModelo(this.form.value);
    req.subscribe({
      next: () => { this.notify.success('Modelo salvo!'); this.dialogRef.close(true); },
      error: (e) => { this.loading = false; this.notify.error(e.error?.message || 'Erro ao salvar'); },
    });
  }
}
