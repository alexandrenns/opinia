import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { NgChartsModule } from 'ng2-charts';

import { PesquisasListComponent } from './pesquisa-list/pesquisas-list.component';
import { PesquisaFormComponent } from './pesquisa-form/pesquisa-form.component';
import { PesquisaDetailComponent } from './pesquisa-detail/pesquisa-detail.component';
import { ConstrutorPerguntasComponent } from './construtor-perguntas/construtor-perguntas.component';
import { PerguntaDialogComponent } from './construtor-perguntas/pergunta-dialog/pergunta-dialog.component';
import { DistribuicaoComponent } from './distribuicao/distribuicao.component';

const routes: Routes = [
  { path: '',       component: PesquisasListComponent },
  { path: 'nova',   component: PesquisaFormComponent },
  { path: ':id',    component: PesquisaDetailComponent },
  { path: ':id/editar',     component: PesquisaFormComponent },
  { path: ':id/perguntas',  component: ConstrutorPerguntasComponent },
  { path: ':id/distribuicao', component: DistribuicaoComponent },
];

@NgModule({
  declarations: [
    PesquisasListComponent,
    PesquisaFormComponent,
    PesquisaDetailComponent,
    ConstrutorPerguntasComponent,
    PerguntaDialogComponent,
    DistribuicaoComponent,
  ],
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, DragDropModule,
    RouterModule.forChild(routes),
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MatSlideToggleModule, MatDividerModule, MatMenuModule,
    MatStepperModule, MatChipsModule, MatTabsModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressBarModule, MatExpansionModule,
    MatRadioModule, MatCheckboxModule, MatSliderModule,
    MatBadgeModule, NgChartsModule,
  ],
})
export class PesquisasModule {}
