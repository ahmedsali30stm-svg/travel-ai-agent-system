import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default providers
  const providers = [
    {
      name: 'hotelbeds',
      type: 'HOTEL',
      isActive: true,
      config: {
        endpoints: {
          search: 'https://api.hotelbeds.com/hotel-api/1.0/hotels',
          booking: 'https://api.hotelbeds.com/hotel-api/1.0/bookings',
        },
      },
    },
    {
      name: 'booking',
      type: 'HOTEL',
      isActive: true,
      config: {
        endpoints: {
          search: 'https://distribution-xml.booking.com/2.0/json/searchHotels',
        },
      },
    },
    {
      name: 'viator',
      type: 'ACTIVITY',
      isActive: true,
      config: {
        endpoints: {
          search: 'https://api.viator.com/partner/search',
        },
      },
    },
    {
      name: 'amadeus',
      type: 'FLIGHT',
      isActive: true,
      config: {
        endpoints: {
          search: 'https://api.amadeus.com/v2/shopping/flight-offers',
        },
      },
    },
  ];

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
    console.log(`✅ Provider ${provider.name} seeded`);
  }

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@travelai.com' },
    update: {},
    create: {
      email: 'demo@travelai.com',
      password: 'hashed_demo123', // In production, hash this properly
      name: 'Demo User',
      role: 'USER',
    },
  });
  console.log(`✅ Demo user seeded: ${demoUser.email}`);

  // Create demo trip
  const demoTrip = await prisma.trip.create({
    data: {
      userId: demoUser.id,
      name: 'Paris Adventure',
      destination: 'Paris, France',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-07'),
      travelers: 2,
      budget: 3000,
      status: 'PLANNED',
      preferences: {
        stars: 4,
        amenities: ['wifi', 'breakfast'],
        mealPlan: 'breakfast',
      },
    },
  });
  console.log(`✅ Demo trip seeded: ${demoTrip.name}`);

  // Add trip items
  const tripItems = [
    {
      tripId: demoTrip.id,
      type: 'HOTEL',
      name: 'Hotel Le Marais',
      details: {
        address: '123 Rue de Rivoli, Paris',
        stars: 4,
        amenities: ['wifi', 'breakfast', 'pool'],
      },
      cost: 150,
      currency: 'EUR',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-07'),
      status: 'CONFIRMED',
      bookingRef: 'BK-123456',
    },
    {
      tripId: demoTrip.id,
      type: 'ACTIVITY',
      name: 'Eiffel Tower Skip-the-Line',
      details: {
        duration: '2 hours',
        includes: ['Skip-the-line access', 'Guide'],
      },
      cost: 45,
      currency: 'EUR',
      startDate: new Date('2024-06-02'),
      status: 'CONFIRMED',
      bookingRef: 'ACT-789012',
    },
  ];

  for (const item of tripItems) {
    await prisma.tripItem.create({ data: item });
  }
  console.log(`✅ Trip items seeded`);

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
