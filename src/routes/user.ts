import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const users = await prisma.user.findMany({
        where: { deleted: false },
    })

    await prisma.$disconnect();

    res.json(users)
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const user = await prisma.user.findUnique({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(user)
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { 
            deleted: true,
        }
    })

    await prisma.$disconnect();

    res.json(user)
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })

    await prisma.$disconnect();

    res.json(user)
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {

    const result = "";

/*     const result = await prisma.user.create({
        data: {
            name: name,
            lastName1: lastName1,
            lastName2: lastName2,
            status: status,
            idParent: Number(idParent),
        },
    }) */

    await prisma.$disconnect();

    res.status(200).json(result);
})



export default router;