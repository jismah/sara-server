/*
    Poblador de Padres para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';


const generateFakeData = () => {
    const fakeAuthKeys = [];

    for (let i = 0; i < 10; i++) {
        const AuthKey = {
          key: faker.datatype.uuid(),
          owner: faker.internet.userName(),
        };
        fakeAuthKeys.push(AuthKey);
    }

    return fakeAuthKeys;
};


const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeAuthKeys = generateFakeData();
  
    try {
      const result = await prisma.authKey.createMany({ data: fakeAuthKeys });
      console.log(`Se insertaron ${result.count} registros en la tabla "AuthKey"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  