import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(SupabaseJwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Post('me')
  createProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProfileDto,
  ) {
    return this.usersService.createProfile(user.id, dto);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/onboarding')
  completeOnboarding(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.completeOnboarding(user.id, dto);
  }
}
