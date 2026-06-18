import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

@Component({
  selector: 'app-municipio-dialog',
  templateUrl: './municipio-dialog.component.html',
  styleUrls: ['./municipio-dialog.component.scss'],
})
export class MunicipioDialogComponent implements OnInit {
  form = this.fb.group({
    nome:      ['', Validators.required],
    estado:    ['', Validators.required],
    populacao: [null],
    ativo:     [true],
  });

  estados = ESTADOS;
  loading  = false;
  isEdit   = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<MunicipioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { municipio?: any },
  ) {}

  ngOnInit() {
    if (this.data.municipio) {
      this.isEdit = true;
      this.form.patchValue(this.data.municipio);
      if (this.data.municipio.brasao) {
        this.previewUrl = `http://localhost:3000${this.data.municipio.brasao}`;
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => (this.previewUrl = e.target.result);
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    const fd = new FormData();
    const v = this.form.value;
    fd.append('nome',    v.nome!);
    fd.append('estado',  v.estado!);
    fd.append('ativo',   String(v.ativo));
    if (v.populacao) fd.append('populacao', String(v.populacao));
    if (this.selectedFile) fd.append('brasao', this.selectedFile);

    const req = this.isEdit
      ? this.api.updateMunicipio(this.data.municipio.id, fd)
      : this.api.createMunicipio(fd);

    req.subscribe({
      next: () => {
        this.notify.success(`Município ${this.isEdit ? 'atualizado' : 'criado'} com sucesso!`);
        this.dialogRef.close(true);
      },
      error: (e) => {
        this.loading = false;
        this.notify.error(e.error?.message || 'Erro ao salvar');
      },
    });
  }
}
