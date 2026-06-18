import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, tap } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly TOKEN_KEY = "opinia_token";
  private readonly USER_KEY = "opinia_user";
  private loggedIn$ = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          // Grava token ANTES do subscribe retornar ao componente
          localStorage.setItem(this.TOKEN_KEY, res.access_token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.loggedIn$.next(true);
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.loggedIn$.next(false);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;
    // Verifica se o token não está corrompido (deve ter 3 partes JWT)
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        this.logout();
        return false;
      }
      // Verifica expiração
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  get loggedIn() {
    return this.loggedIn$.asObservable();
  }
}
