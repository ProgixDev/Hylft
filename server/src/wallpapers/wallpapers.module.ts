import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WallpapersController } from './wallpapers.controller';
import { WallpapersService } from './wallpapers.service';

@Module({
  imports: [AuthModule],
  controllers: [WallpapersController],
  providers: [WallpapersService],
  exports: [WallpapersService],
})
export class WallpapersModule {}
