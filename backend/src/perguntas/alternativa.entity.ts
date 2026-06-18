import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Pergunta } from './pergunta.entity';

@Entity('alternativas')
export class Alternativa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pergunta, (p) => p.alternativas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perguntaId' })
  pergunta: Pergunta;

  @Column()
  perguntaId: string;

  @Column()
  texto: string;

  @Column({ default: 0 })
  ordem: number;

  @CreateDateColumn()
  createdAt: Date;
}
