import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-bairro-dialog',
  template: `
    <div class="dialog-header">
      <mat-icon>place</mat-icon>
      <h3>{{ isEdit ? 'Editar Bairro' : 'Novo Bairro' }}</h3>
      <span class="spacer"></span>
      <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content style="padding:20px 24px">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:4px">

        <mat-form-field appearance="outline">
          <mat-label>Município</mat-label>
          <mat-select formControlName="municipioId">
            <mat-option *ngFor="let m of data.municipios" [value]="m.id">
              {{ m.nome }} — {{ m.estado }}
            </mat-option>
          </mat-select>
          <mat-error>Selecione um município</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nome do Bairro</mat-label>
          <mat-icon matPrefix>place</mat-icon>
          <input matInput formControlName="nome" placeholder="Ex: Centro, Vila Nova…" />
          <mat-error>Nome obrigatório</mat-error>
        </mat-form-field>

        <mat-slide-toggle formControlName="ativo" color="primary" style="margin:8px 0">
          {{ form.get('ativo')?.value ? 'Bairro ativo' : 'Bairro inativo' }}
        </mat-slide-toggle>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding:12px 24px;gap:8px">
      <button mat-stroked-button (click)="dialogRef.close()" [disabled]="loading">Cancelar</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading">
        <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
        <mat-icon *ngIf="!loading">save</mat-icon>
        {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Bairro') }}
      </button>
    </mat-dialog-actions>
  `,
})
export class BairroDialogComponent implements OnInit {
  form = this.fb.group({
    municipioId: ['', Validators.required],
    nome:        ['', Validators.required],
    ativo:       [true],
  });

  loading = false;
  isEdit  = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<BairroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bairro?: any; municipios: any[] },
  ) {}

  ngOnInit() {
    if (this.data.bairro) { this.isEdit = true; this.form.patchValue(this.data.bairro); }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const req = this.isEdit
      ? this.api.updateBairro(this.data.bairro.id, this.form.value)
      : this.api.createBairro(this.form.value);

    req.subscribe({
      next: () => { this.notify.success(`Bairro ${this.isEdit ? 'atualizado' : 'criado'}!`); this.dialogRef.close(true); },
      error: (e) => { this.loading = false; this.notify.error(e.error?.message || 'Erro ao salvar'); },
    });
  }
}
