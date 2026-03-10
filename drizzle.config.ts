import { config } from '@/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: './drizzle',
    schema: './db/models',
    dialect: 'postgresql',
    verbose: true,
    strict: false,
    casing: "snake_case",
    // schemaFilter: ['public'],
    dbCredentials: {
        url: config.DATABASE_URL!,
        ssl: config.NODE_ENV === "production",
    },
});
