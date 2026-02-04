import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const organization = await prisma.organizations.create({
    data: {
      name: "Sammy Chapter",
    },
  });

  await prisma.invite_codes.createMany({
    data: [
      {
        code: "SAMMY-ADMIN-INVITE",
        org_id: organization.id,
        role: "admin",
        max_uses: 10,
        uses: 0,
      },
      {
        code: "SAMMY-MEMBER-INVITE",
        org_id: organization.id,
        role: "member",
        max_uses: 200,
        uses: 0,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
