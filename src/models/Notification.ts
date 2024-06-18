import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";
import { PgSchema, pgSchema, serial, text } from "drizzle-orm/pg-core";

@ObjectType()
@Drizzle.Entity()
export class Notification extends BaseEntity {
  @Field(() => ID)
  @DrizzleColumn(serial("id").primaryKey())
  id: number;

  @Field()
  @DrizzleColumn(text("content"))
  content: string;

  @Field(() => User)
  @DrizzleColumn((schema: DrizzleSchema) =>
    serial("user_id").references(() => schema.user.id, "id")
  )
  user: User;
}

import { createParamDecorator } from "type-graphql";
import { AnyPgColumn, DrizzleSchema } from "drizzle-orm/pg-core";

export function DrizzleColumn(
  columnOrFactory: AnyPgColumn | ((schema: DrizzleSchema) => AnyPgColumn)
) {
  return createParamDecorator(({ propertyKey }) => {
    return { propertyKey, columnOrFactory };
  });
}
