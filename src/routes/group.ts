import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';
import routerHandler from '../utils/routerHandlers';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "StudentGroup";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("group", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let group;
    try {
        group = await prisma.group.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, group));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let group;
    try {
        group = await prisma.group.update({
            where: { id: Number(id) },
            data: { 
                deleted: true
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, group));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { maxStudents, idShift } = req.body;
    const { id } = req.params

    const valid = await validate(maxStudents, idShift);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let group;
    try {
        group = await prisma.group.update({
            where: { id: Number(id) },
            data: {
                maxStudents: Number(maxStudents) || undefined,
                idShift: Number(idShift) || undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, group));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { maxStudents, idShift } = req.body;

    if (!(maxStudents && idShift)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(maxStudents, idShift);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.group.create({
            data: {
                maxStudents: Number(maxStudents),
                idShift: Number(idShift),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(maxStudents: string, idShift: string) {
    
    let message = "";
    if (maxStudents && !validator.isNumeric(maxStudents)) {
        message = "Formato invalido para el numero max. de estudiantes: No numerico.";
        return {result: false, message: message}
    }
    if (idShift && !validator.isNumeric(idShift)) {
        message = "Id de la tanda invalido: No numerico.";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;