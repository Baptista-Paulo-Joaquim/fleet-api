import { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin@2025", 10);

  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@informamz.gov.mz",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin created:", admin);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
