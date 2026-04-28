import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/security/password-hash";

const prisma = new PrismaClient();

const seedPassword = process.env.APP_ADMIN_PASSWORD ?? "change-me-now";
const passwordHash = hashPassword(seedPassword);

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: "admin@ias.com.co" },
    update: { name: "Admin", lastName: "IAS", role: UserRole.ADMIN, isActive: true, passwordHash },
    create: {
      email: "admin@ias.com.co",
      name: "Admin",
      lastName: "IAS",
      document: "00000000",
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
    },
  });
  // Note: only admin is seeded by default to avoid enum/value mismatches with existing migrations.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Prisma seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
