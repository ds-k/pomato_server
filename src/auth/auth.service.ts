import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import jwksClient = require('jwks-rsa');

@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client;
  private appleJwksClient: jwksClient.JwksClient;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    this.oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    });
  }

  async socialLogin(req) {
    const { provider, token } = req;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    let userPayload;
    switch (provider) {
      case 'google':
        userPayload = await this.verifyGoogleToken(token);
        break;
      case 'apple':
        userPayload = await this.verifyAppleToken(token);
        break;
      default:
        throw new UnauthorizedException('Invalid provider');
    }

    const user = await this.findOrCreateUser(userPayload, provider);

    const accessPayload = {
      sub: user.id,
      role: user.role,
    };

    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      provider: provider,
    };
  }

  // logout을 할때 refresh token을 블랙리스트에 추가
  // 블랙리스트에 추가된 토큰은 더이상 사용할 수 없음
  // 그래서 블랙리스트를 주기적으로 비울수 있는 redis를 활용

  // acessToken 만료가 됐을때, 401 unauthorized 에러 던지기
  // flutter dio 측에서 login 엔드포인트에 요청을 보낸다 (login body에서 검증)
  // 검증 통과하면 새로운 accessToken 발급
  // 새로운 accessToken 발급 후 기존 accessToken 블랙리스트에 추가
  // 기존 accessToken 블랙리스트에 추가된 토큰은 더이상 사용할 수 없음
  // 그래서 블랙리스트를 주기적으로 비울수 있는 redis를 활용
  // 블랙리스트에 추가된 토큰은 더이상 사용할 수 없음
  // 그래서 블랙리스트를 주기적으로 비울수 있는 redis를 활용

  private async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      if (!payload.email || !payload.email_verified) {
        throw new UnauthorizedException('Google email not verified');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || '',
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new UnauthorizedException('Google token verification failed');
    }
  }

  private async verifyAppleToken(token: string) {
    try {
      const decodedToken: any = jwt.decode(token, { complete: true });
      if (!decodedToken) {
        throw new UnauthorizedException('Invalid Apple token format');
      }

      const kid = decodedToken.header.kid;
      const key = await this.appleJwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      const verified: any = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: process.env.APPLE_CLIENT_ID,
      });

      if (!verified.email || !verified.email_verified) {
        throw new UnauthorizedException('Apple email not verified');
      }

      return {
        sub: verified.sub,
        email: verified.email,
        name: verified.name || '',
        picture: verified.picture || '',
      };
    } catch (error) {
      console.error('Apple token verification failed:', error);
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Apple token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid Apple token');
      }
      throw new UnauthorizedException('Apple token verification failed');
    }
  }

  private async findOrCreateUser(userInfo, provider) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        providerId: userInfo.sub,
      },
    });

    if (existingUser) {
      return await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    return await this.prisma.user.create({
      data: {
        email: userInfo.email,
        nickname: this.generateRandomNickname(),
        role: 'client',
        bio: '',
        profileImage: userInfo.picture,
        provider: provider,
        providerId: userInfo.sub,
      },
    });
  }

  private generateRandomNickname(): string {
    const adjectives = [
      '반짝이는',
      '춤추는',
      '잠자는',
      '웃는',
      '날아가는',
      '꿈꾸는',
      '배고픈',
      '행복한',
      '신나는',
      '귀여운',
      '따뜻한',
      '포근한',
      '즐거운',
      '달리는',
      '뛰어가는',
      '노래하는',
      '졸린',
      '활기찬',
      '기분좋은',
      '상큼한',
      '재미있는',
      '똑똑한',
      '부지런한',
      '친절한',
      '씩씩한',
      '용감한',
      '멋있는',
      '예쁜',
      '착한',
      '현명한',
    ];

    const nouns = [
      '판다',
      '고양이',
      '강아지',
      '토끼',
      '다람쥐',
      '햄스터',
      '펭귄',
      '코끼리',
      '기린',
      '곰돌이',
      '여우',
      '사자',
      '호랑이',
      '늑대',
      '알파카',
      '캥거루',
      '코알라',
      '치타',
      '원숭이',
      '돌고래',
      '물개',
      '수달',
      '양',
      '염소',
      '공룡',
      '악어',
      '거북이',
      '팬더',
      '하마',
      '얼룩말',
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    const epochTime = Math.floor(Date.now() / 1000) % 10000;

    return `${randomAdjective}${randomNoun}${epochTime}`;
  }
}
