import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Nový interface pro variantu produktu
interface ProductVariantSeedData {
  name: string;
  slug: string;
  sku: string;
  price: number;
  brand?: string;
  flavor?: string;
  weightKg?: number;
  volumeL?: number;
  stockQuantity?: number;
  isDefault?: boolean;
  images: { url: string; altText: string }[];
}

// Upravený interface pro produkt (obal)
interface ProductSeedData {
  name: string; // Název skupiny, např. "Popping Balls"
  slug: string;
  description: string;
  variants: ProductVariantSeedData[];
}

const getCategoryData = () => [
  {
    name: 'Popping Balls',
    slug: 'popping-balls',
    description: 'Praskající kuličky plné ovocné šťávy.',
  },
  {
    name: 'Sirupy',
    slug: 'sirupy',
    description: 'Gurmánské sirupy pro ochucení nápojů.',
  },
  { name: 'Jelly', slug: 'jelly', description: 'Ovocné želé do nápojů.' },
  {
    name: 'Prášky',
    slug: 'prasky',
    description: 'Práškové směsi pro přípravu nápojů.',
  },
  { name: 'Čaje', slug: 'caje', description: 'Kvalitní sypané čaje.' },
  {
    name: 'Příslušenství',
    slug: 'prislusenstvi',
    description: 'Vše pro přípravu a podávání bubble tea.',
  },
  {
    name: 'Ostatní',
    slug: 'ostatni',
    description: 'Další suroviny pro bubble tea.',
  },
];

