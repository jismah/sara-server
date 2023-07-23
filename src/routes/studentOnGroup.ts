import { Router, response } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "StudentOnGroup";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("studentOnGroup", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:idStudent/:idGroup', async (req, res) => {
    const { idStudent, idGroup } = req.params

    let studentOnGroup;
    try {
        studentOnGroup = await prisma.studentOnGroup.findUnique({
            where: {
                idStudent_idGroup: {
                    idStudent: Number(idStudent),
                    idGroup: Number(idGroup),
                },
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));

    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, studentOnGroup));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:idStudent/:idGroup', async (req, res) => {
    const { idStudent, idGroup } = req.params

    let studentOnGroup;
    try {
        studentOnGroup = await prisma.studentOnGroup.update({
            where: {
                idStudent_idGroup: {
                    idStudent: Number(idStudent),
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

    res.json(resProcessor.concatStatus(200, studentOnGroup));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:idStudent/:idGroup', async (req, res) => {
    const { idStudent, idGroup } = req.params
    const { assignedBy} = req.body;

    if (!(idStudent && idGroup && assignedBy)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idStudent, idGroup);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let studentOnGroup;
    try {
        studentOnGroup = await prisma.studentOnGroup.update({
            where: {
                idStudent_idGroup: {
                  idStudent: Number(idStudent),
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

    res.json(resProcessor.concatStatus(200, studentOnGroup));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { idStudent, idGroup, assignedBy} = req.body;

    if (!(idStudent && idGroup && assignedBy)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(idStudent, idGroup);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.studentOnGroup.create({
            data: {
                idStudent: Number(idStudent),
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

async function validate(idStudent: string, idGroup: string) {
    
    let message = "";
    if (idStudent && !validator.isNumeric(idStudent)) {
        message = "Id del estudiante invalido: No numerico.";
        return {result: false, message: message}
    }
    if (idGroup && !validator.isNumeric(idGroup)) {
        message = "Id del grupo invalido: No numerico.";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;