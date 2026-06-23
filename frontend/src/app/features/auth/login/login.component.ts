import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  form = this.fb.group({
    email: ["admin@opinia.com", [Validators.required, Validators.email]],
    password: ["admin123", Validators.required],
  });

  loading = false;
  hidePassword = true;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private notify: NotificationService,
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;

    const { email, password } = this.form.value;

    this.http
      .post<any>("/api/auth/login", { email, password })
      .subscribe({
        next: (res) => {
          if (res?.access_token) {
            localStorage.setItem("opinia_token", res.access_token);
            localStorage.setItem("opinia_user", JSON.stringify(res.user));
            this.notify.success("Login realizado com sucesso!");
            this.loading = false;
            // Hard navigation garante que o app reinicia com o token já no storage
            window.location.href = "/dashboard";
          } else {
            this.notify.error("Erro inesperado na resposta do servidor");
            this.loading = false;
          }
        },
        error: (err) => {
          this.loading = false;
          this.notify.error(
            err.status === 0
              ? "Não foi possível conectar ao servidor (porta 3000)."
              : err.error?.message || "Credenciais inválidas",
          );
        },
      });
  }
}
