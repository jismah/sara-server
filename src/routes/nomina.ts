import { Router, response } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import nominaHandler from '../handlers/nominaHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Nomina";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/doc', async (req, res) => {
    const { nominaId,  accountType, accountCurrency, accountNumber} = req.body

    if (!nominaId || !accountType || !accountCurrency || !accountNumber) {
        return res.json(resProcessor.newMessage(400, '[Nomina] Faltan datos requeridos'));
    }

    if (!validator.isNumeric(nominaId)) {
        return res.json(resProcessor.newMessage(400, "[Nomina] Se recibio un idNomina invalido al intentar crear el documento bancario"))
    }

    if (!validator.isNumeric(accountNumber)) {
        return res.json(resProcessor.newMessage(400, "[Nomina] Se recibio un numero de cuenta no numerico al intentar crear el documento bancario"))
    }

    res.json(await nominaHandler.getBankDoc(Number(nominaId), accountType, accountCurrency, accountNumber));
});

router.get('/mensual', async (req, res) => {
    const { year } = req.body

    await nominaHandler.getMonthly(year, res, 1)
});

router.get('/quincenal', async (req, res) => {
    const { page } = req.query;
    const { year } = req.body

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;
    if (page_int <= 0) {
        page_int = 1
    }

    await nominaHandler.getQuincenal(year, res, page_int)
});

// LISTAR MEDIANTE STAFF
router.get('/staff/:idStaff', async (req, res) => {
    const { idStaff } = req.params
    let { year, month } = req.body

    if (!year || !idStaff) {
        return res.json(resProcessor.newMessage(400, '[Nomina] Faltan datos requeridos'));
    }

    if (!validator.isNumeric(idStaff)) {
        return res.json(resProcessor.newMessage(400, "[Nomina] Se recibio un idStaff invalido al buscar la nomina segun el empleado"))
    }

    let valid = await validate(undefined, undefined, year);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    if (month) {
        valid = await validate(undefined, undefined, month);
        if (!valid.result) {
            return res.json(resProcessor.newMessage(400, valid.message));
        } else {
            month = month.toString().toString().padStart(2, '0');
        }
    }

    res.json(await nominaHandler.getByStaff(Number(idStaff), year, month));
})

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    let { detail } = req.body

    if (!id || !validator.isNumeric(id)) {
        return res.json(resProcessor.newMessage(400, "[Nomina] Se recibio un id invalido al buscar la nomina"))
    }

    if (!detail) {
        detail = false;
    } else if (!validator.isBoolean(detail) || validator.toBool(detail) == false) {
        detail = false;
    } else {
        detail = true
    }

    res.json(await nominaHandler.getById(Number(id), detail));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let nomina;
    try {
        nomina = await prisma.nomina.update({
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

    res.json(resProcessor.concatStatus(200, nomina));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { date, type } = req.body

    const valid = await validate(date, type);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let nomina;
    try {
        nomina = await prisma.nomina.update({
            where: { id: Number(id) },
            data: {
                date: date || undefined,
                type: type ? type.toLowerCase() : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, nomina));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, type } = req.body

    if (!(date && type)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(date, type);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.nomina.create({
            data: {
                date: date,
                type: type.toLowerCase(),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }
    res.json(resProcessor.concatStatus(200, result));
})

async function validate(date?: string, type?: string, year_month?: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha de nomina invalido";
        return {result: false, message: message}
    }
    if (type && !(type.toLowerCase() === 'quincenal') && !(type.toLowerCase() === 'mensual')) {
        message = "Tipo invalido para la nomina. Debe ser 'quincenal' o 'mensual'";
        return {result: false, message: message}
    }
    if (year_month && !validator.isNumeric(year_month)) {
        message = "[Nomina] Se recibio un año o mes invalido";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;