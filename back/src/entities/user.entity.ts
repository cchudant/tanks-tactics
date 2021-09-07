import { Role } from 'src/auth/user.session'
import { Column, Entity, Index, Unique } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity()
@Unique(UserEntity.NAME_UNIQUE_CONSTRAINT, ['name'])
export class UserEntity extends BaseEntity {
  static NAME_UNIQUE_CONSTRAINT = 'user_entity_name_unique'

  @Column()
  @Index()
  name!: string

  /** Password hash */
  @Column({ nullable: true })
  password?: string

  @Column({ default: false })
  isDefaultPassword!: boolean

  @Column({ enum: Role, default: Role.USER })
  role!: Role
}
