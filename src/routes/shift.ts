import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Shift";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("shift", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let shift;
    try {
        shift = await prisma.shift.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, shift));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let shift;
    try {
        shift = await prisma.shift.update({
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

    res.json(resProcessor.concatStatus(200, shift));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { initialHour, finishHour, idStaff, idAcademicYear, idWeekDay } = req.body

    const valid = await validate(initialHour, finishHour, idStaff, idAcademicYear, idWeekDay);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let shift;
    try {
        shift = await prisma.shift.update({
            where: { id: Number(id) },
            data: {
                initialHour: initialHour,
                finishHour: finishHour,
                idStaff: Number(idStaff),
                idAcademicYear: Number(idAcademicYear),
                idWeekDay: Number(idWeekDay),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, shift));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { initialHour, finishHour, idStaff, idAcademicYear, idWeekDay } = req.body

    if (!(initialHour && finishHour && idStaff && idAcademicYear && idWeekDay)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(initialHour, finishHour, idStaff, idAcademicYear, idWeekDay);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.shift.create({
            data: {
                initialHour: initialHour,
                finishHour: finishHour,
                idStaff: Number(idStaff),
                idAcademicYear: Number(idAcademicYear),
                idWeekDay: Number(idWeekDay),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(initialHour: string, finishHour: string, idStaff: string, idAcademicYear: string, idWeekDay: string) {
    
    let message = "";
    if (initialHour && !validator.validateTime(initialHour)) {
        message = "Formato de hora de inicio invalido";
        return {result: false, message: message}
    }
    if (finishHour && !validator.validateTime(finishHour)) {
        message = "Formato de hora de fin invalido";
        return {result: false, message: message}
    }
    if (idStaff && !validator.isNumeric(idStaff)) {
        message = "Id de personal invalido: No numerico";
        return {result: false, message: message}
    }
    if (idAcademicYear && !validator.isNumeric(idAcademicYear)) {
        message = "Id de año escolar invalido: No numerico";
        return {result: false, message: message}
    }
    if (idWeekDay && !validator.isNumeric(idWeekDay)) {
        message = "Id del dia invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;