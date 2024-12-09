<p align="center">
  <strong>🔥 Firelens-Deno<br /></strong>
  <strong>A Deno-based backend service that provides fire points data for the FireLens Next.js application. This service automatically downloads, processes and stores global fire points data from NASA, enriched with NDVI (Normalized Difference Vegetation Index) information.</strong>
</p>

## 🚀 Getting Started
[![My Skills](https://skillicons.dev/icons?i=deno)](https://skillicons.dev)
- Deno >=1.x 
```bash
# install deno
curl -fsSL https://deno.land/install.sh | sh  # macos
irm https://deno.land/install.ps1 | iex  # windows
deno --version

git clone https://github.com/LeonardoSya/firelens-deno
cd firelens-deno
deno task start
```
- 👋 Download [ndvi2407.tif](https://drive.google.com/file/d/10kXJ_bZzjbioaZp3gPqhe46PHIIF8ySA/view?usp=drive_link) and make sure to put `ndvi2407.tif` in `data/`.
- 🧷 Create a .env file in the root directory with the following variables:
```bash
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database
POSTGRES_HOST=your_host
```

## 🛠️ Technology Stack
[![My Skills](https://skillicons.dev/icons?i=react,nextjs,ts,postgres,tailwind,redux,deno,nestjs)](https://skillicons.dev)

#### Frontend
- [Firelens Nextjs](https://github.com/LeonardoSya/firelens-nextjs) Built with **Next.js 14, Mapbox and TypeScript**

#### Backend Options
1. [**Deno**](https://github.com/LeonardoSya/firelens-deno)
2. [**NestJS**](https://github.com/LeonardoSya/firelens-nestjs)

#### Database
- Vercel Postgres
