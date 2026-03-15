import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // 修正這裡：讓它讀取環境變數中的 DATABASE_URL
  datasource: {
    url: process.env.DATABASE_URL,
  },
});