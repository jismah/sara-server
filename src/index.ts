/*
    BACKEND SARA PROJECT

    TODO:

    To see Prisma Studio: npx prisma studio

*/

import { PrismaClient } from '@prisma/client'
import express from 'express'

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

app.get('/', async (req, res) => {
    res.send('Welcome to RestAPI - Sara Project')
})

// STUDENTS API

app.get('/students', async (req, res) => {
    const students = await prisma.student.findMany()
    res.json(students)
})

app.get('/studentsWithParents', async (req, res) => {
    const studentsWithParents = await prisma.student.findMany({
        include: { parent: true },
    })
    res.json(studentsWithParents)
})

app.get('/student/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.findUnique({
        where: { id: Number(id) },
    })
    res.json(student)
})

// CREATE STUDENT
app.post(`/student`, async (req, res) => {
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

app.put('/student/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.update({
        where: { id: Number(id) },
        data: { ...req.body },
    })
    res.json(student)
})

app.delete('/student/:id', async (req, res) => {
    const { id } = req.params
    const student = await prisma.student.delete({
        where: { id: Number(id) },
    })
    res.json(student)
})

// PARENTS API

app.get('/parents', async (req, res) => {
    const parents = await prisma.parent.findMany()
    res.json(parents)
})

app.get('/parent/:id', async (req, res) => {
    const { id } = req.params
    const parent = await prisma.parent.findUnique({
        where: { id: Number(id) },
    })
    res.json(parent)
})

app.post(`/parent`, async (req, res) => {
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

app.listen(3000, () =>
    console.log('SARA REST API server ready at: http://localhost:3000'),
)