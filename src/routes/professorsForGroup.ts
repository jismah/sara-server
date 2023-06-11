import { Router, response } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "ProfesorsForGroup";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;

    let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;

    const pageSize = 10;
    const offset = (page_int - 1) * pageSize;

    let profesorsForGroups;
    try {
        profesorsForGroups = await prisma.profesorsForGroup.findMany({
            where: { deleted: false },
            take: pageSize,
            skip: offset,
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, profesorsForGroups));
});

// LISTAR MEDIANTE ID
router.get('/:idProfessor/:idGroup', async (req, res) => {
    const { idProfessor, idGroup } = req.params

    let profesorsForGroup;
    try {
        profesorsForGroup = await prisma.profesorsForGroup.findUnique({
            where: {
                idProfessor_idGroup: {
                    idProfessor: Number(idProfessor),
                    idGroup: Number(idGroup),
                },
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));

    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, profesorsForGroup));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:idProfessor/:idGroup', async (req, res) => {
    const { idProfessor, idGroup } = req.params

    let profesorsForGroup;
    try {
        profesorsForGroup = await prisma.profesorsForGroup.update({
            where: {
                idProfessor_idGroup: {
                    idProfessor: Number(idProfessor),
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

    res.json(resProcessor.concatStatus(200, profesorsForGroup));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:idProfessor/:idGroup', async (req, res) => {
    const { idProfessor, idGroup } = req.params
    const { assignedBy} = req.body;

    if (!(idProfessor && idGroup && assignedBy)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idProfessor, idGroup);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let profesorsForGroup;
    try {
        profesorsForGroup = await prisma.profesorsForGroup.update({
            where: {
                idProfessor_idGroup: {
                  idProfessor: Number(idProfessor),
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

    res.json(resProcessor.concatStatus(200, profesorsForGroup));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { idProfessor, idGroup, assignedBy} = req.body;

    if (!(idProfessor && idGroup && assignedBy)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idProfessor, idGroup);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.profesorsForGroup.create({
            data: {
                idProfessor: Number(idProfessor),
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

async function validate(idProfessor: string, idGroup: string) {
    
    let message = "";
    if (idProfessor && !validator.isNumeric(idProfessor)) {
        message = "Id del profesor invalido: No numerico.";
        return {result: false, message: message}
    }
    if (idGroup && !validator.isNumeric(idGroup)) {
        message = "Id del grupo invalido: No numerico.";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;