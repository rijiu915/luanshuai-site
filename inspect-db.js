require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  const history = await prisma.pointsHistory.findMany({ take: 5 });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));
  console.log('--- Points History ---');
  console.log(JSON.stringify(history, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
