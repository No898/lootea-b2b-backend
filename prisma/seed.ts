import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Začínám seed databáze...');

  // Čistím existující data (v development)
  if (process.env.NODE_ENV === 'development') {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customPrice.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }

  // Admin uživatel
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lootea.cz',
      password: adminPassword,
      role: UserRole.ADMIN,
      companyName: 'We Are Lootea s.r.o.',
      ico: '12345678',
      phone: '+420 123 456 789',
      street: 'Testovací 123',
      city: 'Praha',
      zipCode: '11000',
      country: 'Czech Republic',
    },
  });

  // Testovací B2B zákazník
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.create({
    data: {
      email: 'zakaznik@firma.cz',
      password: customerPassword,
      role: UserRole.B2B_CUSTOMER,
      companyName: 'Testovací firma s.r.o.',
      ico: '87654321',
      dic: 'CZ87654321',
      phone: '+420 987 654 321',
      street: 'Obchodní 456',
      city: 'Brno',
      zipCode: '60200',
      country: 'Czech Republic',
    },
  });

  // Kategorie
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Čaje',
        slug: 'caje',
        description: 'Kvalitní čaje z celého světa',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Káva',
        slug: 'kava',
        description: 'Pražená káva premium kvality',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Doplňky',
        slug: 'doplnky',
        description: 'Doplňky pro přípravu nápojů',
        sortOrder: 3,
      },
    }),
  ]);

  // Produkty
  const products = await Promise.all([
    // Čaje
    prisma.product.create({
      data: {
        name: 'Earl Grey Supreme',
        slug: 'earl-grey-supreme',
        description: 'Klasický Earl Grey s bergamotem a kornflowery',
        basePrice: 450.0,
        unit: 'KG',
        categoryId: categories[0].id,
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Green Tea Sencha',
        slug: 'green-tea-sencha',
        description: 'Japonský zelený čaj Sencha',
        basePrice: 520.0,
        unit: 'KG',
        categoryId: categories[0].id,
        sortOrder: 2,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Čajové filtry',
        slug: 'cajove-filtry',
        description: 'Papírové filtry pro sypaný čaj',
        basePrice: 89.0,
        unit: 'BAL',
        packageSize: 100,
        categoryId: categories[0].id,
        sortOrder: 10,
      },
    }),

    // Káva
    prisma.product.create({
      data: {
        name: 'Arabica Brazil Santos',
        slug: 'arabica-brazil-santos',
        description: 'Středně pražená arabica z Brazílie',
        basePrice: 380.0,
        unit: 'KG',
        categoryId: categories[1].id,
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Espresso Blend',
        slug: 'espresso-blend',
        description: 'Směs pro perfektní espresso',
        basePrice: 420.0,
        unit: 'KG',
        categoryId: categories[1].id,
        sortOrder: 2,
      },
    }),

    // Doplňky
    prisma.product.create({
      data: {
        name: 'Kávovar French Press 1L',
        slug: 'kavovar-french-press-1l',
        description: 'Skleněný French Press kávovar',
        basePrice: 650.0,
        unit: 'KS',
        categoryId: categories[2].id,
        sortOrder: 1,
      },
    }),
  ]);

  // Custom price pro zákazníka (speciální cena)
  await prisma.customPrice.create({
    data: {
      userId: customer.id,
      productId: products[0].id, // Earl Grey
      price: 400.0, // Sleva z 450 na 400
    },
  });

  await prisma.customPrice.create({
    data: {
      userId: customer.id,
      productId: products[3].id, // Arabica Brazil
      price: 350.0, // Sleva z 380 na 350
    },
  });

  console.log('✅ Seed databáze dokončen!');
  console.log('');
  console.log('🔑 Testovací účty:');
  console.log('Admin: admin@lootea.cz / admin123');
  console.log('Zákazník: zakaznik@firma.cz / customer123');
  console.log('');
  console.log('📊 Vytvořeno:');
  console.log(`- ${categories.length} kategorií`);
  console.log(`- ${products.length} produktů`);
  console.log(`- 2 custom prices pro zákazníka`);
  console.log('- 2 uživatelé (admin + zákazník)');
}

main()
  .catch(e => {
    console.error('❌ Chyba při seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
