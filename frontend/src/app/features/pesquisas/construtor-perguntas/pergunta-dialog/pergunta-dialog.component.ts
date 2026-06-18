import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-pergunta-dialog',
  templateUrl: './pergunta-dialog.component.html',
  styleUrls: ['./pergunta-dialog.component.scss'],
})
export class PerguntaDialogComponent implements OnInit {
  tipos = [
    { value: 'escolha_unica',    label: 'Escolha Única',    icon: 'radio_button_checked' },
    { value: 'multipla_escolha', label: 'Múltipla Escolha', icon: 'check_box' },
    { value: 'escala',           label: 'Escala',           icon: 'linear_scale' },
    { value: 'condicional',      label: 'Condicional',      icon: 'account_tree' },
  ];

  form!: FormGroup;
  loading = false;
  isEdit  = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<PerguntaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      pergunta?: any;
      pesquisaId: string;
      perguntas: any[];
    },
  ) {}

  ngOnInit() {
    this.isEdit = !!this.data.pergunta;
    this.form = this.fb.group({
      texto: [this.data.pergunta?.texto || '', Validators.required],
      tipo:  [this.data.pergunta?.tipo  || 'escolha_unica', Validators.required],
      escalaMin:      [this.data.pergunta?.escalaMin || 1],
      escalaMax:      [this.data.pergunta?.escalaMax || 10],
      escalaLabelMin: [this.data.pergunta?.escalaLabelMin || ''],
      escalaLabelMax: [this.data.pergunta?.escalaLabelMax || ''],
      perguntaCondicionalId:   [this.data.pergunta?.perguntaCondicionalId || ''],
      alternativaCondicionalId:[this.data.pergunta?.alternativaCondicionalId || ''],
      alternativas: this.fb.array([]),
    });

    if (this.data.pergunta?.alternativas?.length) {
      this.data.pergunta.alternativas.forEach((a: any) => this.addAlternativa(a.texto));
    } else if (['escolha_unica', 'multipla_escolha', 'condicional'].includes(this.form.get('tipo')!.value)) {
      this.addAlternativa(''); this.addAlternativa('');
    }
  }

  get alternativasArray(): FormArray {
    return this.form.get('alternativas') as FormArray;
  }

  get tipoAtual(): string { return this.form.get('tipo')?.value; }

  addAlternativa(texto = '') {
    this.alternativasArray.push(this.fb.group({ texto: [texto, Validators.required] }));
  }

  removeAlternativa(i: number) {
    if (this.alternativasArray.length > 2) this.alternativasArray.removeAt(i);
    else this.notify.info('Mínimo de 2 alternativas');
  }

  dropAlternativa(event: CdkDragDrop<any[]>) {
    const arr = this.alternativasArray.controls;
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
  }

  onTipoChange(tipo: string) {
    this.alternativasArray.clear();
    if (['escolha_unica', 'multipla_escolha', 'condicional'].includes(tipo)) {
      this.addAlternativa(''); this.addAlternativa('');
    }
  }

  get perguntasCondicionais() {
    return (this.data.perguntas || []).filter(p =>
      p.id !== this.data.pergunta?.id &&
      ['escolha_unica', 'multipla_escolha'].includes(p.tipo),
    );
  }

  get alternativasCondicional() {
    const pid = this.form.get('perguntaCondicionalId')?.value;
    if (!pid) return [];
    const p = this.data.perguntas.find(x => x.id === pid);
    return p?.alternativas || [];
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const payload: any = {
      pesquisaId: this.data.pesquisaId,
      texto: v.texto,
      tipo:  v.tipo,
    };

    if (['escolha_unica', 'multipla_escolha', 'condicional'].includes(v.tipo)) {
      payload.alternativas = v.alternativas.filter((a: any) => a.texto?.trim());
    }

    if (v.tipo === 'escala') {
      payload.escalaMin = v.escalaMin;
      payload.escalaMax = v.escalaMax;
      payload.escalaLabelMin = v.escalaLabelMin;
      payload.escalaLabelMax = v.escalaLabelMax;
    }

    if (v.tipo === 'condicional') {
      payload.perguntaCondicionalId    = v.perguntaCondicionalId || null;
      payload.alternativaCondicionalId = v.alternativaCondicionalId || null;
    }

    this.loading = true;
    const req = this.isEdit
      ? this.api.updatePergunta(this.data.pergunta.id, payload)
      : this.api.createPergunta(payload);

    req.subscribe({
      next: () => { this.notify.success('Pergunta salva!'); this.dialogRef.close(true); },
      error: (e) => { this.loading = false; this.notify.error(e.error?.message || 'Erro ao salvar'); },
    });
  }
}
