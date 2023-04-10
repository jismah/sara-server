/*
    Poblador de Students para inyectar data a la BD
*/

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';


const generateFakeData = () => {
    const fakeStudents = [];

    for (let i = 0; i < 10; i++) {
        const fakeUser = {
            name: faker.name.firstName(),
            lastName1: faker.name.lastName(),
            lastName2: faker.name.lastName(),
            status: 'active',
            idParent: 15
        };
        fakeStudents.push(fakeUser);
    }

    return fakeStudents;
};


const insertFakeData = async () => {
    const prisma = new PrismaClient();
    const fakeStudents = generateFakeData();
  
    try {
      const result = await prisma.student.createMany({ data: fakeStudents });
      console.log(`Se insertaron ${result.count} registros en la tabla "Student"`);
    } catch (error) {
      console.error('Error al insertar datos falsos:', error);
    } finally {
      await prisma.$disconnect();
    }
  };
  
//   EJECUTAR SEEDER
  insertFakeData();
  