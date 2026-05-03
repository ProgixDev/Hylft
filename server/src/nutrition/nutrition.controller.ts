import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/guards/supabase-jwt.guard';
import {
  CurrentUser,
  AuthUser,
} from '../auth/decorators/current-user.decorator';
import { NutritionService } from './nutrition.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpsertDailyDto } from './dto/upsert-daily.dto';
import { SearchFoodQueryDto } from './dto/search-food-query.dto';
import { RecordFoodHistoryDto } from './dto/record-food-history.dto';

@Controller('nutrition')
@UseGuards(SupabaseJwtGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // ── Food search proxy (FatSecret) ──────────────────────────────────────

  @Get('search')
  searchFood(@Query() query: SearchFoodQueryDto) {
    return this.nutritionService.searchFood(
      query.q,
      query.lang ?? 'fr',
      query.page ?? 0,
      query.pageSize ?? 20,
    );
  }

  // ── Food selection history ─────────────────────────────────────────────

  @Get('food-history')
  getFoodHistory(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number(limit) : 20;
    return this.nutritionService.getFoodHistory(user.id, parsed);
  }

  @Post('food-history')
  recordFoodSelection(
    @CurrentUser() user: AuthUser,
    @Body() dto: RecordFoodHistoryDto,
  ) {
    return this.nutritionService.recordFoodSelection(user.id, dto);
  }

  // ── Meals ──────────────────────────────────────────────────────────────

  @Get('meals')
  getMeals(@CurrentUser() user: AuthUser, @Query('date') date: string) {
    return this.nutritionService.getMeals(user.id, date);
  }

  @Post('meals')
  addMeal(@CurrentUser() user: AuthUser, @Body() dto: CreateMealDto) {
    return this.nutritionService.addMeal(user.id, dto);
  }

  @Delete('meals/:id')
  deleteMeal(@CurrentUser() user: AuthUser, @Param('id') mealId: string) {
    return this.nutritionService.deleteMeal(user.id, mealId);
  }

  // ── Daily (water / weight / notes) ─────────────────────────────────────

  @Get('daily')
  getDaily(@CurrentUser() user: AuthUser, @Query('date') date: string) {
    return this.nutritionService.getDaily(user.id, date);
  }

  @Put('daily')
  upsertDaily(@CurrentUser() user: AuthUser, @Body() dto: UpsertDailyDto) {
    return this.nutritionService.upsertDaily(user.id, dto);
  }

  // ── Summary & History ──────────────────────────────────────────────────

  @Get('summary')
  getDailySummary(
    @CurrentUser() user: AuthUser,
    @Query('date') date: string,
  ) {
    return this.nutritionService.getDailySummary(user.id, date);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: AuthUser,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.nutritionService.getHistory(user.id, startDate, endDate);
  }

  // ── Goals ──────────────────────────────────────────────────────────────

  @Get('goals')
  getGoals(@CurrentUser() user: AuthUser) {
    return this.nutritionService.getGoals(user.id);
  }

  @Patch('goals')
  updateGoals(@CurrentUser() user: AuthUser, @Body() dto: UpdateGoalsDto) {
    return this.nutritionService.updateGoals(user.id, dto);
  }
}
