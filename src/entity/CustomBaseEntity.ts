import { BaseEntity } from "typeorm";

export class CustomBaseEntity<T> extends BaseEntity {}

export interface EntityWithID<T> extends CustomBaseEntity<T> {
  id: number;
}

export interface EntityWithOwner<T> extends CustomBaseEntity<T> {
  ownerId: number;
}
