import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validates the Bearer token by asking Supabase Auth directly. This works for
// any JWT signing algorithm the project uses (HS256, ES256, RS256, …) — we do
// not need to know the public key or secret.
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly supabase: SupabaseClient;

  constructor(config: ConfigService) {
    this.supabase = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined =
      req.headers?.authorization ?? req.headers?.Authorization;
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(7).trim();
    if (!token) throw new UnauthorizedException('Empty bearer token');

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException(error?.message ?? 'Invalid token');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? '',
      role: data.user.role ?? 'authenticated',
    };
    return true;
  }
}
