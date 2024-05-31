import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BaseEntity,
} from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Notification extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  content: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
