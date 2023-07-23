import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Staff";
    return errorHandler.checkError(object, error);
}

// // LISTAR STAFF CON PAGINACION DE 10
// router.get('/', async (req, res) => {
//     const { page } = req.query;
//     const pageSize = 10;

//     await routerHandler.getData("staff", pageSize, page, res);
// });

// // LISTAR UN STAFF MEDIANTE ID
// router.get('/:id', async (req, res) => {
//     const { id } = req.params

//     let staff;
//     try {
//         staff = await prisma.staff.findUnique({
//             where: { id: Number(id) },
//         })
//     } catch (error: any) {
//         return res.json(handleError(error));
        
//     } finally {
//         await prisma.$disconnect();
//     }

//     res.status(200).json(resProcessor.concatStatus(200, staff));
// })

// // ELIMINAR UN STAFF MEDIANTE ID
// router.delete('/:id', async (req, res) => {
//     const { id } = req.params

//     let staff;
//     try {
//         staff = await prisma.staff.update({
//             where: { id: Number(id) },
//             data: { deleted: true },
//         })
//     } catch (error: any) {
//         return res.json(handleError(error));
        
//     } finally {
//         await prisma.$disconnect();
//     }

//     res.status(200).json(resProcessor.concatStatus(200, staff));
// })

// // ACTUALIZAR UN STAFF MEDIANTE ID
// router.put('/:id', async (req, res) => {
//     const { id } = req.params
//     const { name, lastName1, lastName2, phone, salary,
//         paymentMethod, position, address, idCity } = req.body

//     const valid = await validate(phone, salary, idCity);
//     if (!valid.result) {
//         return res.json(resProcessor.newMessage(400, valid.message));
//     }

//     let staff;
//     try {
//         staff = await prisma.staff.update({
//             where: { id: Number(id) },
//             data: {
//                 name: name || undefined,
//                 lastName1: lastName1 || undefined,
//                 lastName2: lastName2 || undefined,
//                 phone: phone || undefined,
//                 salary: salary ? parseFloat(salary) : undefined,
//                 paymentMethod: paymentMethod || undefined,
//                 position: position || undefined,
//                 address: address || undefined,
//                 idCity: idCity ? Number(idCity) : undefined,
//             }
//         })
//     } catch (error: any) {
//         return res.json(handleError(error));
        
//     } finally {
//         await prisma.$disconnect();
//     }

//     res.status(200).json(resProcessor.concatStatus(200, staff));
// })

// // CREAR UN NUEVO STAFF
// router.post('/', async (req, res) => {
//     const { name, lastName1, lastName2, phone, salary,
//         paymentMethod, position, address, idCity } = req.body

//     if (!(name && lastName1 && phone && salary && paymentMethod
//         && position && address && idCity)) {
//         return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos'));
//     }

//     const valid = await validate(phone, salary, idCity);
//     if (!valid.result) {
//         return res.json(resProcessor.newMessage(400, valid.message));
//     }

//     let result;
//     try {
//         result = await prisma.staff.create({
//             data: {
//                 name: name,
//                 lastName1: lastName1,
//                 lastName2: lastName2 || undefined,
//                 phone: phone,
//                 salary: parseFloat(salary),
//                 paymentMethod: paymentMethod,
//                 position: position,
//                 address: address,
//                 idCity: Number(idCity),
//             }
//         })
//     } catch (error: any) {
//         return res.json(handleError(error));
        
//     } finally {
//         await prisma.$disconnect();
//     }

//     res.status(200).json(resProcessor.concatStatus(200, result));
// })

async function validate(phone: string, salary: string, idCity: string) {
    
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
    return {result: true}
}

export default router;