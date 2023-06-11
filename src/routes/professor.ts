import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Professor";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let professors;
    try {
        professors = await prisma.professor.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, professors));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let professor;
    try {
        professor = await prisma.professor.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, professor));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let professor;
    try {
        professor = await prisma.professor.update({
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

    res.json(resProcessor.concatStatus(200, professor));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { academicCategory, idStaff } = req.body
    const { id } = req.params

    const valid = await validate(idStaff);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400,valid.message));
    }

    let professor;
    try {
        professor = await prisma.professor.update({
            where: { id: Number(id) },
            data: {
                academicCategory: academicCategory || undefined,
                idStaff: idStaff ? Number(idStaff) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, professor));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { academicCategory, idStaff } = req.body

    if (!(academicCategory && idStaff)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(idStaff);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.professor.create({
            data: {
                academicCategory: academicCategory,
                idStaff: Number(idStaff),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(idStaff: string) {
    
    let message = "";
    if (idStaff && !validator.isNumeric(idStaff)) {
        message = "Id de la asociacion con el personal invalido: No numerico";
        return {result: false, message: message}
    }
    if (idStaff && !(await validator.isUnique("professor", "idStaff", Number(idStaff)))) {
        message = "La asociacion con el personal debe ser unica";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;