/*
    BACKEND SARA PROJECT

    TODO:

    To see Prisma Studio: npx prisma studio

*/

import { PrismaClient } from '@prisma/client'
import express, { NextFunction, Request, Response, Router } from 'express'

const prisma = new PrismaClient()
const app = express()

const api_keys: string[] = ['123456', '654321', '147258'];

function checkApiKey(req: Request, res: Response, next: NextFunction): void {
    const key: string = req.headers['x-api-key'] as string ?? '';
    if (key && api_keys.includes(key)) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

app.use(express.json())


app.get('/', async (req, res) => {
    res.send('Welcome to RestAPI - Sara Project')
})

// Router para las rutas protegidas
const protectedRoutes: Router = express.Router();
protectedRoutes.use(checkApiKey);


// STUDENTS API

protectedRoutes.get('/students', async (req, res) => {
    const students = await prisma.student.findMany()
    res.json(students)
})

protectedRoutes.get('/studentsWithParents', async (req, res) => {
    const studentsWithParents = await prisma.student.findMany({
        include: { parent: true },
    })
    res.json(studentsWithParents)
})

protectedRoutes.get('/student/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.findUnique({
        where: { id: Number(id) },
    })
    res.json(student)
})

// CREATE STUDENT
protectedRoutes.post(`/student`, async (req, res) => {
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

protectedRoutes.put('/student/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })
    res.json(student)
})

protectedRoutes.delete('/student/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.delete({
        where: { id: Number(id) },
    })
    res.json(student)
})

// PARENTS API

protectedRoutes.get('/parents', async (req, res) => {
    const parents = await prisma.parent.findMany()
    res.json(parents)
})

protectedRoutes.get('/parent/:id', async (req, res) => {
    const { id } = req.params
    const parent = await prisma.parent.findUnique({
        where: { id: Number(id) },
    })
    res.json(parent)
})

protectedRoutes.post(`/parent`, async (req, res) => {
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

// Agregar el path de rutas protegidas al servidor de express
app.use('/api', protectedRoutes);

app.listen(3000, () =>
    console.log('SARA REST API server ready at: http://localhost:3000'),
)