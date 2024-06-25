import { DataClass, Default } from "@/utils/dataclass";

const PROTOCOLS = ["http", "https", "ws", "wss", "tcp", "udp"] as const;
type Protocol = (typeof PROTOCOLS)[number];

@DataClass
class Config {
  @Default(() => (process.env.PROTOCOL as Protocol) || "http")
  protocol: Protocol;

  @Default(() => parseInt(process.env.SERVER_PORT || "3000", 10))
  serverPort: number;

  @Default(() => process.env.SERVER_HOST || "localhost")
  serverHost: string;

  @Default(() => process.env.DATABASE_HOST || "localhost")
  databaseHost: string;

  @Default(() => parseInt(process.env.DATABASE_PORT || "3306", 10))
  databasePort: number;

  @Default(() => process.env.DATABASE_USER || "root")
  databaseUser: string;

  @Default(() => process.env.DATABASE_PASSWORD || "")
  databasePassword: string;

  @Default(() => process.env.DATABASE_NAME || "mydatabase")
  databaseName: string;

  get serverUrl(): string {
    return `${this.protocol}://${this.serverHost}:${this.serverPort}`;
  }

  set serverUrl(url: string) {
    const protocolsPattern = PROTOCOLS.join("|");
    const urlPattern = new RegExp(
      `^(${protocolsPattern}):\\/\\/([^:\\/\\s]+):?(\\d*)(\\/\\w*)*$`
    );
    const match = url.match(urlPattern);
    if (match) {
      this.protocol = match[1] as Protocol;
      this.serverHost = match[2];
      if (match[3]) {
        this.serverPort = parseInt(match[3], 10);
      }
    } else {
      throw new Error(
        "Invalid URL format. Expected: <protocol>://<host>:<port>. Example: http://localhost:3000"
      );
    }
  }
}

export const config = new Config();
