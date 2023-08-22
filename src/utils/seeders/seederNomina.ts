import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import moment from 'moment';
import encryptor from '../keys/encryptionUtils';

const generateFakeData = () => {
    const fakeData = [];

    for (let i = 2020; i < 2026; i++) {
      for (let j = 1; j <= 12; j++) {
        const fakeMonthly = {
          date: `${i}-${j.toString().padStart(2, '0')}-30`,
          type: 'mensual',
        };
        const fakeQuincenal = {
          date: `${i}-${j.toString().padStart(2, '0')}-15`,
          type: 'quincenal',
        };
        fakeData.push(fakeQuincenal);
        fakeData.push(fakeMonthly);
      }
    }

    return fakeData;
};

function getRandomBool(): boolean {
  return Math.random() < 0.5;
}

function getRandomFloat(min: number, max: number) {
  const randomFloat = Math.random() * (max - min) + min;
  return parseFloat(randomFloat.toFixed(2));
}

const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeData = generateFakeData();
  
    try {
      const result = await prisma.nomina.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "Staff"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  