import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

class SignAvatarUploadDto {
  @IsString()
  @IsOptional()
  @IsIn(['jpg', 'jpeg', 'png', 'webp', 'heic'])
  ext?: string;
}

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

  @Post('me/avatar/sign-upload')
  signAvatarUpload(
    @CurrentUser() user: AuthUser,
    @Body() dto: SignAvatarUploadDto,
  ) {
    return this.usersService.signAvatarUpload(user.id, dto.ext);
  }

  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteAvatar(user.id);
  }

  @Get('search')
  search(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.searchUsers(
      user.id,
      q ?? '',
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(':id/stats')
  getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserStats(id);
  }

  @Get(':id')
  getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
