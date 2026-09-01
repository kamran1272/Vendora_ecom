export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'replace-with-a-long-random-secret',
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/vendora',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379'
}
