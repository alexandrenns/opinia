import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

type State = "loading" | "intro" | "survey" | "submitting" | "done" | "error";

@Component({
  selector: "app-survey",
  templateUrl: "./survey.component.html",
  styleUrls: ["./survey.component.scss"],
})
export class SurveyComponent implements OnInit {
  Math = Math;
  state: State = "loading";
  errorMsg = "";
  token = "";

  survey: any = null;
  config: any = null;
  // Guarda TODAS as perguntas — inclusive condicionais
  allPerguntas: any[] = [];

  currentIndex = 0;
  answers: Record<string, any> = {};

  private apiBase = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.params["token"]?.toUpperCase();
    this.loadSurvey();
  }

  loadSurvey() {
    this.http.get<any>(`${this.apiBase}/s/${this.token}`).subscribe({
      next: (data) => {
        this.survey = data.pesquisa;
        this.config = data.config;
        this.allPerguntas = data.perguntas || [];
        this.state = "intro";
      },
      error: (e) => {
        this.errorMsg =
          e.error?.message || "Token inválido ou pesquisa não encontrada.";
        this.state = "error";
      },
    });
  }

  startSurvey() {
    this.currentIndex = 0;
    this.answers = {};
    this.state = "survey";
  }

  // Perguntas visíveis no momento atual — recalculado a cada mudança de answers
  get visiblePerguntas(): any[] {
    return this.allPerguntas.filter((p) => this.isPerguntaVisible(p));
  }

  isPerguntaVisible(p: any): boolean {
    // Perguntas normais: sempre visíveis
    if (p.tipo !== "condicional") return true;
    // Sem condição definida: sempre visível
    if (!p.perguntaCondicionalId || !p.alternativaCondicionalId) return true;
    // Verifica se a resposta da pergunta-pai bate com a alternativa esperada
    const resp = this.answers[p.perguntaCondicionalId];
    if (resp === undefined || resp === null || resp === "") return false;
    if (Array.isArray(resp)) return resp.includes(p.alternativaCondicionalId);
    return resp === p.alternativaCondicionalId;
  }

  get currentPergunta(): any {
    return this.visiblePerguntas[this.currentIndex];
  }
  get totalVisible(): number {
    return this.visiblePerguntas.length;
  }
  get progress(): number {
    return this.totalVisible > 0
      ? (this.currentIndex / this.totalVisible) * 100
      : 0;
  }
  get isLast(): boolean {
    return this.currentIndex === this.totalVisible - 1;
  }

  answerEscolha(alternativaId: string) {
    this.answers = {
      ...this.answers,
      [this.currentPergunta.id]: alternativaId,
    };
  }

  answerMultipla(alternativaId: string, checked: boolean) {
    const cur: string[] = this.answers[this.currentPergunta.id] || [];
    const next = checked
      ? [...cur, alternativaId]
      : cur.filter((x) => x !== alternativaId);
    this.answers = { ...this.answers, [this.currentPergunta.id]: next };
  }

  isMultiplaChecked(altId: string): boolean {
    const cur = this.answers[this.currentPergunta?.id];
    return Array.isArray(cur) && cur.includes(altId);
  }

  answerEscala(value: number) {
    this.answers = { ...this.answers, [this.currentPergunta.id]: value };
  }

  canAdvance(): boolean {
    const p = this.currentPergunta;
    const ans = this.answers[p?.id];
    if (!p) return false;
    if (p.tipo === "escala") return ans !== undefined && ans !== null;
    if (p.tipo === "multipla_escolha")
      return Array.isArray(ans) && ans.length > 0;
    return !!ans;
  }

  next() {
    if (!this.canAdvance()) return;
    if (this.isLast) {
      this.submit();
      return;
    }
    // Avança para o próximo index — visiblePerguntas já filtra automaticamente
    this.currentIndex++;
  }

  prev() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  submit() {
    this.state = "submitting";
    this.http
      .post<any>(`${this.apiBase}/s/${this.token}/responder`, {
        respostas: this.answers,
      })
      .subscribe({
        next: () => {
          this.state = "done";
        },
        error: (e) => {
          this.errorMsg = e.error?.message || "Erro ao enviar respostas.";
          this.state = "error";
        },
      });
  }

  getEscalaRange(p: any): number[] {
    const min = p.escalaMin ?? 1;
    const max = p.escalaMax ?? 10;
    const arr = [];
    for (let i = min; i <= max; i++) arr.push(i);
    return arr;
  }

  getImageUrl(path: string | null): string {
    if (!path) return "";
    return path.startsWith("http") ? path : `${this.apiBase}${path}`;
  }
}
