import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const cities = await prisma.city.findMany()

    await prisma.$disconnect();

    res.json(cities)
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const city = await prisma.city.findUnique({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(city)
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const city = await prisma.city.delete({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(city)
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const city = await prisma.city.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })

    await prisma.$disconnect();

    res.json(city)
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const result = "";

/*     const result = await prisma.city.create({
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