/*
    Poblador de Students para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import moment from 'moment';
import encryptor from '../keys/encryptionUtils';

const N_CITY = 5;
const COUNT = 20;

const min = 10000000000; // Minimum 11-digit number (10 zeros)
const max = 99999999999; // Maximum 11-digit number (all nines)

const generateFakeData = () => {
    const fakeData = [];

    for (let i = 0; i < COUNT; i++) {
        const fakeItem = {
          name: faker.name.firstName(),
          lastName1: faker.name.lastName(),
          lastName2: faker.name.lastName(),
          idCity: Math.floor(Math.random() * N_CITY) + 2,
          phone: faker.phone.number('(###) ###-###'),
          email: faker.internet.email(),
          position: faker.name.jobTitle(),
          address: faker.address.streetAddress(false),
          salary: getRandomFloat(10000, 25000),
          dateBirth: moment(faker.date.birthdate({ min: 18, max: 25, mode: 'age' })).format("YYYY-MM-DD"),
          dateStart: moment(faker.date.past(1)).format("YYYY-MM-DD"),
          status: true,
          cedula: (Math.floor(Math.random() * (max - min + 1)) + min).toString(),
          bankAccount: encryptor.encrypt((Math.floor(Math.random() * (max - min + 1)) + min).toString()),
          AccountType: "CC",
          currency: "DOP",
          bankRoute: faker.random.alphaNumeric(10),
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
      const result = await prisma.staff.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "Staff"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  