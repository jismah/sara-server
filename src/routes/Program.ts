import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Program";
    return errorHandler.checkError(object, error);
}

// LISTAR PROGRAMAS CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let programs;
    try {
        programs = await prisma.program.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, programs));
});

// LISTAR UN PROGRAMA MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let program;
    try {
        program = await prisma.program.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, program));
})

// ELIMINAR (LOGICO) UN PROGRAMA MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let program;
    try {
        program = await prisma.program.update({
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

    res.json(resProcessor.concatStatus(200, program));
})

// ACTUALIZAR UN PROGRAMA MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { description, maxStudents, inscription, monthlyAmount } = req.body;
    const { id } = req.params;

    const valid = await validate(maxStudents, inscription, monthlyAmount);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let program;
    try {
        program = await prisma.program.update({
            where: { id: Number(id) },
            data: {
                description: description || undefined,
                maxStudents: maxStudents ? Number(maxStudents) : undefined,
                inscription: inscription ? parseFloat(inscription) : undefined,
                monthlyAmount: monthlyAmount ? parseFloat(monthlyAmount) : undefined
            },
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, program));
});

// CREAR UN NUEVO PROGRMA
router.post('/', async (req, res) => {
    const { description, maxStudents, inscription, monthlyAmount } = req.body

    const valid = await validate(maxStudents, inscription, monthlyAmount);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    if (!(description && maxStudents && inscription && monthlyAmount)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    let result;
    try {
        result = await prisma.program.create({
            data: {
                description: description,
                maxStudents: Number(maxStudents),
                inscription: parseFloat(inscription),
                monthlyAmount: parseFloat(monthlyAmount)
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(maxStudents: string,
     inscription: string, monthlyAmount: string) {
    
    let message = "";
    if (maxStudents && !validator.isNumeric(maxStudents)) {
        message = "El numero maximo de estudiantes recibio un dato erroneo";
        return {result: false, message: message}
    }
    if (inscription && !validator.isNumeric(inscription)) {
        message = "La inscripcion recibio un dato erroneo";
        return {result: false, message: message}
    }
    if (monthlyAmount && !validator.isNumeric(monthlyAmount)) {
        message = "El monto menusal recibio un dato erroneo";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;