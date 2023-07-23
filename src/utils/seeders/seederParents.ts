/*
    Poblador de Students para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const N_FAMILY = 10;
const COUNT = 20;

const min = 10000000000; // Minimum 11-digit number (10 zeros)
const max = 99999999999; // Maximum 11-digit number (all nines)

const generateFakeData = () => {
    const fakeData = [];

    for (let i = 0; i < COUNT; i++) {
        const fakeItem = {
          identityCard: (Math.floor(Math.random() * (max - min + 1)) + min).toString(),
          name: faker.name.firstName(),
          lastName1: faker.name.lastName(),
          lastName2: faker.name.lastName(),
          idFamily: Math.floor(Math.random() * N_FAMILY) + 1,
          telephone: faker.phone.number('(###) ###-###'),
          email: faker.internet.email(),
          occupation: faker.name.jobTitle(),
        };
        fakeData.push(fakeItem);
    }

    return fakeData;
};

function getRandomFloat(min: number, max: number) {
  const randomFloat = Math.random() * (max - min) + min;
  return parseFloat(randomFloat.toFixed(2));
}

const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeData = generateFakeData();
  
    try {
      const result = await prisma.parent.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "Parent"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  