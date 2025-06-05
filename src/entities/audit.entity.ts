import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BaseEntity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm"
import { EntityUser } from "./user.entity";

@Entity()
export class Audit extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EntityUser)
  @JoinColumn({ name: "idUserExecutor" })
  idUserExecutor: number;

  @Column()
  actionType: string;

  @ManyToOne(() => EntityUser)
  @JoinColumn({ name: "idUserModificated" })
  idUserModificated: number;

  @Column()
  data: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
