import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Lote } from './lote.entity';
import { Resposta } from '../respostas/resposta.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @ManyToOne(() => Lote, (l) => l.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loteId' })
  lote: Lote;

  @Column()
  loteId: string;

  @Column({ default: false })
  usado: boolean;

  @Column({ nullable: true })
  usadoEm: Date;

  @OneToOne(() => Resposta, (r) => r.token)
  resposta: Resposta;

  @CreateDateColumn()
  createdAt: Date;
}
