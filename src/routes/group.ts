import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Group";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("group", pageSize, page, res);
});

router.get('/info', async (req, res) => {
    let response;
    try {
        const students = await prisma.student.findMany({
            where: { deleted: false, status: "ENROLLED" }
        })
        const professors = await prisma.professor.findMany({
            where: {
                deleted: false,
                staff: {
                    status: true,
                }
            },
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true,
                        lastName1: true,
                        lastName2: true,
                    }
                },
            }
        })
        const shifts = await prisma.shift.findMany({
            where: {
                deleted: false
            },
            include: {
                weekDay: true,
                academicYear: true,
            }
        })

        response = {
            students: students,
            professors: professors,
            shifts: shifts
        }
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, response));
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let group;
    try {
        group = await prisma.group.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, group));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let group;
    try {
        group = await prisma.group.update({
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

    res.json(resProcessor.concatStatus(200, group));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { maxStudents, idShift } = req.body;
    const { id } = req.params

    const valid = await validate(maxStudents, idShift);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let group;
    try {
        group = await prisma.group.update({
            where: { id: Number(id) },
            data: {
                maxStudents: Number(maxStudents) || undefined,
                idShift: Number(idShift) || undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, group));
})

// CREAR NUEVO RECORD
router.post('/bulk', async (req, res) => {
    const { maxStudents, idShift, professors, students, camps } = req.body;

    if (!(maxStudents?.toString() && idShift?.toString() && professors && students && camps)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(maxStudents.toString(), idShift.toString());
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    if (!Array.isArray(professors) || professors.length === 0) {
        return res.json(resProcessor.newMessage(400, 'Se requiere al menos 1 profesor'));
    } else {
        for (const professor of professors) {
            const valid = validateId(professor.id.toString());
            if (!valid.result) {
                return res.json(resProcessor.newMessage(400, valid.message));
            }
        } 
    }

    if (!Array.isArray(students) || students.length === 0) {
        return res.json(resProcessor.newMessage(400, 'Se requiere al menos 1 estudiante'));
    } else {
        for (const student of students) {
            const valid = validateId(student.id.toString());
            if (!valid.result) {
                return res.json(resProcessor.newMessage(400, valid.message));
            }
        } 
    }

    if (!Array.isArray(camps)) {
        return res.json(resProcessor.newMessage(400, 'Camps debe ser un arreglo'));
    } else {
        for (const camp of camps) {
            const valid = validateId(camp.id.toString());
            if (!valid.result) {
                return res.json(resProcessor.newMessage(400, valid.message));
            }
        } 
    }

    
    try {
        await prisma.$transaction(async (prisma) => {
            let result;
            const group = await prisma.group.create({
                data: {
                    maxStudents: Number(maxStudents.toString()),
                    idShift: Number(idShift.toString()),
                },
            })

            const resultProfessors: any = [];
            for (const profesor of professors) {
                const result = await prisma.professorsForGroup.create({
                    data: {
                        idProfessor: Number(profesor.id.toString()),
                        idGroup: Number(group.id.toString()),
                    },
                })
                resultProfessors.push(result);
            }

            const resultStudents: any = [];
            for (const student of students) {
                const result = await prisma.studentOnGroup.create({
                    data: {
                        idStudent: Number(student.id.toString()),
                        idGroup: Number(group.id.toString()),
                    },
                })
                resultStudents.push(result);
            }

            const resultCamps: any = [];
            for (const camp of camps) {
                result = await prisma.groupOnCamp.create({
                    data: {
                        idCamp: Number(camp.id.toString()),
                        idGroup: Number(group.id.toString()),
                    },
                })
                resultCamps.push(result);
            }

            result = {
                group: group,
                professors: resultProfessors,
                students: resultStudents,
                camps: resultCamps
            }

            res.status(200).json(resProcessor.concatStatus(200, result));
        });

    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { maxStudents, idShift } = req.body;

    if (!(maxStudents && idShift)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(maxStudents, idShift);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.group.create({
            data: {
                maxStudents: Number(maxStudents),
                idShift: Number(idShift),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(maxStudents: string, idShift: string) {
    
    let message = "";
    if (maxStudents && !validator.isNumeric(maxStudents)) {
        message = "Formato invalido para el numero max. de estudiantes: No numerico.";
        return {result: false, message: message}
    }
    if (idShift && !validator.isNumeric(idShift)) {
        message = "Id de la tanda invalido: No numerico.";
        return {result: false, message: message}
    }
    return {result: true}
}

function validateId(id: string) {
    
    let message = "";
    if (id && !validator.isNumeric(id)) {
        message = "Se recivio un id invalido";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;