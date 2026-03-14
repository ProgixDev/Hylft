import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(UsersService.name);
  private tableReady = false;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async onModuleInit() {
    await this.ensureTable();
  }

  private async ensureTable(): Promise<void> {
    if (this.tableReady) return;

    const { error } = await this.supabase.rpc('ensure_user_profiles_table');

    if (error) {
      this.logger.error('Failed to ensure user_profiles table', error.message);
    } else {
      this.tableReady = true;
      this.logger.log('user_profiles table is ready');
    }
  }

  /**
   * Runs an operation, and if the table is missing (dropped while server is running),
   * recreates it and retries once.
   */
  private async run<T>(
    op: () => PromiseLike<{ data: T | null; error: any }>,
  ): Promise<{ data: T | null; error: any }> {
    await this.ensureTable();

    const result = await op();

    if (result.error?.code === '42P01') {
      this.logger.warn('user_profiles table missing — recreating and retrying...');
      this.tableReady = false;
      await this.ensureTable();
      return op();
    }

    return result;
  }

  async getProfile(userId: string) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single(),
    );

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      throw error;
    }
    return data;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('user_profiles')
        .upsert({ id: userId, ...dto })
        .select()
        .single(),
    );

    if (error) {
      if (error.code === '23505') throw new ConflictException('Username already taken');
      throw error;
    }
    return data;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('user_profiles')
        .update(dto)
        .eq('id', userId)
        .select()
        .single(),
    );

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      if (error.code === '23505') throw new ConflictException('Username already taken');
      throw error;
    }
    return data;
  }

  async completeOnboarding(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.run(() =>
      this.supabase
        .from('user_profiles')
        .update({ ...dto, onboarding_completed: true })
        .eq('id', userId)
        .select()
        .single(),
    );

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('Profile not found');
      throw error;
    }
    return data;
  }
}
