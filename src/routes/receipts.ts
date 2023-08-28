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
router.get('/', async (req, res) => {
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

    console.log(year, month, day)

    let results;
    try {
        results = await prisma.receipt.findMany({
            where: { date: `${year}-${month}-${day}` },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, results));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let result;
    try {
        result = await prisma.receipt.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, result));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let result;
    try {
        result = await prisma.receipt.delete({
            where: { id: Number(id) },
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
    const { name } = req.body
    
    let city;
    try {
        city = await prisma.city.update({
            where: { id: Number(id) },
            data: { name:  name || undefined},
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, city)); 
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, nameFrom, amount, textAmount, concept, method } = req.body

    if (!(date && nameFrom && amount && textAmount && concept && method)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(date, amount);
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
                method: method.toString()
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(date: string, amount: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (amount && !validator.isNumeric(amount)) {
        message = "Monto invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;