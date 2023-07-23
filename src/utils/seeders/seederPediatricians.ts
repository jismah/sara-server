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
            name: faker.name.firstName() + " " + faker.name.lastName(),
            medicalInstitution: faker.lorem.words(2),
            officeNumber: (Math.floor(Math.random() * 500) + 1).toString(),
            phone: faker.phone.number('(###) ###-###'),
        };
        fakeData.push(fakeItem);
    }

    return fakeData;
};

const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeData = generateFakeData();
  
    try {
      const result = await prisma.pediatrician.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "Pediatrician"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  