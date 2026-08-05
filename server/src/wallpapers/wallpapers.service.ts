import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'covers';

type CoverRow = {
  id: number;
  storage_path: string;
  tier: 'free' | 'premium';
  sort_order: number;
};

@Injectable()
export class WallpapersService {
  private supabase: SupabaseClient;
  private supabaseUrl: string;

  constructor(config: ConfigService) {
    this.supabaseUrl = config.get<string>('SUPABASE_URL')!;
    this.supabase = createClient(
      this.supabaseUrl,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async list() {
    const { data, error } = await this.supabase
      .from('covers')
      .select('id, storage_path, tier, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as CoverRow[];
    const items = rows.map((r) => ({
      id: r.id,
      tier: r.tier,
      sort_order: r.sort_order,
      public_url: `${this.supabaseUrl}/storage/v1/object/public/${BUCKET}/${r.storage_path}`,
    }));
    return { items };
  }
}
