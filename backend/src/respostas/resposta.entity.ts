import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Token } from '../tokens/token.entity';

@Entity('respostas')
export class Resposta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Token, (t) => t.resposta)
  @JoinColumn({ name: 'tokenId' })
  token: Token;

  @Column()
  tokenId: string;

  @Column()
  pesquisaId: string;

  @Column()
  bairroId: string;

  @Column({ type: 'jsonb' })
  respostas: any;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}
