import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-configuracao',
  templateUrl: './configuracao.component.html',
  styleUrls: ['./configuracao.component.scss'],
})
export class ConfiguracaoComponent implements OnInit {
  form = this.fb.group({
    nomePlataforma:     ['', Validators.required],
    textoInstitucional: [''],
    rodapePadrao:       [''],
    publicUrl:          ['', Validators.required],
  });

  config: any = null;
  loading     = true;
  saving      = false;

  logoFile:    File | null = null;
  logoPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.api.getConfiguracao().subscribe({
      next: (c) => {
        this.config = c;
        this.form.patchValue(c);
        if (c.logo) this.logoPreview = `/api${c.logo}`;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => (this.logoPreview = e.target.result);
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.logoFile    = null;
    this.logoPreview = null;
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const fd = new FormData();
    const v  = this.form.value;
    fd.append('nomePlataforma',     v.nomePlataforma!);
    fd.append('textoInstitucional', v.textoInstitucional || '');
    fd.append('rodapePadrao',       v.rodapePadrao || '');
    fd.append('publicUrl',          v.publicUrl!);
    if (this.logoFile) fd.append('logo', this.logoFile);

    this.api.updateConfiguracao(fd).subscribe({
      next: (c) => {
        this.config = c;
        this.saving = false;
        this.notify.success('Configurações salvas com sucesso!');
      },
      error: (e) => {
        this.saving = false;
        this.notify.error(e.error?.message || 'Erro ao salvar configurações');
      },
    });
  }
}
