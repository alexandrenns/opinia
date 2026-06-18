import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Municipio } from '../municipios/municipio.entity';
import { Contratante } from '../contratantes/contratante.entity';
import { Pergunta } from '../perguntas/pergunta.entity';
import { Lote } from '../tokens/lote.entity';

export type StatusPesquisa = 'Planejamento' | 'Distribuição' | 'Em andamento' | 'Encerrada' | 'Arquivada';
export type TipoPesquisa = 'Opinião Pública' | 'Administração Pública' | 'Eleitoral' | 'Temática';

@Entity('pesquisas')
export class Pesquisa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Municipio, (m) => m.pesquisas)
  @JoinColumn({ name: 'municipioId' })
  municipio: Municipio;

  @Column()
  municipioId: string;

  @ManyToOne(() => Contratante, (c) => c.pesquisas)
  @JoinColumn({ name: 'contratanteId' })
  contratante: Contratante;

  @Column()
  contratanteId: string;

  @Column()
  nome: string;

  @Column({ default: 'Opinião Pública' })
  tipo: string;

  @Column({ type: 'date', nullable: true })
  dataInicial: Date;

  @Column({ type: 'date', nullable: true })
  dataFinal: Date;

  @Column({ default: 'Planejamento' })
  status: string;

  @OneToMany(() => Pergunta, (p) => p.pesquisa, { cascade: true })
  perguntas: Pergunta[];

  @OneToMany(() => Lote, (l) => l.pesquisa, { cascade: true })
  lotes: Lote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
