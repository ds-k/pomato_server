import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    // 사용자 조회 또는 생성
    const user = await this.findOrCreateUser(req.user);

    // JWT 토큰 생성
    const payload = {
      email: user.email,
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  private async findOrCreateUser(googleUser) {
    // 기존 사용자 조회
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });

    if (existingUser) {
      // 기존 사용자가 있는 경우 정보 업데이트
      return await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    // 새로운 사용자 생성
    return await this.prisma.user.create({
      data: {
        email: googleUser.email,
        name: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
        profileImage: googleUser.picture,
        provider: 'google',
        lastLogin: new Date(),
      },
    });
  }
}
