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
    const object = "Staff";
    return errorHandler.checkError(object, error);
}

// LISTAR STAFF CON PAGINACION DE 10
router.get('/', async (req, res) => {
    const { page } = req.query;
    const pageSize = 10;

    await routerHandler.getData("staff", pageSize, page, res);
});

// Obtener información bancaria mediante id
router.get('/bank/:id', async (req, res) => {
    const { id } = req.params

    let staff;
    let info;
    try {
        staff = await prisma.staff.findUnique({
            where: { id: Number(id) },
        })

        if (!staff) {
            return resProcessor.newMessage(400, `El empleado con id [${id}] no fue encontrado`)
        }

        let bankAccount;
        try {
            bankAccount = encryptor.decrypt(staff.bankAccount)
        } catch (error: any) {
            return resProcessor.newMessage(500, `Hubo un error al buscar la cuenta bancaria del empleado: ${staff.name + " " + staff.lastName1}`);
        }

        info = {
            id: staff.id,
            bankRoute: staff.bankRoute,
            bankAccount: bankAccount,
            accountType: staff.AccountType,
            accountCurrency: staff.currency,
        }

    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, info));
})

// LISTAR UN STAFF MEDIANTE ID
router.get('/:id', async (req, res) => {
    const { id } = req.params

    let staff;
    try {
        staff = await prisma.staff.findUnique({
            where: { id: Number(id) },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    if (staff) {
        res.status(200).json(resProcessor.concatStatus(200, staff));
    } else {
        res.status(200).json(resProcessor.concatStatus(400, staff));
    }
})

// LISTAR UN STAFF MEDIANTE CEDULA
router.get('/cedula/:cedula', async (req, res) => {
    const { cedula } = req.params

    let staff;
    try {
        staff = await prisma.staff.findUnique({
            where: { cedula: cedula },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, staff));
})

// ELIMINAR UN STAFF MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let staff;
    try {
        staff = await prisma.staff.update({
            where: { id: Number(id) },
            data: { status: false, deleted: true },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, staff));
})

// ACTUALIZAR UN STAFF MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { name, lastName1, lastName2, phone, salary, email, position, address, idCity, dateBirth, dateStart, dateFinish, status, cedula, bankAccount, AccountType, currency, bankRoute } = req.body

    const valid = await validate(phone, salary, idCity, email, dateBirth, dateStart, dateFinish, cedula, status);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let staff;
    try {
        staff = await prisma.staff.update({
            where: { id: Number(id) },
            data: {
                name: name || undefined,
                lastName1: lastName1 || undefined,
                lastName2: lastName2 || undefined,
                phone: phone || undefined,
                salary: salary ? parseFloat(salary) : undefined,
                position: position || undefined,
                address: address || undefined,
                email: email ? email.toLowerCase() : undefined,

                dateBirth: dateBirth || undefined,
                dateStart: dateStart || undefined,
                dateFinish: dateFinish || undefined,

                status: status ? validator.toBool(status) : undefined,
                cedula: cedula ? validator.formatCedula(cedula) : undefined,
                idCity: idCity ? Number(idCity) : undefined,

                bankAccount: bankAccount ? encryptor.encrypt(bankAccount) : undefined,
                AccountType: AccountType || undefined,
                currency: currency || undefined,
                bankRoute: bankRoute || undefined,
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, staff));
})

// CREAR UN NUEVO STAFF
router.post('/', async (req, res) => {
    const { name, lastName1, lastName2, phone, salary, email, position, address, idCity, dateBirth, dateStart, dateFinish, status, cedula, bankAccount, AccountType, currency, bankRoute } = req.body

    if (!(name && lastName1 && phone && salary && email && position && address && idCity && dateBirth && dateStart && status && cedula && bankAccount && AccountType && currency && bankRoute)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
    }

    const valid = await validate(phone, salary, idCity, email, dateBirth, dateStart, dateFinish, cedula, status);
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.staff.create({
            data: {
                name: name,
                lastName1: lastName1,
                lastName2: lastName2 || undefined,
                phone: phone,
                salary: parseFloat(salary),
                position: position,
                address: address,
                email: email.toLowerCase(),

                dateBirth: dateBirth,
                dateStart: dateStart,
                dateFinish: dateFinish || undefined,

                status: validator.toBool(status),
                cedula: validator.formatCedula(cedula),
                idCity: Number(idCity),

                bankAccount: encryptor.encrypt(bankAccount),
                AccountType: AccountType,
                currency: currency,
                bankRoute: bankRoute,
            }
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(phone: string, salary: string, idCity: string, email: string, dateBirth: string, dateStart: string, dateFinish: string, cedula: string, status: string) {
    
    let message = "";
    if (phone && !validator.validatePhone(phone)) {
        message = "Formato de telefono invalido";
        return {result: false, message: message}
    }
    if (salary && !validator.isNumeric(salary)) {
        message = "El salario recibio un dato no numerico";
        return {result: false, message: message}
    }
    if (idCity && !validator.isNumeric(idCity)) {
        message = "Id de cuidad invalido: No numerico";
        return {result: false, message: message}
    }
    if (email && !validator.validateEmail(email)) {
        message = "Formato de email invalido";
        return {result: false, message: message}
    }
    if (email && !(await validator.isUnique("staff", "email", email))) {
        message = "El email ya esta en uso";
        return {result: false, message: message}
    }
    if (dateBirth && !validator.validateDate(dateBirth)) {
        message = "Formato de fecha de nacimineto invalido";
        return {result: false, message: message}
    }
    if (dateStart && !validator.validateDate(dateStart)) {
        message = "Formato de fecha de inicio invalido";
        return {result: false, message: message}
    }
    if (dateFinish && !validator.validateDate(dateFinish)) {
        message = "Formato de fecha de fin invalido";
        return {result: false, message: message}
    }
    if (cedula && !validator.validateCedula(cedula)) {
        message = "Formato erroneo de cedula";
        return {result: false, message: message}
    }
    if (cedula && !(await validator.isUnique("staff", "cedula", cedula))) {
        message = "La cedula del empleado debe ser unica. Esta cedula ya esta en uso.";
        return {result: false, message: message}
    }
    if (status && !validator.isBoolean(status)) {
        message = "Entrada invalida para 'status'";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;