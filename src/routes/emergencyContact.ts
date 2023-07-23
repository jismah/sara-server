import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "EmergencyContact";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("emergencyContact", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params
    
    let emergencyContact;
    try {
        emergencyContact = await prisma.emergencyContact.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, emergencyContact));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let emergencyContact;
    try {
        emergencyContact = await prisma.emergencyContact.update({
            where: { id: Number(id) },
            data: { 
                deleted: true
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, emergencyContact));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { name, phone, idStudent } = req.body;
    const { id } = req.params

    const valid = await validate(phone, idStudent);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let emergencyContact;
    try {
        emergencyContact = await prisma.emergencyContact.update({
            where: { id: Number(id) },
            data: {
                name: name || undefined,
                phone: phone || undefined,
                idStudent: idStudent ? Number(idStudent) : undefined
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, emergencyContact));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { name, phone, idStudent } = req.body;

    if (!(name && phone && idStudent)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(phone, idStudent);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.emergencyContact.create({
            data: {
                name: name,
                phone: phone,
                idStudent: Number(idStudent),
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(phone: string, idStudent: string) {
    
    let message = "";
    if (phone && !validator.validatePhone(phone)) {
        message = "Invalid phone number format";
        return {result: false, message: message}
    }
    if (idStudent && !validator.isNumeric(idStudent)) {
        message = "Id de estudiante invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;