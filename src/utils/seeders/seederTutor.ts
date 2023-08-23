/*
    Poblador de Students para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const COUNT = 40

const generateFakeData = () => {
    const fakeData = [];

    for (let i = 1; i <= 20; i++) {
        const fakeItem = {
            name: faker.name.firstName() + " " + faker.name.lastName(),
            phone: faker.phone.number('(###) ###-###'),
            idStudent: Math.floor(Math.random() * COUNT) + 1,
            occupation: faker.name.jobTitle()
        };
        fakeData.push(fakeItem);
    }

    return fakeData;
};

const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeData = generateFakeData();
  
    try {
      const result = await prisma.tutor.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "Tutor"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  