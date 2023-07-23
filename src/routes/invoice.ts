import { Router, response } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Invoice";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("invoice", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let invoice;
    try {
        invoice = await prisma.invoice.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, invoice));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let invoice;
    try {
        invoice = await prisma.invoice.update({
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

    res.json(resProcessor.concatStatus(200, invoice));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { date, amount, status, idCamp, idSale, idOrder} = req.body

    const valid = await validate(date, amount, idCamp, idSale, idOrder);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let invoice;
    try {
        invoice = await prisma.invoice.update({
            where: { id: Number(id) },
            data: {
                date: date || undefined,
                amount: amount ? parseFloat(amount) : undefined,
                status: status || undefined,
                idCamp: idCamp ? Number(idCamp) : undefined,
                idSale: idSale ? Number(idSale) : undefined,
                idOrder: idOrder ? Number(idOrder): undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, invoice));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, amount, status, idCamp, idSale, idOrder} = req.body

    if (!(date && amount && status && idCamp && idSale && idOrder)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(date, amount, idCamp, idSale, idOrder);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.invoice.create({
            data: {
                date: date,
                amount: parseFloat(amount),
                status: status,
                idCamp: Number(idCamp),
                idSale: Number(idSale),
                idOrder: Number(idOrder)
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }
    res.json(resProcessor.concatStatus(200, result));
})

async function validate(date: string, amount: string, idCamp: string, idSale: string, idOrder: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (amount && !validator.isNumeric(amount)) {
        message = "Cantidad invalida: No numerica";
        return {result: false, message: message}
    }
    if (idCamp && !validator.isNumeric(idCamp)) {
        message = "Id Campamento invalido: No numerico";
        return {result: false, message: message}
    }
    if (idSale && !validator.isNumeric(idSale)) {
        message = "Id Venta invalido: No numerico";
        return {result: false, message: message}
    }
    if (idSale && !validator.isUnique("invoice", "idSale", idSale)) {
        message = "Id de venta invalido: Debe ser unico";
        return {result: false, message: message}
    }
    if (idOrder && !validator.isNumeric(idOrder)) {
        message = "Id de orden invalido: No numerico";
        return {result: false, message: message}
    }
    if (idOrder && !validator.isUnique("invoice", "idOrder", idOrder)) {
        message = "Id de orden invalido: Debe ser unico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;