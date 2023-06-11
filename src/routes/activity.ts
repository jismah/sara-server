import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Activity";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let activities;
    try {
        activities = await prisma.activity.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, activities));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let activity;
    try {
        activity = await prisma.activity.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, activity));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let activity;
    try {
        activity = await prisma.activity.delete({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, activity));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { startTime, endTime, day, description, idCamp } = req.body
    const { id } = req.params

    const valid = await validate(startTime, endTime, day, idCamp);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let activity;
    try {
        activity = await prisma.activity.update({
            where: { id: Number(id) },
            data: {
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                day: day ? new Date(day) : undefined,
                description: description || undefined,
                idCamp: idCamp ? Number(idCamp) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, activity));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { startTime, endTime, day, description, idCamp } = req.body

    if (!(startTime && endTime && day && description && idCamp)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(startTime, endTime, day, idCamp);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.activity.create({
            data: {
                startTime: startTime,
                endTime: endTime,
                day: new Date(day),
                description: description,
                idCamp: Number(idCamp),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(startTime: string, endTime: string, day: string, idCamp: string) {
    
    let message = "";
    if (day && !validator.validateDate(day)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (startTime && !validator.validateTime(startTime)) {
        message = "Formato de tiempo de inicio invalido";
        return {result: false, message: message}
    }
    if (endTime && !validator.validateTime(endTime)) {
        message = "Formato de tiempo de fin invalido";
        return {result: false, message: message}
    }
    if (idCamp && !validator.isNumeric(idCamp)) {
        message = "Id del campamento invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;