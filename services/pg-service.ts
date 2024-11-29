import { FirePoint } from "./process.ts";
import * as pg from "https://deno.land/x/postgres@v0.14.0/mod.ts";

export class DatabaseService {
  private pool: pg.Pool;

  constructor() {
    const user = Deno.env.get("POSTGRES_USER");
    const password = Deno.env.get("POSTGRES_PASSWORD");
    const database = Deno.env.get("POSTGRES_DATABASE");
    const hostname = Deno.env.get("POSTGRES_HOST");

    this.pool = new pg.Pool(
      {
        database,
        hostname,
        password,
        port: 5432,
        user,
        tls: { enabled: true, enforce: true },
      },
      3,
      true
    );

    console.log(`Connecting to database ${database} at ${hostname}...`);
  }

  public async query(sql: string) {
    const client = await this.pool.connect();
    try {
      return await client.queryObject(sql);
    } catch (error) {
      console.error("Database query error: ", error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.queryObject("begin");
      const result = await callback(client);
      await client.queryObject("commit");
      return result;
    } catch (error) {
      await client.queryObject("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  public async end() {
    await this.pool.end();
  }
}

export class Upgrade {
  constructor(private db: DatabaseService) {}

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  public async clearFirePointsTable(): Promise<void> {
    await this.db.query("truncate table fire_points restart identity");
  }

  public async insert(firePoints: FirePoint[]): Promise<void> {
    const baseQuery = `
    insert into fire_points (
      latitude, longitude, bright_ti4, scan, track,
      acq_date, acq_time, satellite, confidence, version,
      bright_ti5, frp, daynight, ndvi
    ) values `;

    const chunks = this.chunkArray(firePoints, 100);

    for (const chunk of chunks) {
      const values = chunk
        .map(
          (point, index) => `(
        ${point.latitude},
        ${point.longitude},
        ${point.bright_ti4},
        ${point.scan},
        ${point.track},
        '${point.acq_date}',
        '${point.acq_time}',
        '${point.satellite}',
        '${point.confidence}',
        '${point.version}',
        ${point.bright_ti5},
        ${point.frp},
        '${point.daynight}',
        ${point.ndvi ? point.ndvi : "null"}
      )`
        )
        .join(",");

      const fullQuery = baseQuery + values;
      await this.db.query(fullQuery);
    }

    console.log("Successfully upgrade data 🚀");
  }
}
