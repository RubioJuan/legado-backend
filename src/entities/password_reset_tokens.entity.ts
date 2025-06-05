import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from "typeorm"
import { EntityUser } from './user.entity'

@Entity()
export class PasswordResetTokens extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  idUser: number

  @Column()
  token: string

  @CreateDateColumn()
  createAt: Date

  @UpdateDateColumn()
  updateAt: Date
}
