import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { WallpapersService } from './wallpapers.service';

@Controller('wallpapers')
@UseGuards(SupabaseJwtGuard)
export class WallpapersController {
  constructor(private readonly wallpapers: WallpapersService) {}

  @Get()
  list() {
    return this.wallpapers.list();
  }
}
