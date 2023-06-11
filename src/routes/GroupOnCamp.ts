import { Router, response } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "GroupOnCamp";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let groupOnCamps;
    try {
        groupOnCamps = await prisma.groupOnCamp.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, groupOnCamps));
});

// LISTAR MEDIANTE ID
router.get('/:idCamp/:idGroup', async (req, res) => {
    const { idCamp, idGroup } = req.params

    let groupOnCamp;
    try {
        groupOnCamp = await prisma.groupOnCamp.findUnique({
            where: {
                idCamp_idGroup: {
                    idCamp: Number(idCamp),
                    idGroup: Number(idGroup),
                },
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));

    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, groupOnCamp));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:idCamp/:idGroup', async (req, res) => {
    const { idCamp, idGroup } = req.params

    let groupOnCamp;
    try {
        groupOnCamp = await prisma.groupOnCamp.update({
            where: {
                idCamp_idGroup: {
                    idCamp: Number(idCamp),
                    idGroup: Number(idGroup),
                },
            },
            data: { 
                deleted: true
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, groupOnCamp));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:idCamp/:idGroup', async (req, res) => {
    const { idCamp, idGroup } = req.params
    const { assignedBy} = req.body;

    if (!(idCamp && idGroup && assignedBy)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idCamp, idGroup);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let groupOnCamp;
    try {
        groupOnCamp = await prisma.groupOnCamp.update({
            where: {
                idCamp_idGroup: {
                  idCamp: Number(idCamp),
                  idGroup: Number(idGroup),
                },
            },
            data: {
                assignedBy: assignedBy || undefined,
            },
        });
    } catch (error: any) {
        return res.json(handleError(error));

    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, groupOnCamp));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { idCamp, idGroup, assignedBy} = req.body;

    if (!(idCamp && idGroup && assignedBy)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idCamp, idGroup);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.groupOnCamp.create({
            data: {
                idCamp: Number(idCamp),
                idGroup: Number(idGroup),
                assignedBy: assignedBy,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));

    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(idCamp: string, idGroup: string) {
    
    let message = "";
    if (idCamp && !validator.isNumeric(idCamp)) {
        message = "Id del campamento invalido: No numerico.";
        return {result: false, message: message}
    }
    if (idGroup && !validator.isNumeric(idGroup)) {
        message = "Id del grupo invalido: No numerico.";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;