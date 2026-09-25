import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      service: 'vendora-api',
      status: 'ok',
      health: '/api/health',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'vendora-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

