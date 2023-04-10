import { Router } from 'express';
import { PrismaClient } from '@prisma/client'

const router = Router();
const prisma = new PrismaClient()

// LISTAR ESTUDIANTES CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const students = await prisma.student.findMany({
        take: 10
    })
    res.json(students)
});

// LISTAR UN ESTUDIANTE MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.findUnique({
        where: { id: Number(id) },
    })
    res.json(student)
})

// ELIMINAR UN ESTUDIANTE MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.delete({
        where: { id: Number(id) },
    })
    res.json(student)
})

// ACTUALIZAR UN ESTUDIANTE MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })
    res.json(student)
})

// CREAR UN NUEVO ESTUDIANTE
// router.post('/', async (req, res) => {
//     const { name, lastName1, lastName2, status, idParent } = req.body

//     const result = await prisma.student.create({
//         data: {
//             name: name,
//             lastName1: lastName1,
//             lastName2: lastName2,
//             status: status,
//             idParent: idParent,
//         },
//     })
//     res.status(200).json(result);
// })

router.post('/', async (req, res) => {
    
    res.status(200).json();
})

// LISTAR TODOS LOS ESTUDIANTES CON SUS PADRES
router.get('/studentsWithParents', async (req, res) => {
    const studentsWithParents = await prisma.student.findMany({
        include: { parent: true },
    })
    res.json(studentsWithParents)
})



export default router;