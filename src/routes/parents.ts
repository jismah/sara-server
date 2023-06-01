import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Parents";
    return errorHandler.checkError(object, error);
}

// LISTAR PADRES CON PAGINACION DE 10
router.get('/', async (req, res) => {

    let parents;
    try {
        parents = await prisma.parent.findMany({
            where: { deleted: false},
            take: 10,
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, parents));
})

// LISTAR UN PADRE MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let parent;
    try {
        parent = await prisma.parent.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, parent));
})

// ELIMINAR UN PADRE MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let parent;
    try {
        parent = await prisma.parent.update({
            where: { id: Number(id) },
            data: { deleted: true },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, parent));
})

// ACTUALIZAR UN PADRE MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { identityCard, name, lastName1, lastName2,
        telephone, email, occupation, idFamily} = req.body

    const valid = await validate(identityCard, email, telephone, idFamily);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let parent;
    try {
        parent = await prisma.parent.update({
            where: { id: Number(id) },
            data: {
                identityCard: identityCard || undefined,
                name: name || undefined,
                lastName1: lastName1 || undefined,
                lastName2: lastName2 || undefined,
                telephone: telephone || undefined,
                email: email || undefined,
                occupation: occupation || undefined,
                idFamily: idFamily ? Number(idFamily) : undefined,
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, parent));
})

// CREAR UN NUEVO PADRE
router.post('/', async (req, res) => {
    const { identityCard, name, lastName1, lastName2,
         telephone, email, occupation, idFamily} = req.body

    if (!(identityCard && name && lastName1
        && email && idFamily)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(identityCard, email, telephone, idFamily);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.parent.create({
            data: {
                identityCard: identityCard,
                name: name,
                lastName1: lastName1,
                lastName2: lastName2 || undefined,
                telephone: telephone || undefined,
                email: email,
                occupation: occupation || undefined,
                idFamily: Number(idFamily),
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(identityCard: string, email: string, phone: string, idFamily: string) {
    
    let message = "";
    if (identityCard && !(await validator.isUnique("parent", "identityCard", identityCard))) {
        message = "La identificacion del padre debe ser unica. (identityCard not unique)";
        return {result: false, message: message}
    }
    if (email && !validator.validateEmail(email)) {
        message = "Formato de email invalido";
        return {result: false, message: message}
    }
    if (email && !(await validator.isUnique("parent", "email", email))) {
        message = "El email ya esta en uso";
        return {result: false, message: message}
    }
    if (phone && !validator.validatePhone(phone)) {
        message = "Formato de telefono invalido";
        return {result: false, message: message}
    }
    if (idFamily && !validator.isNumeric(idFamily)) {
        message = "Id de la familia invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;