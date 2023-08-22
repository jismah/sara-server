import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import nominaHanlder from '../handlers/nominaHandler';
import moment from 'moment';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Graph Data Handler";
    return errorHandler.checkError(object, error);
}

// Gastos por nomina anual
router.get('/nomina', async (req, res) => {
    const { cant } = req.query;
    let cant_int;

    if (cant) {
        if (!validator.isNumeric(cant.toString())) {
            return res.json(resProcessor.newMessage(400, "Cantidad dada no numerica"))
        }
        cant_int = Number(cant);

        if (cant_int <= 0) {
            return res.json(resProcessor.newMessage(400, "Cantidad dada debe ser mayor que 0"))
        }
    } else {
        cant_int = 6 // Default
    }

    try {
        res.json(resProcessor.concatStatus(200, await nominaHanlder.getRecent(cant_int)));
    } catch (error: any) {
        return res.json(handleError(error));
    } finally {
        await prisma.$disconnect();
    }
});

router.get('/counts', async (req, res) => {

    let studentCount, campCount, programCount;
    try {
        const today = moment().format('YYYY-MM-DD');

        studentCount = await prisma.student.count({
            where: {
                status: 'ENROLLED',
                deleted: false,
            }
        });

        programCount = await prisma.program.count({
            where: {
                status: true,
                deleted: false,
            }
        });

        campCount = await prisma.camp.count({
            where: {
                endDate: {
                    gte: today,
                },
                deleted: false,
            }
        });

    } catch (error: any) {
        return res.json(handleError(error));
    } finally {
        await prisma.$disconnect();
    }

    const result = {
        studentCount: studentCount,
        programCount: programCount,
        campCount: campCount,
    }
    res.json(resProcessor.concatStatus(200, result));
});

// Numero de estudiantes por programas
router.get('/studentPrograms', async (req, res) => {
    const { cant } = req.query;
    let limit;

    if (cant) {
        if (!validator.isNumeric(cant.toString())) {
            return res.json(resProcessor.newMessage(400, "Cantidad dada no numerica"))
        }
        limit = Number(cant);

        if (limit <= 0) {
            return res.json(resProcessor.newMessage(400, "Cantidad dada debe ser mayor que 0"))
        }
    } else {
        limit = 5; // Default
    }

    let formattedData;
    try {
        const programsWithStudentCount = await prisma.program.findMany({
            select: {
              id: true,
              description: true,
              students: {
                select: {
                  id: true
                }
              }
            },
            where: {
              deleted: false,
              status: true,
            },
            orderBy: {
              students: {
                _count: 'desc'
              }
            },
            take: limit
          });
        
        formattedData = programsWithStudentCount.map(program => {
            return {
            programId: program.id,
            description: program.description,
            num_students: program.students.length
            };
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }
    
    return res.json(resProcessor.concatStatus(200, formattedData));
});

export default router;