import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';

interface Service {
  icon: string;
  title: string;
  desc: string;
}

interface Step {
  num: string;
  title: string;
  desc: string;
}

interface Stat {
  value: string;
  label: string;
}

interface Client {
  icon: string;
  label: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  menuOpen = false;
  scrolled = false;

  // Substitua pelo número real do WhatsApp do instituto
  readonly whatsappUrl =
    'https://wa.me/5571999999999?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20uma%20proposta%20do%20Instituto%20Prisma%20da%20Bahia.';

  readonly currentYear = new Date().getFullYear();

  readonly stats: Stat[] = [
    { value: '48+',    label: 'Municípios atendidos' },
    { value: '200+',   label: 'Pesquisas realizadas' },
    { value: '12 mil', label: 'Entrevistados' },
    { value: '±2,8%',  label: 'Margem de erro média' },
  ];

  readonly services: Service[] = [
    {
      icon: 'poll',
      title: 'Pesquisa de Opinião Pública',
      desc: 'Avaliação da percepção da população sobre temas municipais, serviços públicos e gestão local.',
    },
    {
      icon: 'how_to_vote',
      title: 'Pesquisa Eleitoral',
      desc: 'Levantamento de intenção de voto, cenários eleitorais e avaliação de candidatos com rigor científico.',
    },
    {
      icon: 'account_balance',
      title: 'Avaliação da Gestão Pública',
      desc: 'Mensuração da satisfação da população com a administração pública, obras e projetos em andamento.',
    },
    {
      icon: 'corporate_fare',
      title: 'Pesquisa Institucional',
      desc: 'Diagnóstico de imagem, reputação e percepção de marca para órgãos públicos e entidades.',
    },
    {
      icon: 'storefront',
      title: 'Pesquisa de Mercado',
      desc: 'Comportamento do consumidor, satisfação de clientes e análise de tendências para o setor privado.',
    },
    {
      icon: 'tune',
      title: 'Pesquisas Personalizadas',
      desc: 'Projetos sob medida com metodologia adaptada à realidade e aos objetivos específicos do cliente.',
    },
  ];

  readonly steps: Step[] = [
    { num: '01', title: 'Planejamento',        desc: 'Definição do público-alvo, amostra representativa e objetivos da pesquisa.' },
    { num: '02', title: 'Amostragem',          desc: 'Cálculo estatístico da amostra com base no universo a ser estudado.' },
    { num: '03', title: 'Coleta Digital',      desc: 'Questionários digitais georreferenciados com validação em tempo real.' },
    { num: '04', title: 'Validação',           desc: 'Revisão, limpeza e consistência dos dados antes da análise.' },
    { num: '05', title: 'Análise Estatística', desc: 'Tabulação, cruzamentos e interpretação com software especializado.' },
    { num: '06', title: 'Relatório Final',     desc: 'Entrega de relatório completo com gráficos, tabelas e recomendações.' },
  ];

  readonly differentials: string[] = [
    'Metodologia científica rigorosa',
    'Controle de qualidade em cada etapa',
    'Questionários digitais e georreferenciados',
    'Equipe especializada em pesquisa',
    'Conformidade total com a LGPD',
    'Sigilo absoluto das informações',
    'Relatórios completos e objetivos',
    'Suporte técnico pós-entrega',
  ];

  readonly clients: Client[] = [
    { icon: 'account_balance',  label: 'Prefeituras' },
    { icon: 'business',         label: 'Empresas' },
    { icon: 'apartment',        label: 'Instituições' },
    { icon: 'hub',              label: 'Consórcios Públicos' },
    { icon: 'groups',           label: 'Organizações' },
    { icon: 'campaign',         label: 'Campanhas Eleitorais' },
  ];

  private observers: IntersectionObserver[] = [];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 60;
  }

  ngOnInit(): void {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    this.observers.push(io);
  }

  ngOnDestroy(): void {
    this.observers.forEach(o => o.disconnect());
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.menuOpen = false;
  }
}
