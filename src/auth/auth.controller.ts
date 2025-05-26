import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { auth, OAuth2Client } from 'google-auth-library';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- web ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.socialLogin(req);
  }

  // --- mobile ---
  @Post('social-login')
  async socialLogin(@Body() body: { provider: string; token: string }) {
    return this.authService.socialLogin(body);
  }
}
