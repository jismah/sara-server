import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const evaluations = await prisma.evaluation.findMany({
        where: {
            deleted: false
        },
        take: 10,
    })

    await prisma.$disconnect();

    res.json(evaluations)
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const evaluation = await prisma.evaluation.findUnique({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(evaluation)
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const evaluation = await prisma.evaluation.update({
        where: { id: Number(id) },
        data: { 
            deleted: true
        }
    })

    await prisma.$disconnect();

    res.json(evaluation)
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const evaluation = await prisma.evaluation.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })

    await prisma.$disconnect();

    res.json(evaluation)
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const result = "";

/*     const result = await prisma.evaluation.create({
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