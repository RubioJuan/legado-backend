import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Board } from "./board.entity";
import { SubscriptionState } from "./subscription-state.entity";
import { EntityUser } from "./user.entity";

@Entity("subscription")
export class Subscription extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  idBoard!: number;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "idBoard" })
  board!: Board;

  @Column({ nullable: true })
  idSubscriptionState!: number | null;

  @ManyToOne(() => SubscriptionState, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: "idSubscriptionState" })
  subscriptionState?: SubscriptionState;

  @Column()
  idUser!: number;

  @ManyToOne(() => EntityUser, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "idUser" })
  user!: EntityUser;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updateAt!: Date;
}
