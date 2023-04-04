import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// PARENTS API
router.get('/', async (req, res) => {
    const parents = await prisma.parent.findMany()
    res.json(parents)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const parent = await prisma.parent.findUnique({
        where: { id: Number(id) },
    })
    res.json(parent)
})

router.post('/', async (req, res) => {
    const { identityCard, name, lastName1, lastName2, telephone, email } = req.body

    const result = await prisma.parent.create({
        data: {
            identityCard,
            name,
            lastName1,
            lastName2,
            telephone,
            email
        },
    })
    res.json(result)
})


export default router;