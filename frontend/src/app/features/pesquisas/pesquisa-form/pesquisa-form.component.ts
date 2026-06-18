import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-pesquisa-form',
  templateUrl: './pesquisa-form.component.html',
  styleUrls: ['./pesquisa-form.component.scss'],
})
export class PesquisaFormComponent implements OnInit {
  form = this.fb.group({
    municipioId:   ['', Validators.required],
    contratanteId: ['', Validators.required],
    nome:          ['', Validators.required],
    tipo:          ['Opinião Pública'],
    dataInicial:   [null],
    dataFinal:     [null],
    status:        ['Planejamento'],
  });

  municipios:   any[] = [];
  contratantes: any[] = [];
  loading  = false;
  loadingData = true;
  isEdit   = false;
  pesquisaId: string | null = null;

  tipos    = ['Opinião Pública', 'Administração Pública', 'Eleitoral', 'Temática'];
  statuses = ['Planejamento', 'Distribuição', 'Em andamento', 'Encerrada', 'Arquivada'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.pesquisaId = this.route.snapshot.params['id'] || null;
    this.isEdit = !!this.pesquisaId;

    Promise.all([
      this.api.getMunicipios().toPromise(),
      this.api.getContratantes().toPromise(),
    ]).then(([m, c]: any) => {
      this.municipios   = (m || []).filter((x: any) => x.ativo);
      this.contratantes = (c || []).filter((x: any) => x.ativo);
      if (this.isEdit) this.loadPesquisa();
      else this.loadingData = false;
    });
  }

  loadPesquisa() {
    this.api.getPesquisa(this.pesquisaId!).subscribe({
      next: (p) => { this.form.patchValue(p); this.loadingData = false; },
      error: () => { this.notify.error('Pesquisa não encontrada'); this.router.navigate(['/pesquisas']); },
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const data = { ...this.form.value };

    const req = this.isEdit
      ? this.api.updatePesquisa(this.pesquisaId!, data)
      : this.api.createPesquisa(data);

    req.subscribe({
      next: (p) => {
        this.notify.success(`Pesquisa ${this.isEdit ? 'atualizada' : 'criada'} com sucesso!`);
        this.router.navigate(['/pesquisas', p.id]);
      },
      error: (e) => { this.loading = false; this.notify.error(e.error?.message || 'Erro ao salvar'); },
    });
  }
}
