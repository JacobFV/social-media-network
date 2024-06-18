import { Command } from "commander";
import express from "express";

const app = express();
const program = new Command();

program
  .name("example-cli")
  .description("CLI to manage the app")
  .version("0.1.0");

program
  .command("serve")
  .description("Start the server")
  .action(() => {
    app.listen(4000, () => {
      console.log("Server started on http://localhost:4000/graphql");
    });
  });

program
  .command("migrate")
  .description("Run database migrations")
  .action(() => {
    console.log("Database migrations run successfully.");
    // Add actual migration logic here
  });

program
  .command("info")
  .description("Display information about the system")
  .action(() => {
    console.log("System Info:");
    console.log("Version: 0.1.0");
    // Add more system info logic here
  });

program.parse(process.argv);
