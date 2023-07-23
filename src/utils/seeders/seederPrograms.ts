/*
    Poblador de Students para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const COUNT = 20;

const generateFakeData = () => {
    const fakeData = [];

    for (let i = 0; i < COUNT; i++) {
        const fakeItem = {
          description: faker.lorem.words(3),
          maxStudents: Math.floor(Math.random() * 10) + 1,
          inscription: getRandomFloat(1000, 10000),
          monthlyAmount: getRandomFloat(500, 5000)
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
      const result = await prisma.program.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "Program"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  