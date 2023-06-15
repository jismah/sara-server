import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Camp";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let camps;
    try {
        camps = await prisma.camp.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, camps));
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
    const { name, description, entryFee, capacity, idAcademicYear } = req.body
    const { id } = req.params

    const valid = await validate(idAcademicYear, entryFee, capacity);
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
                idAcademicYear: idAcademicYear ? Number(idAcademicYear) : undefined,
                entryFee: entryFee ? parseFloat(entryFee) : undefined,
                capacity: capacity ? Number(capacity) : undefined,
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
    const { name, description, entryFee, capacity, idAcademicYear } = req.body

    if (!(name && description && entryFee && idAcademicYear)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idAcademicYear, entryFee, capacity);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.camp.create({
            data: {
                name: name,
                description: description,
                idAcademicYear: Number(idAcademicYear),
                entryFee: parseFloat(entryFee),
                capacity: capacity ? Number(capacity) : undefined,
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

async function validate(idAcademicYear: string, entryFee: string, capacity: string) {
    
    let message = "";
    if (idAcademicYear && !validator.isNumeric(idAcademicYear)) {
        message = "Id del año escolar invalido: No numerico";
        return {result: false, message: message}
    }
    if (entryFee && !validator.isNumeric(entryFee)) {
        message = "Costo de reserva invalido: No numerico";
        return {result: false, message: message}
    }
    if (capacity && !validator.isNumeric(capacity)) {
        message = "Capacidad invalida: No numerica";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;