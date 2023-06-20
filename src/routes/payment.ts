import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';
import routerHandler from '../utils/routerHandlers';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Payment";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("payment", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let payment;
    try {
        payment = await prisma.payment.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, payment));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let payment;
    try {
        payment = await prisma.payment.update({
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

    res.json(resProcessor.concatStatus(200, payment));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { date, amount, idParent, idInvoice } = req.body
    const { id } = req.params

    const valid = await validate(date, amount, idParent, idInvoice);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let payment;
    try {
        payment = await prisma.payment.update({
            where: { id: Number(id) },
            data: {
                date: date || undefined,
                amount: amount ? parseFloat(amount) : undefined,
                idInvoice: idInvoice ? Number(idInvoice) : undefined,
                idParent: idParent ? Number(idParent) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, payment));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, amount, idParent, idInvoice } = req.body

    if (!(date && amount && idParent && idInvoice)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(date, amount, idParent, idInvoice);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }
    
    let result;
    try {
        result = await prisma.payment.create({
            data: {
                date: date,
                amount: parseFloat(amount),
                idInvoice: Number(idInvoice),
                idParent: Number(idParent),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(date: string, amount: string, idParent: string, idInvoice: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (amount && !validator.isNumeric(amount)) {
        message = "Cantidad invalida: No numerica";
        return {result: false, message: message}
    }
    if (idParent && !validator.isNumeric(idParent)) {
        message = "Id de padre invalido: No numerico"
        return {result: false, message: message}
    }
    if (idInvoice && !validator.isNumeric(idInvoice)) {
        message = "Id de invoice invalido: No numerico"
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;