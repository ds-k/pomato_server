import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { OAuth2Client } from 'google-auth-library';

@Controller('auth')
export class AuthController {
  private oauth2Client: OAuth2Client;

  constructor(private readonly authService: AuthService) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  // --- web ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req);
  }

  // --- mobile ---
  @Post('google')
  // 다른 provider를 여기서 body로 갈라서
  async googleLogin(@Headers('authorization') auth: string) {
    try {
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const idToken = auth.split(' ')[1];

      // Google ID 토큰 검증
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }

      // 사용자 정보 구성
      const userInfo = {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
      };

      // 사용자 처리 및 JWT 발급
      return this.authService.googleLogin({ user: userInfo });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
