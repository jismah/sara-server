import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';
import routerHandler from '../utils/routerHandlers';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Objectives";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("objectives", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let objectives;
    try {
        objectives = await prisma.objectives.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, objectives));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let objectives;
    try {
        objectives = await prisma.objectives.update({
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

    res.json(resProcessor.concatStatus(200, objectives));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const {title, mark, idProgram, idEvaluation} = req.body
    const { id } = req.params

    const valid = await validate(idProgram, idEvaluation);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let objectives;
    try {
        objectives = await prisma.objectives.update({
            where: { id: Number(id) },
            data: {
                title: title,
                mark: mark,
                idProgram: Number(idProgram),
                idEvaluation: Number(idEvaluation),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, objectives));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const {title, mark, idProgram, idEvaluation} = req.body

    if (!(title && mark && idProgram && idEvaluation)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(idProgram, idEvaluation);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.objectives.create({
            data: {
                title: title,
                mark: mark,
                idProgram: Number(idProgram),
                idEvaluation: Number(idEvaluation),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(idProgram: string, idEvaluation: string) {
    
    let message = "";
    if (idProgram && !validator.isNumeric(idProgram)) {
        message = "Id del programa invalido: No numerico";
        return {result: false, message: message}
    }
    if (idEvaluation && !validator.isNumeric(idEvaluation)) {
        message = "Id de la evaluacion invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;