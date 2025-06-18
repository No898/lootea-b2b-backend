import { PrismaClient, UserRole, Unit } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@lootea.cz' },
        update: {},
        create: {
            email: 'admin@lootea.cz',
            password: hashedPassword,
            role: UserRole.ADMIN,
            companyName: 'We Are Lootea s.r.o.',
            isActive: true,
        },
    });
    const b2bPassword = await bcrypt.hash('test123', 10);
    const b2bCustomer = await prisma.user.upsert({
        where: { email: 'test@firma.cz' },
        update: {},
        create: {
            email: 'test@firma.cz',
            password: b2bPassword,
            role: UserRole.B2B_CUSTOMER,
            companyName: 'Test Firma s.r.o.',
            ico: '12345678',
            dic: 'CZ12345678',
            phone: '+420123456789',
            street: 'Testovací 123',
            city: 'Praha',
            zipCode: '11000',
            country: 'Czech Republic',
            isActive: true,
        },
    });
    const categories = [
        {
            name: 'Sirupy',
            slug: 'sirupy',
            description: 'Ovocné a příchutové sirupy pro bubble tea',
        },
        {
            name: 'Toppings',
            slug: 'toppings',
            description: 'Tapiokové perly, želé kostky a další toppings',
        },
        {
            name: 'Prášky & Směsi',
            slug: 'prasky-smesi',
            description: 'Prášky na přípravu nápojů a směsi',
        },
        {
            name: 'Vybavení',
            slug: 'vybaveni',
            description: 'Shaker, brčka, kelímky a další vybavení',
        },
        { name: 'Čaje', slug: 'caje', description: 'Černé, zelené a bylinné čaje' },
    ];
    const createdCategories = [];
    for (const category of categories) {
        const created = await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        });
        createdCategories.push(created);
    }
    const products = [
        {
            name: 'Mango sirup',
            slug: 'mango-sirup',
            description: 'Intenzivní mango sirup pro bubble tea',
            basePrice: 89.9,
            unit: Unit.KS,
            categoryId: createdCategories[0].id,
            inStock: true,
        },
        {
            name: 'Jahoda sirup',
            slug: 'jahoda-sirup',
            description: 'Sladký jahodový sirup',
            basePrice: 85.9,
            unit: Unit.KS,
            categoryId: createdCategories[0].id,
            inStock: true,
        },
        {
            name: 'Tapiokové perly černé',
            slug: 'tapiokove-perly-cerne',
            description: 'Klasické černé tapiokové perly',
            basePrice: 45.9,
            unit: Unit.KG,
            packageSize: 6,
            categoryId: createdCategories[1].id,
            inStock: true,
        },
        {
            name: 'Bubble tea kelímky 500ml',
            slug: 'kelimky-500ml',
            description: 'Průhledné kelímky s víčkem',
            basePrice: 2.5,
            unit: Unit.BAL,
            packageSize: 50,
            categoryId: createdCategories[3].id,
            inStock: true,
        },
    ];
    const createdProducts = [];
    for (const product of products) {
        const created = await prisma.product.upsert({
            where: { slug: product.slug },
            update: {},
            create: product,
        });
        createdProducts.push(created);
    }
    await prisma.customPrice.upsert({
        where: {
            userId_productId: {
                userId: b2bCustomer.id,
                productId: createdProducts[0].id,
            },
        },
        update: {},
        create: {
            userId: b2bCustomer.id,
            productId: createdProducts[0].id,
            price: 79.9,
        },
    });
    console.log('✅ Database seeded successfully!');
    console.log(`👤 Admin: ${admin.email}`);
    console.log(`🏢 B2B Customer: ${b2bCustomer.email}`);
    console.log(`📦 Categories: ${createdCategories.length}`);
    console.log(`🛍️  Products: ${createdProducts.length}`);
}
main()
    .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map