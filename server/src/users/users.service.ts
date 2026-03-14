import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Profile not found');
      }
      throw error;
    }
    return data;
  }

  async createProfile(userId: string, dto: CreateProfileDto) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .upsert({ id: userId, ...dto })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username already taken');
      }
      throw error;
    }
    return data;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(dto)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Profile not found');
      }
      if (error.code === '23505') {
        throw new ConflictException('Username already taken');
      }
      throw error;
    }
    return data;
  }

  async completeOnboarding(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update({ ...dto, onboarding_completed: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Profile not found');
      }
      throw error;
    }
    return data;
  }
}
