import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "DetailOrder";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let detailOrder;
    try {
        detailOrder = await prisma.detailOrder.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailOrder));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let detailOrder;
    try {
        detailOrder = await prisma.detailOrder.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailOrder));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let detailOrder;
    try {
        detailOrder = await prisma.detailOrder.update({
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

    res.json(resProcessor.concatStatus(200, detailOrder));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { quantity, idOrder, idProduct } = req.body;

    const valid = await validate(quantity, idOrder, idProduct);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let detailOrder;
    try {
        detailOrder = await prisma.detailOrder.update({
            where: { id: Number(id) },
            data: {
                quantity: quantity ? Number(quantity) : undefined,
                idOrder: idOrder ? Number(idOrder) : undefined,
                idProduct: idProduct ? Number(idProduct) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailOrder));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { quantity, idOrder, idProduct } = req.body;

    if (!(quantity && idOrder && idProduct)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(quantity, idOrder, idProduct);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.detailOrder.create({
            data: {
                quantity: Number(quantity),
                idOrder: Number(idOrder),
                idProduct: Number(idProduct),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(quantity: string, idOrder: string, idProduct: string) {
    
    let message = "";
    if (quantity && !validator.isNumeric(quantity)) {
        message = "Cantidad invalida: No numerica.";
        return {result: false, message: message}
    }
    if (idOrder && !validator.isNumeric(idOrder)) {
        message = "Id de la orden invalida: No numerico.";
        return {result: false, message: message}
    }
    if (idProduct && !validator.isNumeric(idProduct)) {
        message = "Id del producto invalido: No numerico.";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;