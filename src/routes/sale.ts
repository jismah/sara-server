import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';
import routerHandler from '../utils/routerHandlers';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Sale";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("sale", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let sale;
    try {
        sale = await prisma.sale.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, sale));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let sale;
    try {
        sale = await prisma.sale.update({
            where: { id: Number(id) },
            data: { 
                deleted: true,
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, sale));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { date, total } = req.body

    const valid = await validate(date, total);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let sale;
    try {
        sale = await prisma.sale.update({
            where: { id: Number(id) },
            data: {
                date: date || undefined,
                total: total ? parseFloat(total) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, sale));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, total } = req.body

    if (!(date && total)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(date, total);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.sale.create({
            data: {
                date: date,
                total: parseFloat(total),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(date: string, total: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (total && !validator.isNumeric(total)) {
        message = "Monto invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;