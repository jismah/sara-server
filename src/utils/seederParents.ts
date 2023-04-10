/*
    Poblador de Padres para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';


const generateFakeData = () => {
    const fakeParents = [];

    for (let i = 0; i < 10; i++) {
        const fakeUser = {
            identityCard: faker.random.numeric(11),
            name: faker.name.firstName(),
            lastName1: faker.name.lastName(),
            lastName2: faker.name.lastName(),
            telephone: faker.phone.number('849-###-###'),
            email: faker.internet.email()
        };
        fakeParents.push(fakeUser);
    }

    return fakeParents;
};


const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeParents = generateFakeData();
  
    try {
      const result = await prisma.parent.createMany({ data: fakeParents });
      console.log(`Se insertaron ${result.count} registros en la tabla "Parent"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  