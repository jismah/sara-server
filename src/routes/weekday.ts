import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const weekDays = await prisma.weekDay.findMany()

    await prisma.$disconnect();

    res.json(weekDays)
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const weekDay = await prisma.weekDay.findUnique({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(weekDay)
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const weekDay = await prisma.weekDay.delete({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(weekDay)
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const weekDay = await prisma.weekDay.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })

    await prisma.$disconnect();

    res.json(weekDay)
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {

    const result = "";

/*     const result = await prisma.weekDay.create({
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