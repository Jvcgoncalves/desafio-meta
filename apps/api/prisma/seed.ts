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
  },
  {
    id: "a6f7f5db-e873-4e53-996f-f609e7be95bc",
    name: "Leather Folio Case",
    model: "iPhone 14",
    availableStock: 9,
    reservedStock: 0,
    priceCents: 10990
  },
  {
    id: "58e69983-cf3b-44fb-9eb7-8067a34f8ce7",
    name: "Carbon Fiber Shield",
    model: "iPhone 14",
    availableStock: 7,
    reservedStock: 0,
    priceCents: 11990
  },
  {
    id: "614169d2-f074-4e2d-bf5e-a95a2dbf3fe6",
    name: "Wallet Stand Case",
    model: "Galaxy S24+",
    availableStock: 11,
    reservedStock: 0,
    priceCents: 9490
  },
  {
    id: "f5f61cff-64ea-4483-b560-f0d96f51547d",
    name: "Bumper Shock Case",
    model: "Galaxy A54",
    availableStock: 16,
    reservedStock: 0,
    priceCents: 5990
  },
  {
    id: "8571a616-0f7b-4d93-b89d-a98f1d5c1c95",
    name: "Rugged Defender Case",
    model: "Pixel 8",
    availableStock: 10,
    reservedStock: 0,
    priceCents: 8990
  },
  {
    id: "8ce1f17d-8bfb-4440-aee8-d91f8875c221",
    name: "Eco Biodegradable Case",
    model: "Pixel 8 Pro",
    availableStock: 13,
    reservedStock: 0,
    priceCents: 8490
  },
  {
    id: "e09f5f57-67db-476b-b6eb-d835f2f6eaec",
    name: "Magnetic Wallet Case",
    model: "Motorola Edge 50",
    availableStock: 6,
    reservedStock: 0,
    priceCents: 9790
  },
  {
    id: "2d645f99-51bb-4cce-9749-95f2115fe53b",
    name: "Ultra Bumper Grip",
    model: "Galaxy S24+",
    availableStock: 14,
    reservedStock: 0,
    priceCents: 8790
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
