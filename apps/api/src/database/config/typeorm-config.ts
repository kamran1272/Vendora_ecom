import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const dbType = process.env.DB_TYPE || 'sqlite';
const entityPattern = path.join(__dirname, '/../entities/**/*.entity{.ts,.js}');
const migrationPattern = path.join(__dirname, '/../migrations/**/*.{ts,js}');

export const AppDataSource = new DataSource(
  dbType === 'sqlite'
    ? {
        type: 'sqlite',
        database: process.env.SQLITE_PATH || path.join(__dirname, '../../../data/dev.sqlite'),
        entities: [entityPattern],
        migrations: [migrationPattern],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
        dropSchema: false,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'vendora',
        entities: [entityPattern],
        migrations: [migrationPattern],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
        dropSchema: false,
      },
);
