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
import { SocialService } from './social.service';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post('follows/:userId')
  follow(
    @CurrentUser() me: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.social.follow(me.id, userId);
  }

  @Delete('follows/:userId')
  unfollow(
    @CurrentUser() me: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.social.unfollow(me.id, userId);
  }

  @Get('follows/:userId/stats')
  stats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.social.stats(userId);
  }

  @Get('follows/:userId/followers')
  followers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.social.listFollowers(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      cursor,
    );
  }

  @Get('follows/:userId/following')
  following(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.social.listFollowing(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      cursor,
    );
  }

  @Get('follows/:userId/is-following')
  isFollowing(
    @CurrentUser() me: AuthUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.social.isFollowing(me.id, userId);
  }

  // ── Follow requests ────────────────────────────────────────────────────

  @Get('follow-requests/incoming')
  incoming(@CurrentUser() me: AuthUser) {
    return this.social.listIncomingRequests(me.id);
  }

  @Post('follow-requests/:requesterId/accept')
  accept(
    @CurrentUser() me: AuthUser,
    @Param('requesterId', ParseUUIDPipe) requesterId: string,
  ) {
    return this.social.respondToRequest(me.id, requesterId, 'accept');
  }

  @Post('follow-requests/:requesterId/reject')
  reject(
    @CurrentUser() me: AuthUser,
    @Param('requesterId', ParseUUIDPipe) requesterId: string,
  ) {
    return this.social.respondToRequest(me.id, requesterId, 'reject');
  }

  @Delete('follow-requests/outgoing/:targetId')
  cancel(
    @CurrentUser() me: AuthUser,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ) {
    return this.social.cancelOutgoingRequest(me.id, targetId);
  }
}
