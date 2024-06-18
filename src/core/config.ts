const PROTOCOLS = ["http", "https", "ws", "wss", "tcp", "udp"] as const;
type Protocol = (typeof PROTOCOLS)[number];

class Config {
  protocol: Protocol = "http";
  serverPort: number = 3000;
  serverHost: string = "localhost";

  constructor() {
    this.protocol = (process.env.PROTOCOL as Protocol) || this.protocol;
    this.serverHost = process.env.SERVER_HOST || this.serverHost;
    this.serverPort = parseInt(
      process.env.SERVER_PORT || this.serverPort.toString(),
      10
    );
  }

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
      throw new Error("Invalid URL format");
    }
  }
}
