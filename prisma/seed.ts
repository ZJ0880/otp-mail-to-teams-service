import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/security/password-hash";

const prisma = new PrismaClient();

const nodeProcess = globalThis as unknown as {
  process?: {
    env: Record<string, string | undefined>;
    exit(code: number): never;
  };
};

const seedPassword = nodeProcess.process?.env.APP_ADMIN_PASSWORD;
if (!seedPassword) {
  throw new Error("APP_ADMIN_PASSWORD is required to seed the admin user");
}

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
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Prisma seed failed:", error);
    await prisma.$disconnect();
    nodeProcess.process?.exit(1);
  });
