import { Component } from "@angular/core";
import {
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { ApiService } from "../../../core/services/api.service";
import { NotificationService } from "../../../core/services/notification.service";

function senhasIguaisValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const nova = control.get("novaSenha")?.value;
  const confirm = control.get("confirmarSenha")?.value;
  if (nova && confirm && nova !== confirm) {
    return { senhasDiferentes: true };
  }
  return null;
}

@Component({
  selector: "app-change-password-dialog",
  template: `
    <div class="dialog-header">
      <mat-icon>lock_reset</mat-icon>
      <h3>Alterar Senha</h3>
      <span class="spacer"></span>
      <button mat-icon-button (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content style="padding:24px;min-width:380px;max-width:95vw">
      <form
        [formGroup]="form"
        style="display:flex;flex-direction:column;gap:4px"
      >
        <mat-form-field appearance="outline">
          <mat-label>Senha Atual</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input
            matInput
            [type]="hide1 ? 'password' : 'text'"
            formControlName="senhaAtual"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hide1 = !hide1"
          >
            <mat-icon>{{ hide1 ? "visibility" : "visibility_off" }}</mat-icon>
          </button>
          <mat-error>Senha atual obrigatória</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nova Senha</mat-label>
          <mat-icon matPrefix>lock_open</mat-icon>
          <input
            matInput
            [type]="hide2 ? 'password' : 'text'"
            formControlName="novaSenha"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hide2 = !hide2"
          >
            <mat-icon>{{ hide2 ? "visibility" : "visibility_off" }}</mat-icon>
          </button>
          <mat-hint>Mínimo 6 caracteres</mat-hint>
          <mat-error *ngIf="form.get('novaSenha')?.hasError('required')"
            >Nova senha obrigatória</mat-error
          >
          <mat-error *ngIf="form.get('novaSenha')?.hasError('minlength')"
            >Mínimo 6 caracteres</mat-error
          >
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Confirmar Nova Senha</mat-label>
          <mat-icon matPrefix>lock_outline</mat-icon>
          <input
            matInput
            [type]="hide3 ? 'password' : 'text'"
            formControlName="confirmarSenha"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="hide3 = !hide3"
          >
            <mat-icon>{{ hide3 ? "visibility" : "visibility_off" }}</mat-icon>
          </button>
          <mat-error *ngIf="form.get('confirmarSenha')?.hasError('required')"
            >Confirmação obrigatória</mat-error
          >
        </mat-form-field>

        <div
          *ngIf="
            form.hasError('senhasDiferentes') &&
            form.get('confirmarSenha')?.touched
          "
          style="color:#DC3545;font-size:12px;padding:4px 0 0 4px;display:flex;align-items:center;gap:4px"
        >
          <mat-icon style="font-size:14px;width:14px;height:14px"
            >error</mat-icon
          >
          As senhas não coincidem
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding:12px 24px;gap:8px">
      <button
        mat-stroked-button
        (click)="dialogRef.close()"
        [disabled]="loading"
      >
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="submit()"
        [disabled]="loading || form.invalid"
      >
        <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
        <mat-icon *ngIf="!loading">save</mat-icon>
        {{ loading ? "Salvando..." : "Alterar Senha" }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ChangePasswordDialogComponent {
  form = this.fb.group(
    {
      senhaAtual: ["", Validators.required],
      novaSenha: ["", [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ["", Validators.required],
    },
    { validators: senhasIguaisValidator },
  );

  loading = false;
  hide1 = true;
  hide2 = true;
  hide3 = true;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
  ) {}

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { senhaAtual, novaSenha } = this.form.value;

    this.api.changePassword(senhaAtual!, novaSenha!).subscribe({
      next: (res) => {
        this.notify.success(res.message || "Senha alterada com sucesso!");
        this.dialogRef.close(true);
      },
      error: (e) => {
        this.loading = false;
        this.notify.error(e.error?.message || "Erro ao alterar senha");
      },
    });
  }
}
