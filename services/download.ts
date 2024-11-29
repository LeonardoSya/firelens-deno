export class Download {
  private readonly url =
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_Global_48h.csv";
  private readonly output = "./data/source_data.csv";
  private readonly timeout = 300000;

  public async download() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.timeout);

      const response = await fetch(this.url, { signal: controller.signal });

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
      }
      clearTimeout(timeoutId);

      const data = new Uint8Array(downloaded);
      let position = 0;
      for (const chunk of chunks) {
        data.set(chunk, position);
        position += chunk.length;
      }
      await Deno.writeFile(this.output, data);
      console.log("\nSuccessfully download source data 🌏");
    } catch (error) {
      console.error("Download failed: ", error);
      throw error;
    }
  }
}
