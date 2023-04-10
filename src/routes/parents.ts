import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR PADRES CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const parents = await prisma.parent.findMany({
        take: 10
    })
    res.json(parents)
})

// LISTAR UN PADRE MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const parent = await prisma.parent.findUnique({
        where: { id: Number(id) },
    })
    res.json(parent)
})

// ELIMINAR UN PADRE MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const parent = await prisma.parent.delete({
        where: { id: Number(id) },
    })
    res.json(parent)
})

// ACTUALIZAR UN PADRE MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const parent = await prisma.parent.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })
    res.json(parent)
})

// CREAR UN NUEVO PADRE
router.post('/', async (req, res) => {
    const { identityCard, name, lastName1, lastName2, telephone, email } = req.body

    const result = await prisma.parent.create({
        data: {
            identityCard: identityCard,
            name: name,
            lastName1: lastName1,
            lastName2: lastName2,
            telephone: telephone,
            email: email,
        }
    })
    res.status(200).json(result);
})


export default router;