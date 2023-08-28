import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';
import moment from 'moment';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Receipt";
    return errorHandler.checkError(object, error);
}

// LISTAR POR FECHA
router.get('/:idFamily', async (req, res) => {
    const { idFamily } = req.params;
    let { year, month, day } = req.query;

    if (!year || !validator.isNumeric(year.toString())) {
        year = moment().format('yyyy')
    }
    if (!month || !validator.isNumeric(month.toString())) {
        month = moment().format('MM')
    } else {
        month = month.toString().padStart(2, '0');
    }
    if (!day || !validator.isNumeric(day.toString())) {
        day = moment().format('DD')
    } else {
        day = day.toString().padStart(2, '0');
    }

    let results;
    try {
        results = await prisma.receipt.findMany({
            where: {
                idFamily: Number(idFamily.toString()),
                date: `${year}-${month}-${day}`,
                deleted: false,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, results));
});

// LISTAR MEDIANTE ID
router.get('/family/:idFamily', async (req, res) => {
    const { idFamily } = req.params

    let result;
    try {
        result = await prisma.receipt.findMany({
            where: { 
                idFamily: Number(idFamily),
                deleted: false 
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, result, result.length));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let result;
    try {
        result = await prisma.receipt.update({
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

    res.json(resProcessor.concatStatus(200, result));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { date, nameFrom, amount, textAmount, concept, method, idFamily } = req.body

    const valid = await validate(date.toString(), amount.toString(), idFamily.toString());
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }
    
    let result;
    try {
        result = await prisma.receipt.update({
            where: { id: Number(id) },
            data: {
                date: date ? date.toString() : undefined,
                nameFrom: nameFrom ? nameFrom.toString(): undefined,
                amount: amount ? parseFloat(parseFloat(amount).toFixed(2)) : undefined,
                textAmount: textAmount ? textAmount.toString() : undefined,
                concept: concept ? concept.toString() : undefined,
                method: method ? method.toString() : undefined,
                idFamily: idFamily ? Number(idFamily.toString()) : undefined
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, result)); 
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, nameFrom, amount, textAmount, concept, method, idFamily } = req.body

    if (!(date && nameFrom && amount && textAmount && concept && method && idFamily)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(date.toString(), amount.toString(), idFamily.toString());
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.receipt.create({
            data: {
                date: date.toString(),
                nameFrom: nameFrom.toString(),
                amount: parseFloat(parseFloat(amount).toFixed(2)),
                textAmount: textAmount.toString(),
                concept: concept.toString(),
                method: method.toString(),
                idFamily: Number(idFamily.toString())
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(date: string, amount: string, idFamily: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (amount && !validator.isNumeric(amount)) {
        message = "Monto invalido: No numerico";
        return {result: false, message: message}
    }
    if (idFamily && !validator.isNumeric(idFamily)) {
        message = "Id de familia no numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;