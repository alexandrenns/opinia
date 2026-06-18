import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem("opinia_token");
    console.log(
      "[AuthGuard] Verificando token:",
      token ? "ENCONTRADO" : "AUSENTE",
    );
    if (token) return true;
    this.router.navigate(["/auth/login"], { replaceUrl: true });
    return false;
  }
}
