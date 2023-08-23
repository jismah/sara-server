import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';
import encryptor from '../utils/keys/encryptionUtils';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "User";
    return errorHandler.checkError(object, error);
}

const userRoles = ['SUPERADMIN', 'ADMIN', 'USER',
 'ACCOUNTANT', 'PROFESSOR'];

// LISTAR CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("user", pageSize, page, res);
});

// LISTAR MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, user));
})

// Revisar si el usuario esta disponible
router.get('/validate/:username', async (req, res) => {
    const { username } = req.params

    return res.json(resProcessor.concatStatus(200, validator.isUnique("user", "username", username)))
})

// Revisar si el usuario es valido dado un username y password
router.post('/access/:username', async (req, res) => {
    const { username } = req.params
    const { password } = req.body;

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { username: username },
        })

        if (!user) {
            return res.json(resProcessor.concatStatus(200, false));
        }

        if (encryptor.decrypt(user.password) === password) {
            return res.json(resProcessor.concatStatus(200, user));
        }

        return res.json(resProcessor.concatStatus(200, false));
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let user;
    try {
        user = await prisma.user.update({
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

    res.json(resProcessor.concatStatus(200, user));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { username, name, lastName1, lastName2, password,
         email, phone, role, idFamily } = req.body;
    const { id } = req.params;

    const valid = await validate(username, email, role, phone, idFamily);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let user;
    try {
        user = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                username: username || undefined,
                name: name || undefined,
                lastName1: lastName1 || undefined,
                lastName2: lastName2 || undefined,
                password: encryptor.encrypt(password) || undefined,
                email: email ? email.toLowerCase() : undefined,
                phone: phone || undefined,
                role: role || undefined,
                idFamily: idFamily ? Number(idFamily) : undefined
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, user));
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { username, name, lastName1, 
        lastName2, password, email, phone, role } = req.body

    if (!(username && name && lastName1 &&
         password && email && phone && role)) {
            return res.json(resProcessor.newMessage(400, "Faltan datos requeridos"));
    }
    
    const valid = await validate(username, email, role, phone, undefined);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let createdUser;
    try {
        if (role === "USER") {
            createdUser = await prisma.user.create({
                data: {
                username: username,
                name: name,
                lastName1: lastName1,
                lastName2: lastName2 || undefined,
                password: encryptor.encrypt(password),
                email: email.toLowerCase(),
                phone: phone,
                role: role,
                family: {
                        create: {},
                    },
                },
                include: {
                    family: true,
                },
            });
        } else {
            createdUser = await prisma.user.create({
                data: {
                    username: username,
                    name: name,
                    lastName1: lastName1,
                    lastName2: lastName2 || undefined,
                    password: encryptor.encrypt(password),
                    email: email.toLowerCase(),
                    phone: phone,
                    role: role,
                },
            });
        }
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }
    
    res.status(200).json(resProcessor.concatStatus(200, createdUser));
})

async function validate(username: string, email: string, role: string, phone: string, idFamily: string | undefined) {
    
    let message = "";
    if (username && !(await validator.isUnique("user", "username", username))) {
        message = "El usuario debe ser unico";
        return {result: false, message: message}
    }
    if (email && !validator.validateEmail(email)) {
        message = "Formato de email invalido";
        return {result: false, message: message}
    }
    if (email && !(await validator.isUnique("user", "email", email))) {
        message = "El email ya esta en uso";
        return {result: false, message: message}
    }
    if (role && !userRoles.includes(role)) {
        message = "Rol invalido";
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