import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Family";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("family", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let family;
    try {
        family = await prisma.family.findUnique({
            where: { id: Number(id) },
            include: {
                students: true,
                parents: true,
                user: { select: {
                    id: true,
                    username: true,
                    name: true,
                    lastName1: true,
                    lastName2: true,
                    email: true,
                    phone: true,
                    role: true,
                    idFamily: true, 
                } }
            }
        });
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, family));
})

// LISTAR MEDIANTE ID
router.get('/info/receipts', async (req, res) => {
    try {
        const family = await prisma.family.findMany({
            where: {
                deleted: false,
            },
            include: {
                students: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true
                    }
                },
                receipts: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true
                    },
                }
            },
        });

        if (family) {
            res.json(resProcessor.concatStatus(200, family, family.length));
        }
    } catch (error) {
        return res.json(handleError(error));
    } finally {
        await prisma.$disconnect();
    }
});


// LISTAR ESTUDIANTES RELACIONADOS 
router.get('/:id/students', async (req, res) => {
    const { id } = req.params

    let students;
    try {
        students = await prisma.student.findMany({
            where: { 
                idFamily: Number(id),
                deleted: false
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, students, students.length));
})

// LISTAR PADRES RELACIONADOS 
router.get('/:id/parents', async (req, res) => {
    const { id } = req.params

    let parents;
    try {
        parents = await prisma.parent.findMany({
            where: { 
                idFamily: Number(id),
                deleted: false
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, parents, parents.length));
})

// LISTAR USUARIO RELACIONADO
router.get('/:id/user', async (req, res) => {
    const { id } = req.params

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { 
                idFamily: Number(id)
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, user, user ? 1 : 0));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let family;
    try {
        family = await prisma.family.update({
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

    res.json(resProcessor.concatStatus(200, family));
})

router.post('/:id', async (req, res) => {
    const { id } = req.params
    const { name } = req.body

    let result;
    try {
        result = await prisma.family.update({
            where: {
                id: Number(id)
            },
            data: {
                name: name
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

// CREAR
router.post('/', async (req, res) => {
    const { name } = req.body

    let result;
    try {
        result = await prisma.family.create({
            data: {
                name: name
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

export default router;