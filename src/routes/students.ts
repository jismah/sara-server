import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';
import routerHandler from '../utils/routerHandlers';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Student";
    return errorHandler.checkError(object, error);
}

const StatusStudent = [
    "ENROLLED",
    "REJECTED",
    "WAITLISTED",
    "ACCEPTED_NOT_ENROLLED"
];

// LISTAR ESTUDIANTES CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("student", pageSize, page, res);
});

// LISTAR UN ESTUDIANTE MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let student;
    try {
        student = await prisma.student.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, student));
})

// ELIMINAR (LOGICO) UN ESTUDIANTE MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let student;
    try {
        student = await prisma.student.update({
            where: { id: Number(id) },
            data: { 
                deleted: true,
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, student));
})

// ACTUALIZAR UN ESTUDIANTE MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { name, lastName1, lastName2, status, commentary, dateBirth,
        housePhone, address, medicalCondition, idPediatrician, idFamily,
        progressDesired, allowedPictures, idCity, idParent, idProgram } = req.body

    const valid = await validate(status, dateBirth, housePhone,
        idPediatrician, idFamily, allowedPictures, idCity, idParent, idProgram);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let student;
    try {
        student = await prisma.student.update({
            where: { id: Number(id) },
            data: {
                name: name || undefined,
                lastName1: lastName1 || undefined,
                lastName2: lastName2 || undefined,
                status: status || undefined,
                commentary: commentary || undefined,
                dateBirth: dateBirth || undefined,
                housePhone: housePhone || undefined,
                address: address || undefined,
                medicalCondition: medicalCondition || undefined,
                progressDesired: progressDesired || undefined,
                allowedPictures: allowedPictures ? validator.toBool(allowedPictures) : undefined,
                idPediatrician: idPediatrician ? Number(idPediatrician) : undefined,
                idFamily: idFamily ? Number(idFamily) : undefined,
                idCity: idCity ? Number(idCity) : undefined,
                idParent: idParent ? Number(idParent) : undefined,
                idProgram: idProgram ? Number(idProgram) : undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, student));
})

// CREAR UN NUEVO ESTUDIANTE
router.post('/', async (req, res) => {
    const { name, lastName1, lastName2, status, commentary, dateBirth, housePhone, address, medicalCondition, idPediatrician, idFamily,progressDesired, allowedPictures, idCity, idParent, idProgram } = req.body
    
    if (!(name && lastName1 && status && dateBirth && housePhone && address && idPediatrician && idFamily && idCity && idParent && idProgram)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(status, dateBirth, housePhone, idPediatrician, idFamily, allowedPictures, idCity, idParent, idProgram);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.student.create({
            data: {
                name: name,
                lastName1: lastName1,
                lastName2: lastName2 || undefined,
                status: status,
                commentary: commentary || undefined,
                dateBirth: dateBirth,
                housePhone: housePhone,
                address: address,
                medicalCondition: medicalCondition || undefined,
                progressDesired: progressDesired || undefined,
                allowedPictures: allowedPictures ? validator.toBool(allowedPictures) : undefined,
                idPediatrician: Number(idPediatrician),
                idFamily: Number(idFamily),
                idCity: Number(idCity),
                idParent: Number(idParent),
                idProgram: Number(idProgram),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

// LISTAR TODOS LOS ESTUDIANTES CON SUS PADRES
router.get('/studentsWithParents', async (req, res) => {

    let studentsWithParents;
    try {
        studentsWithParents = await prisma.student.findMany({
            include: { parent: true },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }
    
    res.status(200).json(resProcessor.concatStatus(200, studentsWithParents));
})

async function validate(status: string, dateBirth: string, housePhone: string, idPediatrician: string, idFamily: string, allowedPictures: string, idCity: string, idParent: string, idProgram: string) {
    
    let message = "";
    if (status && !StatusStudent.includes(status)) {
        message = "Status de estudiante invalido";
        return {result: false, message: message} 
    }
    if (housePhone && !validator.validatePhone(housePhone)) {
        message = "Formato de telefono invalido";
        return {result: false, message: message}
    }
    if (dateBirth && !validator.validateDate(dateBirth)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (allowedPictures && !validator.isBoolean(allowedPictures)) {
        message = "Entrada invalida para 'allowedPictures'";
        return {result: false, message: message}
    }
    if (idFamily && !validator.isNumeric(idFamily)) {
        message = "Id de la familia invalido: No numerico";
        return {result: false, message: message}
    }
    if (idPediatrician && !validator.isNumeric(idPediatrician)) {
        message = "Id del pediatra invalido: No numerico";
        return {result: false, message: message}
    }
    if (idCity && !validator.isNumeric(idCity)) {
        message = "Id de la cuidad invalido: No numerico";
        return {result: false, message: message}
    }
    if (idParent && !validator.isNumeric(idParent)) {
        message = "Id de padre invalido: No numerico";
        return {result: false, message: message}
    }
    if (idProgram && !validator.isNumeric(idProgram)) {
        message = "Id del programa invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;