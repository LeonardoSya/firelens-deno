export class Download {
  private readonly url =
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_Global_48h.csv";
  private readonly output = "./data/source_data.csv";
  private readonly timeout = 600000;

  public async download() {
    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();

      timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      const response = await fetch(this.url, { signal: controller.signal });

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let downloaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        downloaded += value.length;

        // log下载进度 - 每100MB显示一次
        if (downloaded % (100 * 1024 * 1024) === 0) {
          console.log(`${(downloaded / 1024 / 1024).toFixed(2)} MB`);
        }
      }

      const data = new Uint8Array(downloaded);
      let position = 0;
      for (const chunk of chunks) {
        data.set(chunk, position);
        position += chunk.length;
      }
      await Deno.writeFile(this.output, data);
      console.log("\nSuccessfully download source data 🌏");
      console.log(`\n源数据大小: ${(downloaded / 1024 / 1024).toFixed(2)} MB 🌏`);

    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (error.name === "AbortError") {
        console.error(`下载超时 (${this.timeout / 1000}秒): `, error);
        throw new Error(`下载超时，请检查网络连接`);
      }
      console.error("Download failed: ", error);
      throw error;
    }
  }
}
