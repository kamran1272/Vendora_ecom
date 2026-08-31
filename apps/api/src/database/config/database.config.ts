import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const entityPattern = path.join(__dirname, '/../entities/**/*.entity{.ts,.js}');
const migrationPattern = path.join(__dirname, '/../migrations/**/*.{ts,js}');

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbType = configService.get<string>('DB_TYPE', 'sqlite');

  if (dbType === 'sqlite') {
    return {
      type: 'sqlite',
      database: configService.get<string>('SQLITE_PATH', './data/dev.sqlite'),
      entities: [entityPattern],
      migrations: [migrationPattern],
      synchronize: true,
      logging: configService.get('NODE_ENV') === 'development',
      dropSchema: false,
    };
  }

  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'vendora'),
    entities: [entityPattern],
    migrations: [migrationPattern],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
    dropSchema: false,
  };
};
