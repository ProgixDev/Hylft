import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { SignMediaUploadDto } from './dto/media-upload.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  // ── Posts ──────────────────────────────────────────────────────────────

  @Get('posts')
  list(@CurrentUser() user: AuthUser, @Query() q: ListPostsQueryDto) {
    return this.feed.listPosts(user.id, q);
  }

  @Post('posts')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.feed.createPost(user.id, dto);
  }

  @Get('posts/:id')
  getOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.feed.getPost(user.id, id);
  }

  @Patch('posts/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.feed.updatePost(user.id, id, dto);
  }

  @Delete('posts/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.feed.deletePost(user.id, id);
  }

  // ── Post likes ─────────────────────────────────────────────────────────

  @Post('posts/:id/like')
  like(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.feed.likePost(user.id, id);
  }

  @Delete('posts/:id/like')
  unlike(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.feed.unlikePost(user.id, id);
  }

  // ── Media upload URL signer ────────────────────────────────────────────

  @Post('posts/media/sign-upload')
  signUpload(@CurrentUser() user: AuthUser, @Body() dto: SignMediaUploadDto) {
    return this.feed.signMediaUploads(user.id, dto);
  }

  // ── Comments ───────────────────────────────────────────────────────────

  @Get('posts/:id/comments')
  listComments(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feed.listComments(user.id, id);
  }

  @Post('posts/:id/comments')
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.feed.createComment(user.id, id, dto);
  }

  @Patch('comments/:id')
  updateComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.feed.updateComment(user.id, id, dto);
  }

  @Delete('comments/:id')
  deleteComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feed.deleteComment(user.id, id);
  }

  // ── Comment likes ──────────────────────────────────────────────────────

  @Post('comments/:id/like')
  likeComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feed.likeComment(user.id, id);
  }

  @Delete('comments/:id/like')
  unlikeComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.feed.unlikeComment(user.id, id);
  }
}
