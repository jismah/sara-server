import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            deleted: false
        },
        take: 10,
    })

    await prisma.$disconnect();

    res.json(orders)
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const order = await prisma.order.findUnique({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(order)
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const order = await prisma.order.update({
        where: { id: Number(id) },
        data: { 
            deleted: true
        }
    })

    await prisma.$disconnect();

    res.json(order)
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const order = await prisma.order.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })

    await prisma.$disconnect();

    res.json(order)
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const result = "";

/*     const result = await prisma.order.create({
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