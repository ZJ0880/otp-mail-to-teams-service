import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/security/password-hash";

const prisma = new PrismaClient();

const seedPassword = process.env.APP_ADMIN_PASSWORD ?? "change-me-now";
const passwordHash = hashPassword(seedPassword);

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: "admin@otp.local" },
    update: { name: "Admin OTP", role: UserRole.ADMIN, isActive: true, passwordHash },
    create: {
      email: "admin@otp.local",
      name: "Admin OTP",
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "operator@otp.local" },
    update: { name: "Operator OTP", role: UserRole.OPERATOR, isActive: true, passwordHash },
    create: {
      email: "operator@otp.local",
      name: "Operator OTP",
      role: UserRole.OPERATOR,
      isActive: true,
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "viewer@otp.local" },
    update: { name: "Viewer OTP", role: UserRole.VIEWER, isActive: true, passwordHash },
    create: {
      email: "viewer@otp.local",
      name: "Viewer OTP",
      role: UserRole.VIEWER,
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
    process.exit(1);
  });
