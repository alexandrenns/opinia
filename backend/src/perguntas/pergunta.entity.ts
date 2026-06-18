import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { Alternativa } from './alternativa.entity';

export type TipoPergunta = 'escolha_unica' | 'multipla_escolha' | 'escala' | 'condicional';

@Entity('perguntas')
export class Pergunta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pesquisa, (p) => p.perguntas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pesquisaId' })
  pesquisa: Pesquisa;

  @Column()
  pesquisaId: string;

  @Column()
  texto: string;

  @Column()
  tipo: string;

  @Column({ default: 0 })
  ordem: number;

  @Column({ nullable: true })
  perguntaCondicionalId: string;

  @Column({ nullable: true })
  alternativaCondicionalId: string;

  @Column({ nullable: true })
  escalaMin: number;

  @Column({ nullable: true })
  escalaMax: number;

  @Column({ nullable: true })
  escalaLabelMin: string;

  @Column({ nullable: true })
  escalaLabelMax: string;

  @OneToMany(() => Alternativa, (a) => a.pergunta, { cascade: true })
  alternativas: Alternativa[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
