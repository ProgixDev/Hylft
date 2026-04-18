import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SupabaseJwtGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() me: AuthUser,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.notifications.list(
      me.id,
      unread === 'true',
      limit ? parseInt(limit, 10) : 30,
      cursor,
    );
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() me: AuthUser) {
    return this.notifications.unreadCount(me.id);
  }

  @Post(':id/read')
  markRead(
    @CurrentUser() me: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(me.id, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() me: AuthUser) {
    return this.notifications.markAllRead(me.id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() me: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.remove(me.id, id);
  }
}
