import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR ESTUDIANTES CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const students = await prisma.student.findMany({
        where: { deleted: false},
        take: 10,
    })

    await prisma.$disconnect();

    res.json(students)
});

// LISTAR UN ESTUDIANTE MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.findUnique({
        where: { id: Number(id) },
    })

    await prisma.$disconnect();

    res.json(student)
})

// ELIMINAR (LOGICO) UN ESTUDIANTE MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.update({
        where: { id: Number(id) },
        data: { 
            deleted: true,
        }
    })

    await prisma.$disconnect();

    res.json(student)
})

// ACTUALIZAR UN ESTUDIANTE MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })

    await prisma.$disconnect();

    res.json(student)
})

// CREAR UN NUEVO ESTUDIANTE
router.post('/', async (req, res) => {
    const { name, lastName1, lastName2, status, idParent } = req.body

    const result = "";

/*     const result = await prisma.student.create({
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


// LISTAR TODOS LOS ESTUDIANTES CON SUS PADRES
router.get('/studentsWithParents', async (req, res) => {
    const studentsWithParents = await prisma.student.findMany({
        include: { parent: true },
    })

    await prisma.$disconnect();

    res.status(200).json(studentsWithParents)
})



export default router;