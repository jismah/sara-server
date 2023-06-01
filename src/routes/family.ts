import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Family";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    let family;
    try {
        family = await prisma.family.findMany({
            where: {
                deleted: false
            },
            take: 10,
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, family));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let family;
    try {
        family = await prisma.family.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, family));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let family;
    try {
        family = await prisma.family.update({
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

    res.json(resProcessor.concatStatus(200, family));
})

// CREAR
router.post('/', async (req, res) => {

    let result;
    try {
        result = await prisma.family.create({
            data: {},
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

export default router;