import { Router, response } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';
import routerHandler from '../utils/routerHandlers';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "ProfessorsForGroup";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("professorsForGroup", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:idProfessor/:idGroup', async (req, res) => {
    const { idProfessor, idGroup } = req.params

    let professorsForGroup;
    try {
        professorsForGroup = await prisma.professorsForGroup.findUnique({
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

    res.json(resProcessor.concatStatus(200, professorsForGroup));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:idProfessor/:idGroup', async (req, res) => {
    const { idProfessor, idGroup } = req.params

    let professorsForGroup;
    try {
        professorsForGroup = await prisma.professorsForGroup.update({
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

    res.json(resProcessor.concatStatus(200, professorsForGroup));
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

    let professorsForGroup;
    try {
        professorsForGroup = await prisma.professorsForGroup.update({
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

    res.json(resProcessor.concatStatus(200, professorsForGroup));
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
        result = await prisma.professorsForGroup.create({
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