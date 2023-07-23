import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Product";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("product", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let product;
    try {
        product = await prisma.product.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, product));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let product;
    try {
        product = await prisma.product.update({
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

    res.json(resProcessor.concatStatus(200, product));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const {name, price, cost, available, status} = req.body

    let product;
    try {
        product = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name: name || undefined,
                price: price ? parseFloat(price) : undefined,
                cost: cost ? parseFloat(cost) : undefined,
                status: status || undefined,
                available: available ? validator.toBool(available) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, product));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const {name, price, cost, available, status} = req.body

    if (!(name && price && cost && available && status)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(price, cost, available);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.product.create({
            data: {
                name: name,
                price: parseFloat(price),
                cost: parseFloat(cost),
                status: status,
                available: validator.toBool(available),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(price: string, cost: string, available: string) {
    
    let message = "";
    if (price && !validator.isNumeric(price)) {
        message = "Precio invalido: No numerico";
        return {result: false, message: message}
    }
    if (cost && !validator.isNumeric(cost)) {
        message = "Costo invalido: No numerico";
        return {result: false, message: message}
    }
    if (available && !validator.isBoolean(available)) {
        message = "Status invalido: No booleano"
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;