import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Camp";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("camp", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let camp;
    try {
        camp = await prisma.camp.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, camp));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let camp;
    try {
        camp = await prisma.camp.delete({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, camp));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { name, description, entryFee, capacity, startDate, endDate } = req.body
    const { id } = req.params

    const valid = await validate(entryFee, capacity, startDate, endDate);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let camp;
    try {
        camp = await prisma.camp.update({
            where: { id: Number(id) },
            data: {
                name: name || undefined,
                description: description || undefined,
                entryFee: entryFee ? parseFloat(entryFee) : undefined,
                capacity: capacity ? Number(capacity) : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    await prisma.$disconnect();

    res.json(resProcessor.concatStatus(200, camp));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { name, description, entryFee, capacity, startDate, endDate } = req.body

    if (!(name && description && entryFee && startDate && endDate)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(entryFee, capacity, startDate, endDate);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.camp.create({
            data: {
                name: name,
                description: description,
                entryFee: parseFloat(entryFee),
                capacity: capacity ? Number(capacity) : undefined,
                startDate: startDate,
                endDate: endDate
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    await prisma.$disconnect();

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(entryFee: string, capacity: string, startDate: string, endDate: string) {
    
    let message = "";
    if (entryFee && !validator.isNumeric(entryFee)) {
        message = "Costo de reserva invalido: No numerico";
        return {result: false, message: message}
    }
    if (capacity && !validator.isNumeric(capacity)) {
        message = "Capacidad invalida: No numerica";
        return {result: false, message: message}
    }
    if (startDate && !validator.validateDate(startDate)) {
        message = "Formato de fecha de inicio invalido";
        return {result: false, message: message}
    }
    if (endDate && !validator.validateDate(endDate)) {
        message = "Formato de fecha de fin invalido";
        return {result: false, message: message}
    }
    if (startDate && endDate && !validator.validDateRange(startDate, endDate)) {
        message = "La fecha de inicio no puede ser despues que la fecha de fin";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;