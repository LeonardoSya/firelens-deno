import { parse, stringify } from "@std/csv";
import { fromFile } from "geotiff";

export interface FirePoint {
  latitude: number;
  longitude: number;
  bright_ti4: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version: string;
  bright_ti5: number;
  frp: number;
  daynight: string;
  ndvi?: number;
}

export class Process {
  private readonly input = "./data/source_data.csv";
  private readonly output = "./data/process_data.csv";
  private readonly tif = "./data/ndvi2407.tif";

  private static tifDataCache: any = null;

  public async process() {
    try {
      await this.checkFiles();

      const tifData = await this.loadTif();
      const getNdvi = this.createCalculator(tifData);

      const csvContent = await Deno.readTextFile(this.input);
      const records = parse(csvContent, {
        skipFirstRow: true,
        columns: [
          "latitude",
          "longitude",
          "bright_ti4",
          "scan",
          "track",
          "acq_date",
          "acq_time",
          "satellite",
          "confidence",
          "version",
          "bright_ti5",
          "frp",
          "daynight",
        ],
      });

      const totalRecords = records.length;

      const results = records.map((data: any) => {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);

        const processedData = {
          latitude: lat,
          longitude: lon,
          bright_ti4: parseFloat(data.bright_ti4),
          scan: parseFloat(data.scan),
          track: parseFloat(data.track),
          acq_date: data.acq_date,
          acq_time: data.acq_time,
          satellite: data.satellite,
          confidence: data.confidence,
          version: data.version,
          bright_ti5: parseFloat(data.bright_ti5),
          frp: parseFloat(data.frp),
          daynight: data.daynight,
        };

        let ndviValue: number | null = null;
        try {
          ndviValue = getNdvi(lat, lon);
        } catch (error: any) {
          console.warn(
            `Calculator ndvi error (${lat}, ${lon}): ${error.message}`
          );
        }

        return {
          ...processedData,
          ndvi: ndviValue,
        };
      });

      const headers = [
        "latitude",
        "longitude",
        "bright_ti4",
        "scan",
        "track",
        "acq_date",
        "acq_time",
        "satellite",
        "confidence",
        "version",
        "bright_ti5",
        "frp",
        "daynight",
        "ndvi",
      ];

      const output = stringify(results, { columns: headers });
      await Deno.writeTextFile(this.output, output);

      console.log(`Successfully process data, total records: ${totalRecords} 🌲`);

      return results as FirePoint[];
    } catch (error) {
      console.error("Process error: ", error);
      throw error;
    }
  }

  private async checkFiles() {
    try {
      await Deno.stat(this.input);
      await Deno.stat(this.tif);
    } catch (error) {
      throw new Error("input path error");
    }
  }

  private async loadTif() {
    if (Process.tifDataCache) {
      return Process.tifDataCache;
    }

    const tif = await fromFile(this.tif);
    const image = await tif.getImage();
    const rasters = await image.readRasters();
    const bbox = image.getBoundingBox();

    const result = {
      rasters,
      bbox,
      width: image.getWidth(),
      height: image.getHeight(),
    };

    // cache tiff
    Process.tifDataCache = result;
    return result;
  }

  private createCalculator(tifData: any) {
    const { rasters, bbox, width, height } = tifData;
    const [xMin, yMin, xMax, yMax] = bbox;

    return (lat: number, lon: number): number | null => {
      const x = ((lon - xMin) / (xMax - xMin)) * width;
      const y = ((yMax - lat) / (yMax - yMin)) * height;
      const ix = Math.floor(x);
      const iy = Math.floor(y);

      if (ix < 0 || ix >= width || iy < 0 || iy >= height) {
        return null;
      }
      return rasters[0][iy * width + ix];
    };
  }
}
