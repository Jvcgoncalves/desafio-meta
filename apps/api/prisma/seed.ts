import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    id: "0d55fcf5-74e9-45df-8f3b-94d2a9eb6bc8",
    name: "Clear Armor Case",
    model: "iPhone 15",
    availableStock: 12,
    reservedStock: 0,
    priceCents: 7990
  },
  {
    id: "82dc1e1e-f1c3-4efe-8385-1bc9cf16a907",
    name: "Matte Grip Case",
    model: "Galaxy S24",
    availableStock: 8,
    reservedStock: 0,
    priceCents: 6990
  },
  {
    id: "9911a67c-379c-4219-9bd8-3f684c901517",
    name: "MagSafe Slim Case",
    model: "iPhone 15 Pro",
    availableStock: 5,
    reservedStock: 0,
    priceCents: 9990
  }
];

async function main() {
  const passwordHash = await hash("demo123", 10);

  await prisma.user.upsert({
    where: { email: "demo@casecellshop.local" },
    update: { passwordHash },
    create: {
      email: "demo@casecellshop.local",
      passwordHash
    }
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product
    });
  }
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
