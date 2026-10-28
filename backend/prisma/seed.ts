import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tiffinbox.com' },
    update: {},
    create: {
      name: 'TiffinBox Admin',
      email: 'admin@tiffinbox.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '9999999999',
      address: 'Mumbai, Maharashtra',
    },
  });

  // Seed customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      name: 'Test Customer',
      email: 'customer@test.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '8888888888',
      address: 'Malad West, Mumbai',
    },
  });

  // Seed meal plans
  const meals = [
    {
      name: 'Veg Thali',
      description: '2 sabzis, dal, rice, 3 rotis, salad and pickle. Classic home-style Mumbai tiffin.',
      pricePerDay: 80,
    },
    {
      name: 'Non-Veg Thali',
      description: 'Chicken curry or egg curry, dal, rice, 3 rotis and salad. Protein-rich daily meal.',
      pricePerDay: 120,
    },
    {
      name: 'Premium Veg Thali',
      description: '3 sabzis, paneer dish, dal makhani, rice, 4 rotis, dessert and salad.',
      pricePerDay: 130,
    },
    {
      name: 'Diet Tiffin',
      description: 'Low-calorie tiffin — 1 sabzi, dal, brown rice, 2 multigrain rotis and salad.',
      pricePerDay: 90,
    },
  ];

  for (const meal of meals) {
    await prisma.mealPlan.upsert({
      where: { id: meal.name },
      update: {},
      create: meal,
    });
  }

  console.log('✅ Seed complete');
  console.log('Admin  → admin@tiffinbox.com / admin123');
  console.log('Customer → customer@test.com / customer123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
