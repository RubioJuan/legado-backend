import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

//Entities
import { Association } from "./association.entity";
import { Role } from "./role.entity";
import { Subscription } from "./subscription.entity";
import { Tail } from "./tail.entity";
import { UserProcessState } from "./user-process-state.entity";
import { UserState } from "./user-state.entity";

@Entity("entity_user")
export class EntityUser extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ length: 100 })
  password!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 100 })
  country!: string;

  @Column({ length: 10 })
  countryCode!: string;

  @Column({ length: 20 })
  phoneNumber!: string;

  @Column({ default: 0 })
  ballsSended!: number;

  @Column({ default: 0 })
  ballsReceived!: number;

  @Column({ type: "int", default: 0 })
  ballsReceivedConfirmed!: number;

  @Column({ type: "simple-array", nullable: true })
  beneficiatedNames!: string[] | null;

  @Column({ type: "simple-array", nullable: true })
  beneficiatedPhoneNumber!: string[] | null;

  @Column({ type: "simple-array", nullable: true })
  beneficiatedCountry!: string[] | null;

  @Column({ type: "simple-array", nullable: true })
  beneficiatedCountryCode!: string[] | null;

  @Column({ default: true })
  acceptMarketing!: boolean;

  @Column({ default: false })
  triplicationDone!: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updateAt!: Date;

  // Relationships
  @Column()
  idRole!: number;
  @ManyToOne(() => Role, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: "idRole" })
  role?: Role;

  @Column()
  idUserState!: number;
  @ManyToOne(() => UserState, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: "idUserState" })
  userState?: UserState;

  @Column({ nullable: true })
  idLeftAssociation?: number | null;
  @OneToOne(() => Association, { nullable: true, cascade: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "idLeftAssociation" })
  leftAssociation?: Association | null;

  @Column({ nullable: true })
  idRightAssociation?: number | null;
  @OneToOne(() => Association, { nullable: true, cascade: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "idRightAssociation" })
  rightAssociation?: Association | null;
  
  @Column({ nullable: true })
  idUserProcessState?: number | null;
  @ManyToOne(() => UserProcessState, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "idUserProcessState" })
  userProcessState?: UserProcessState | null;

  @Column({ nullable: true })
  idCaptain?: number | null;
  @ManyToOne(() => EntityUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "idCaptain" })
  captain?: EntityUser | null;

  @Column({ nullable: true })
  triplicationOfId?: number | null;
  @ManyToOne(() => EntityUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "triplicationOfId" })
  triplicationOf?: EntityUser | null; 

  @OneToMany(() => EntityUser, (userChild) => userChild.triplicationOf)
  childrenAsTriplicationOf!: EntityUser[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];

  @OneToOne(() => Tail, (tail) => tail.user, { nullable: true, cascade: true })
  tail?: Tail | null;
  
  // Fields for password reset token
  @Column({ type: "varchar", length: 255, nullable: true })
  passwordResetToken?: string | null;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpires?: Date | null;

  // New fields for security questions - MODIFIED FOR SINGLE QUESTION
  @Column({ type: "varchar", length: 255, nullable: true })
  securityQuestion?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  securityAnswerHash?: string | null;

  @Column({ type: "int", default: 0 })
  failedSecurityAttempts!: number;

  @Column({ type: "timestamp", nullable: true })
  securityLockoutUntil?: Date | null;

  // NUEVA COLUMNA PARA BILLETERA VIRTUAL
  @Column({ type: 'json', nullable: true })
  paymentMethods?: Array<{ type: string; value: string; accountType?: string; [key: string]: any }> | null;
  // He añadido accountType como ejemplo opcional por si para Bancolombia necesitas "Ahorros" o "Corriente"

  // Fields for dual role: General on Board N, Recruit on Board N+1
  @Column({ type: "int", nullable: true })
  secondaryBoardIdAsRecruit?: number | null;

  @Column({ type: "int", nullable: true })
  secondaryBoardLevelIdAsRecruit?: number | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  secondaryPositionAsRecruit?: string | null; // e.g., "idDefender1"

  @Column({ type: "boolean", default: true })
  canVerifyRecruits!: boolean;

  @Column({ type: "int", nullable: true })
  creatorUserId?: number | null;

  @Column({ type: 'int', default: 0, name: 'unlockCount' })
  unlockCount: number;
}
