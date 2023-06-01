import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "AcademicYear";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    let academicYears;
    try {
        academicYears = await prisma.academicYear.findMany({
            where: {
                deleted: false
            },
            take: 10,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, academicYears));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    let academicYear;
    try {
        academicYear = await prisma.academicYear.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, academicYear));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    let academicYear;
    try {
        academicYear = await prisma.academicYear.delete({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, academicYear));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { startTime, endTime } = req.body;
    const { id } = req.params

    const valid = await validate(startTime, endTime);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }
    
    let academicYear;
    try {
        academicYear = await prisma.academicYear.update({
            where: { id: Number(id) },
            data: {
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime): undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, academicYear));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { startTime, endTime } = req.body;

    if (!(startTime && endTime)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(startTime, endTime);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.academicYear.create({
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(startTime: string, endTime: string) {
    
    let message = "";
    if (startTime && !validator.validateDate(startTime)) {
        message = "Formato de fecha de inicio invalido";
        return {result: false, message: message}
    }
    if (endTime && !validator.validateDate(endTime)) {
        message = "Formato de fecha de fin invalido";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;