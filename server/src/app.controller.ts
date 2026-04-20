import { Controller, Get } from '@nestjs/common';

// Unauthenticated liveness endpoints. Mounted at the root of the global `/api`
// prefix so any uptime probe (Render, Vercel, UptimeRobot, etc.) can hit them
// without needing a Supabase JWT.
//
// Note: `/api/health` is owned by HealthModule (workouts + daily snapshots)
// and is authenticated. The public probe lives at `/api/healthz`.
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'hylift-api',
      status: 'ok',
      docs: 'health check: /api/healthz',
    };
  }

  @Get('healthz')
  healthz() {
    return {
      status: 'ok',
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
