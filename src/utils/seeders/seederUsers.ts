/*
    Poblador de Students para inyectar data a la BD
*/

import { PrismaClient, UserRole } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/en';
import validator from '../validatorUtils';
import encryptor from '../keys/encryptionUtils';

const N_FAMILY = 10;

const generateFakeData = () => {
    const fakeData = [];

    for (let i = 1; i <= N_FAMILY; i++) {
        const lastName1 = faker.name.lastName();
        const lastName2 = faker.name.lastName();
        let username = lastName1 + '&' + lastName2 + '001';

        let count = 1;
        while (!validator.isUnique("user", "username", username)) {
          username = lastName1.slice(0, 3) + '&' + lastName2.slice(0, 3) + count.toString().padStart(3, '0');
        }

        const fakeItem = {
          username: username,
          name: lastName1 + " " + lastName2,
          lastName1: lastName1,
          lastName2: lastName2 || undefined,
          password: encryptor.encrypt(faker.internet.password()),
          email: (faker.internet.email(lastName1, lastName2)).toLowerCase(),
          phone: faker.phone.number('(###) ###-###'),
          role: UserRole["USER"],
          idFamily: i,
        };
        fakeData.push(fakeItem);
    }

    return fakeData;
};

const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeData = generateFakeData();
  
    try {
      const result = await prisma.user.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "User"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  // console.log(generateFakeData())
  