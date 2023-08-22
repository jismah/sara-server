import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import moment from 'moment';
import encryptor from '../keys/encryptionUtils';
import nominaHandler from '../../handlers/nominaHandler';

const prisma = new PrismaClient();

const N_NOMINA = 144;

const generateFakeData = async () => {
    const fakeData = [];

    for (let id = 1; id <= N_NOMINA; id++) {
      const nomina = await prisma.nomina.findUnique({
        where: {
          id,
        },
      })
      
      if (!nomina) {
        return []
      }

      for (let j = 1; j <= 5; j++) {
        const salary = getRandomFloat(10000, 30000);
        const extraDays = getRandomInt(0, 10);
        const overtimePay = parseFloat((salary / 23.83 * extraDays).toFixed(2));
        const sfs = parseFloat((salary * (3.04 / 100)).toFixed(2));
        const afp = parseFloat((salary * (2.78 / 100)).toFixed(2));
        const loans = getRandomFloat(0, 1000)
        const other = getRandomFloat(0, 500)
        const total = parseFloat((salary + overtimePay - sfs - afp - loans - other).toFixed(2));

        const fakeItem = {
          idNomina: id,
          idStaff: j,
          date: nomina.date,
          salary: salary,
          extraDays: extraDays,
          overtimePay: overtimePay,
          sfs: sfs,
          afp: afp,
          loans: loans,
          other: other,
          total: total,
        };
        fakeData.push(fakeItem);
      }
    }

    // console.log(fakeData[0])
    console.log("Size:", fakeData.length);
    return fakeData;
};

function getRandomFloat(min: number, max: number) {
  const randomFloat = Math.random() * (max - min) + min;
  return parseFloat(randomFloat.toFixed(2));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const insertFakeData = async () => {
    const fakeData = await generateFakeData();
  
    try {
      const result = await prisma.detailNomina.createMany({ data: fakeData });
      console.log(`Se insertaron ${result.count} registros en la tabla "DetailNomina"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  // generateFakeData()
  