const getProductData = (): Record<string, ProductSeedData[]> => {
  const poppingBallFlavors = [
    'Blueberry',
    'Cherry',
    'Chocolate',
    'Grape',
    'Green Apple',
    'Honeydew Melon',
    'Kiwi',
    'Lemon',
    'Lychee',
    'Mango',
    'Passion Fruit',
    'Peach',
    'Pineapple',
    'Pomegranade',
    'Raspberry',
    'Strawberry',
  ];
  const sirupFlavors = [
    'Blueberry',
    'Cherry',
    'Grape',
    'Green Apple',
    'Guava',
    'Hibiscus',
    'Honeydew',
    'Kiwi',
    'Kumquat',
    'Lemon',
    'Lychee',
    'Mango',
    'Passion Fruit',
    'Peach',
    'Pineapple',
    'Pomegranate',
    'Raspberry',
    'Rose',
    'Strawberry',
    'Watermelon',
    'White Peach',
  ];
  const powderFlavors = [
    'Blueberry',
    'Chocolate',
    'Coconut',
    'Honeydew',
    'Levande',
    'Lychee',
    'Matcha',
    'Red Bean',
    'Strawberry',
    'Taro',
    'Vanilla',
    'Watermelon',
    'Yoghurt',
  ];
  const jellyFlavors = [
    'Lychee',
    'Mango',
    'Passion Fruit',
    'Pineapple _ Mix',
    'Rainbow',
    'Strawberry',
  ];

  return {
    'Popping Balls': [
      {
        name: 'Popping Balls',
        slug: 'popping-balls',
        description: 'Praskající kuličky plné ovocné šťávy.',
        variants: poppingBallFlavors.map((flavor, index) => ({
          name: `${flavor} Popping Balls 3.2kg`,
          slug: faker.helpers
            .slugify(`${flavor} Popping Balls 3.2kg`)
            .toLowerCase(),
          sku: `PB-${flavor.toUpperCase().substring(0, 4)}-3200`,
          price: 450,
          brand: 'Waitansky',
          flavor: flavor,
          weightKg: 3.2,
          stockQuantity: faker.number.int({ min: 50, max: 200 }),
          isDefault: index === 0,
          images: [
            {
              url: `/images/produkty/Popping Ball/${flavor} Popping Balls 3.2kg.jpeg`,
              altText: `${flavor} Popping Balls 3.2kg`,
            },
          ],
        })),
      },
    ],
    Sirupy: [
      {
        name: 'Ovocné Sirupy',
        slug: 'ovocne-sirupy',
        description: 'Ovocné sirupy pro ochucení nápojů.',
        variants: sirupFlavors.map((flavor, index) => ({
          name: `${flavor} Sirup 2.5kg`,
          slug: faker.helpers.slugify(`${flavor} Sirup 2.5kg`).toLowerCase(),
          sku: `SY-FRUIT-${flavor.toUpperCase().substring(0, 4)}-2500`,
          price: 380,
          brand: 'Waitansky',
          flavor: flavor,
          weightKg: 2.5,
          stockQuantity: faker.number.int({ min: 30, max: 150 }),
          isDefault: index === 0,
          images: [
            {
              url: `/images/produkty/Sirup/${flavor} Sirup 2.5kg.jpeg`,
              altText: `${flavor} Sirup 2.5kg`,
            },
          ],
        })),
      },
      {
        name: 'Speciální Sirupy',
        slug: 'specialni-sirupy',
        description: 'Speciální sirupy pro autentickou chuť.',
        variants: [
          {
            name: 'Brown Sugar Sirup 2.5kg',
            slug: 'brown-sugar-sirup-2-5kg',
            sku: 'SY-BROWN-2500',
            price: 350,
            brand: 'Waitansky',
            flavor: 'Brown Sugar',
            weightKg: 2.5,
            stockQuantity: faker.number.int({ min: 30, max: 150 }),
            isDefault: true,
            images: [
              {
                url: '/images/produkty/Brown Sugar Sirup 2.5kg.jpeg',
                altText: 'Brown Sugar Sirup 2.5kg',
              },
            ],
          },
          {
            name: 'Fructose Sirup 2.5kg',
            slug: 'fructose-sirup-2-5kg',
            sku: 'SY-FRUCTOSE-2500',
            price: 290,
            brand: 'Waitansky',
            flavor: 'Fructose',
            weightKg: 2.5,
            stockQuantity: faker.number.int({ min: 30, max: 150 }),
            isDefault: false,
            images: [
              {
                url: '/images/produkty/Fructose Sirup 2.5kg.jpeg',
                altText: 'Fructose Sirup 2.5kg',
              },
            ],
          },
          {
            name: 'Honey Sirup 3kg',
            slug: 'honey-sirup-3kg',
            sku: 'SY-HONEY-3000',
            price: 420,
            brand: 'Waitansky',
            flavor: 'Honey',
            weightKg: 3.0,
            stockQuantity: faker.number.int({ min: 20, max: 100 }),
            isDefault: false,
            images: [
              {
                url: '/images/produkty/Sirup/Honey Sirup 3kg.jpeg',
                altText: 'Honey Sirup 3kg',
              },
            ],
          },
        ],
      },
    ],
    Jelly: [
      {
        name: 'Ovocné Jelly',
        slug: 'ovocne-jelly',
        description: 'Křupavé želé s různými příchutěmi.',
        variants: jellyFlavors.map((flavor, index) => ({
          name: `${flavor.replace('_', '/')} Jelly 4kg`,
          slug: faker.helpers.slugify(`${flavor} Jelly 4kg`).toLowerCase(),
          sku: `JE-${flavor.toUpperCase().substring(0, 4)}-4000`,
          price: 480,
          brand: 'Waitansky',
          flavor: flavor.replace('_', '/'),
          weightKg: 4.0,
          stockQuantity: faker.number.int({ min: 40, max: 120 }),
          isDefault: index === 0,
          images: [
            {
              url: `/images/produkty/Jelly/${flavor.replace('/', '_')} Jelly 4kg.jpeg`,
              altText: `${flavor} Jelly 4kg`,
            },
          ],
        })),
      },
    ],
    Prášky: [
      {
        name: 'Bubble Tea Prášky',
        slug: 'bubble-tea-prasky',
        description: 'Práškové směsi pro přípravu nápojů.',
        variants: powderFlavors.map((flavor, index) => ({
          name: `${flavor} Powder 1kg`,
          slug: faker.helpers.slugify(`${flavor} Powder 1kg`).toLowerCase(),
          sku: `PW-${flavor.toUpperCase().substring(0, 4)}-1000`,
          price: 320,
          brand: 'Waitansky',
          flavor: flavor,
          weightKg: 1.0,
          stockQuantity: faker.number.int({ min: 50, max: 250 }),
          isDefault: index === 0,
          images: [
            {
              url: `/images/produkty/Powder/${flavor} Powder 1kg.jpeg`,
              altText: `${flavor} Powder 1kg`,
            },
          ],
        })),
      },
    ],
    Čaje: [
      {
        name: 'Sypané Čaje',
        slug: 'sypane-caje',
        description: 'Základní surovina pro kvalitní bubble tea.',
        variants: [
          {
            name: 'Earl Grey Tea 600g',
            slug: 'earl-grey-tea-600g',
            sku: 'TEA-EARLG-600',
            price: 350,
            brand: 'Lootea',
            flavor: 'Earl Grey',
            weightKg: 0.6,
            stockQuantity: faker.number.int({ min: 20, max: 80 }),
            isDefault: true,
            images: [
              {
                url: '/images/produkty/Earl Grey Tea 600g.jpeg',
                altText: 'Earl Grey Tea 600g',
              },
            ],
          },
          {
            name: 'Jasmine Green Tea 600g',
            slug: 'jasmine-green-tea-600g',
            sku: 'TEA-JASGR-600',
            price: 350,
            brand: 'Lootea',
            flavor: 'Jasmine Green',
            weightKg: 0.6,
            stockQuantity: faker.number.int({ min: 20, max: 80 }),
            isDefault: false,
            images: [
              {
                url: '/images/produkty/Jasmine Green Tea 600g.jpeg',
                altText: 'Jasmine Green Tea 600g',
              },
            ],
          },
        ],
      },
    ],
    Ostatní: [
      {
        name: 'Tapioka a Toppingy',
        slug: 'tapioka-a-toppingy',
        description: 'Další suroviny pro bubble tea.',
        variants: [
          {
            name: 'Brown Sugar Tapioca 3kg',
            slug: 'brown-sugar-tapioca-3kg',
            sku: 'TP-BSUGAR-3000',
            price: 380,
            flavor: 'Brown Sugar',
            weightKg: 3.0,
            stockQuantity: faker.number.int({ min: 30, max: 100 }),
            isDefault: true,
            images: [
              {
                url: '/images/produkty/Brown Sugar Tapioca 3kg.jpeg',
                altText: 'Brown Sugar Tapioca 3kg',
              },
            ],
          },
          {
            name: 'Aloe Vera 3.1kg',
            slug: 'aloe-vera-3-1kg',
            sku: 'TOP-ALOE-3100',
            price: 420,
            flavor: 'Aloe Vera',
            weightKg: 3.1,
            stockQuantity: faker.number.int({ min: 30, max: 100 }),
            isDefault: false,
            images: [
              {
                url: '/images/produkty/Aloe vera 3.1kg.jpeg',
                altText: 'Aloe vera 3.1kg',
              },
            ],
          },
        ],
      },
    ],
    // TODO: Přidat příslušenství
  };
};

