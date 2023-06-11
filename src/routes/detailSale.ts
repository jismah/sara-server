import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "DetailSale";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let detailSales;
    try {
        detailSales = await prisma.detailSale.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailSales));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let detailSale;
    try {
        detailSale = await prisma.detailSale.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailSale));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let detailSale;
    try {
        detailSale = await prisma.detailSale.delete({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailSale));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { quantity, unitaryPrice, idProduct, idSale } = req.body;
    const { id } = req.params

    const valid = await validate(quantity, unitaryPrice, idProduct, idSale);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let detailSale;
    try {
        detailSale = await prisma.detailSale.update({
            where: { id: Number(id) },
            data: {
                quantity: quantity ? Number(quantity) : undefined,
                unitaryPrice: unitaryPrice ? parseFloat(unitaryPrice) : undefined,
                idProduct: idProduct ? Number(idProduct) : undefined,
                idSale: idSale ? Number(idSale) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, detailSale));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { quantity, unitaryPrice, idProduct, idSale } = req.body;

    if (!(quantity && unitaryPrice && idProduct && idSale)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(quantity, unitaryPrice, idProduct, idSale);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.detailSale.create({
            data: {
                quantity: Number(quantity),
                unitaryPrice: parseFloat(unitaryPrice),
                idProduct: Number(idProduct),
                idSale: Number(idSale),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(quantity: string, unitaryPrice: string, idProduct: string, idSale: string) {
    
    let message = "";
    if (quantity && !validator.isNumeric(quantity)) {
        message = "Cantidad invalida: No numerica";
        return {result: false, message: message}
    }
    if (unitaryPrice && !validator.isNumeric(unitaryPrice)) {
        message = "Precio invalido: No numerico";
        return {result: false, message: message}
    }
    if (idProduct && !validator.isNumeric(idProduct)) {
        message = "Id del producto invalido: No numerico";
        return {result: false, message: message}
    }
    if (idSale && !validator.isNumeric(idSale)) {
        message = "Id de la venta invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;