import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-contratante-dialog',
  template: `
    <div class="dialog-header">
      <mat-icon>business_center</mat-icon>
      <h3>{{ isEdit ? 'Editar Contratante' : 'Novo Contratante' }}</h3>
      <span class="spacer"></span>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:20px 24px;max-height:70vh;overflow-y:auto">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:4px">

        <mat-form-field appearance="outline">
          <mat-label>Nome completo</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput formControlName="nome" placeholder="Ex: João da Silva" />
          <mat-error>Nome obrigatório</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipo">
            <mat-option *ngFor="let t of tipos" [value]="t">{{ t }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Telefone (opcional)</mat-label>
          <mat-icon matPrefix>phone</mat-icon>
          <input matInput formControlName="telefone" placeholder="(11) 99999-9999" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observações (opcional)</mat-label>
          <textarea matInput formControlName="observacoes" rows="3"
            placeholder="Informações adicionais…"></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="ativo" color="primary" style="margin:8px 0">
          {{ form.get('ativo')?.value ? 'Contratante ativo' : 'Contratante inativo' }}
        </mat-slide-toggle>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding:12px 24px;gap:8px">
      <button mat-stroked-button (click)="dialogRef.close()" [disabled]="loading">Cancelar</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading">
        <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
        <mat-icon *ngIf="!loading">save</mat-icon>
        {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ContratanteDialogComponent implements OnInit {
  tipos = ['Vereador', 'Pré-candidato', 'Partido', 'Consultor', 'Outros'];

  form = this.fb.group({
    nome:        ['', Validators.required],
    tipo:        ['Outros'],
    telefone:    [''],
    observacoes: [''],
    ativo:       [true],
  });

  loading = false;
  isEdit  = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ContratanteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contratante?: any },
  ) {}

  ngOnInit() {
    if (this.data.contratante) { this.isEdit = true; this.form.patchValue(this.data.contratante); }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const req = this.isEdit
      ? this.api.updateContratante(this.data.contratante.id, this.form.value)
      : this.api.createContratante(this.form.value);
    req.subscribe({
      next: () => { this.notify.success('Contratante salvo!'); this.dialogRef.close(true); },
      error: (e) => { this.loading = false; this.notify.error(e.error?.message || 'Erro ao salvar'); },
    });
  }
}
