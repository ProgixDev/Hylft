import {
  Controller,
  Get,
  Post,
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
import { CreateCustomFoodDto } from './dto/create-custom-food.dto';

@Controller('nutrition')
@UseGuards(SupabaseJwtGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  // ── Meals ──────────────────────────────────────────────────────────────

  @Get('meals')
  getMeals(
    @CurrentUser() user: AuthUser,
    @Query('date') date: string,
  ) {
    return this.nutritionService.getMeals(user.id, date);
  }

  @Get('meals/range')
  getMealsRange(
    @CurrentUser() user: AuthUser,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.nutritionService.getMealsRange(user.id, startDate, endDate);
  }

  @Post('meals')
  addMeal(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMealDto,
  ) {
    return this.nutritionService.addMeal(user.id, dto);
  }

  @Delete('meals/:id')
  deleteMeal(
    @CurrentUser() user: AuthUser,
    @Param('id') mealId: string,
  ) {
    return this.nutritionService.deleteMeal(user.id, mealId);
  }

  // ── Summaries ──────────────────────────────────────────────────────────

  @Get('summary/daily')
  getDailySummary(
    @CurrentUser() user: AuthUser,
    @Query('date') date: string,
  ) {
    return this.nutritionService.getDailySummary(user.id, date);
  }

  @Get('summary/weekly')
  getWeeklySummary(
    @CurrentUser() user: AuthUser,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    return this.nutritionService.getWeeklySummary(user.id, startDate, endDate);
  }

  // ── Goals ──────────────────────────────────────────────────────────────

  @Get('goals')
  getGoals(@CurrentUser() user: AuthUser) {
    return this.nutritionService.getGoals(user.id);
  }

  @Patch('goals')
  updateGoals(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateGoalsDto,
  ) {
    return this.nutritionService.updateGoals(user.id, dto);
  }

  // ── Custom Foods ───────────────────────────────────────────────────────

  @Get('custom-foods')
  getCustomFoods(@CurrentUser() user: AuthUser) {
    return this.nutritionService.getCustomFoods(user.id);
  }

  @Post('custom-foods')
  createCustomFood(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCustomFoodDto,
  ) {
    return this.nutritionService.createCustomFood(user.id, dto);
  }

  @Delete('custom-foods/:id')
  deleteCustomFood(
    @CurrentUser() user: AuthUser,
    @Param('id') foodId: string,
  ) {
    return this.nutritionService.deleteCustomFood(user.id, foodId);
  }
}
