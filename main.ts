import { load } from "@std/dotenv";
import { Cron } from "https://deno.land/x/croner@7.0.5/dist/croner.js";
import { Download } from "./services/download.ts";
import { Process } from "./services/process.ts";
import { DatabaseService, Upgrade } from "./services/pg-service.ts";

await load({ export: true });

let isRunning = false;

const upgradeFirePointsData = async () => {
  if (isRunning) return;

  const downloader = new Download();
  const processor = new Process();
  const db = new DatabaseService();
  const upgrader = new Upgrade(db);

  try {
    await downloader.download();

    const records = await processor.process();
    await upgrader.clearFirePointsTable();
    await upgrader.insert(records);
  } catch (error) {
    console.error(
      `System cron error [${new Date().toLocaleDateString()}]: `,
      error
    );
  } finally {
    await db.end();
    isRunning = false;
  }
};

const upgradeCron = new Cron(
  "*/60 * * * *",
  {
    timezone: "Asia/Shanghai",
    name: "system-cron",
    protect: true,
    maxRuns: Infinity,
  },
  async () => {
    await upgradeFirePointsData();
  }
);

Deno.addSignalListener("SIGINT", () => {
  console.log("\nStopping cron...");
  upgradeCron.stop();
  Deno.exit(0);
});

console.log("Upgrade cron started...");

await upgradeFirePointsData();