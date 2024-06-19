import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import { User } from "../user/entity";

@typeGQL.ObjectType()
@typeORM.Entity()
export class Notification extends typeORM.BaseEntity {
  @typeGQL.Field(() => typeGQL.ID)
  @typeORM.PrimaryGeneratedColumn()
  id: number;

  @typeGQL.Field()
  @typeORM.Column()
  content: string;

  @typeGQL.Field(() => User)
  @typeORM.ManyToOne(() => User, (user) => user.notifications)
  user: User;
}
