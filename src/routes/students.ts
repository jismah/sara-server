import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
    const students = await prisma.student.findMany()
    res.json(students)
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.delete({
        where: { id: Number(id) },
    })
    res.json(student)
})

router.put('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })
    res.json(student)
})

router.post('/', async (req, res) => {
    const { name, lastName1, lastName2, status, idParent } = req.body
    const result = await prisma.student.create({
        data: {
            name,
            lastName1,
            lastName2,
            status,
            idParent,
        },
    })
    res.json(result)
})

router.get('/studentsWithParents', async (req, res) => {
    const studentsWithParents = await prisma.student.findMany({
        include: { parent: true },
    })
    res.json(studentsWithParents)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.findUnique({
        where: { id: Number(id) },
    })
    res.json(student)
})

export default router;