import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      nickname: '개발자숭이',
      role: 'developer',
      bio: '안녕하세요! 테스트 개발자입니다.',
      profileImage: 'https://via.placeholder.com/150',
      provider: 'google',
      providerId: 'google_sub',
    },
  });
  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      nickname: '고객숭이',
      role: 'client',
      bio: '안녕하세요! 테스트 고객입니다.',
      profileImage: 'https://via.placeholder.com/150',
      provider: 'apple',
      providerId: 'apple_sub',
    },
  });

  console.log('시드 데이터 생성 완료:', user1, user2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
