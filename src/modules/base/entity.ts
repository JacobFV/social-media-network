import { DataClass } from "@/utils/dataclass";
import { BaseEntity } from "typeorm";

@DataClass
export class CommonBaseEntity extends BaseEntity {}

export interface EntityWithID extends CommonBaseEntity {
  id: number;
}

export interface EntityWithOwner extends CommonBaseEntity {
  ownerId: number;
}
