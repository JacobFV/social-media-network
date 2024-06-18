import { DataClass } from "@/utils/dataclass";
import { DrizzleEntity } from "drizzle-orm";

@DataClass
export default class Context {
  currentAuthenticatedUser: any;
  dbSession: any;
  config: any;
  resolutionChain!: DrizzleEntity[];
  get currentRecord() {
    return this.resolutionChain[this.resolutionChain.length - 1];
  }
}
