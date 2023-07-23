import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Pediatrician";
    return errorHandler.checkError(object, error);
}

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("pediatrician", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let pediatrician;
    try {
        pediatrician = await prisma.pediatrician.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, pediatrician));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let pediatrician;
    try {
        pediatrician = await prisma.pediatrician.update({
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

    res.json(resProcessor.concatStatus(200, pediatrician));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { name, medicalInstitution, officeNumber, phone } = req.body
    
    const valid = await validate(phone);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let pediatrician;
    try {
        pediatrician = await prisma.pediatrician.update({
            where: { id: Number(id) },
            data: {
                name: name || undefined,
                medicalInstitution: medicalInstitution || undefined,
                officeNumber: officeNumber || undefined,
                phone: phone || undefined,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, pediatrician));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { name, medicalInstitution, officeNumber, phone } = req.body
    
    if (!(name && medicalInstitution && officeNumber && phone)) {
        return res.json({ message: 'Faltan datos requeridos' });
    }

    const valid = await validate(phone);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.pediatrician.create({
            data: {
                name: name,
                medicalInstitution: medicalInstitution,
                officeNumber: officeNumber,
                phone: phone,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(phone: string) {
    
    let message = "";
    if (phone && !validator.validatePhone(phone)) {
        message = "Invalid phone number format";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;