async function seedProducts() {
  console.log('Seeding products...');
  const productData = getProductData();
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  for (const categoryName in productData) {
    const categoryId = categoryMap.get(categoryName);
    if (!categoryId) {
      console.warn(`Category ${categoryName} not found, skipping.`);
      continue;
    }

    const productsToSeed = productData[categoryName];

    for (const productInfo of productsToSeed) {
      const product = await prisma.product.create({
        data: {
          name: productInfo.name,
          slug: productInfo.slug,
          description: productInfo.description,
          category: {
            connect: { id: categoryId },
          },
        },
      });

      console.log(`Created product: ${product.name}`);

      for (const variantInfo of productInfo.variants) {
        await prisma.productVariant.create({
          data: {
            name: variantInfo.name,
            slug: variantInfo.slug,
            sku: variantInfo.sku,
            price: variantInfo.price,
            brand: variantInfo.brand,
            flavor: variantInfo.flavor,
            weightKg: variantInfo.weightKg,
            volumeL: variantInfo.volumeL,
            stockQuantity: variantInfo.stockQuantity,
            isDefault: variantInfo.isDefault,
            product: {
              connect: { id: product.id },
            },
            images: {
              create: variantInfo.images,
            },
          },
        });
        console.log(`  - Created variant: ${variantInfo.name}`);
      }
    }
  }
}

async function main() {
  console.log('Start seeding...');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customPrice.deleteMany();
  await prisma.image.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Old data deleted.');

  // Seed categories
  console.log('Seeding categories...');
  const categories = getCategoryData();
  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });
  console.log('Categories seeded.');

  // Seed products
  await seedProducts();

  // Seed users
  console.log('Seeding users...');
  await prisma.user.create({
    data: {
      email: 'admin@lootea.cz',
      password: '$2b$10$5.gS30v5s/29g0gna3ZkC.gC4Y3yEtJv4C.gLgUbe2ISfM5qY8l6K', // heslo: admin123
      role: 'ADMIN',
      companyName: 'Lootea s.r.o.',
      ico: '12345678',
      dic: 'CZ12345678',
      phone: '+420 123 456 789',
      street: 'Hlavní 1',
      city: 'Praha',
      zipCode: '11000',
    },
  });

  const b2bUser = await prisma.user.create({
    data: {
      email: 'b2b@lootea.cz',
      password: '$2b$10$xP4Nq.7M.sS3h/b8r6D4kOFRwL8E6D2Vb4A.hT7v8oGj3L.o8a5zG', // heslo: b2b123
      role: 'B2B_CUSTOMER',
      companyName: 'Bubble Tea Shop',
      ico: '87654321',
      phone: '+420 987 654 321',
      street: 'Vedlejší 2',
      city: 'Brno',
      zipCode: '60200',
    },
  });
  console.log('Users seeded.');

  // Seed custom prices
  console.log('Seeding custom prices...');
  const firstVariant = await prisma.productVariant.findFirst();
  if (firstVariant) {
    await prisma.customPrice.create({
      data: {
        userId: b2bUser.id,
        productVariantId: firstVariant.id,
        price: 350, // Special price for this user
      },
    });
    console.log(
      `Custom price for ${firstVariant.name} set for ${b2bUser.email}.`
    );
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
