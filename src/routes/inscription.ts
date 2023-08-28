import { Router } from 'express';
import { PrismaClient } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Inscripciones";
    return errorHandler.checkError(object, error);
}

const StatusStudent = [
    "ENROLLED",
    "REJECTED",
    "WAITLISTED",
    "ACCEPTED_NOT_ENROLLED"
];

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { student, pediatrician, parents, emergencyContacts, tutors } = req.body

    try {
        if (!( student && pediatrician && parents && emergencyContacts && tutors )) {
            return res.json(resProcessor.newMessage(400, 'Faltan objetos requeridos'));
        }

        if (!Array.isArray(tutors) || tutors.length === 0) {
            return res.json(resProcessor.newMessage(400, 'Se requiere al menos 1 tutor'));
        } else {
            for (const tutor of tutors) {
                const valid = validateTutor(tutor);
                if (!valid.result) {
                    return res.json(resProcessor.newMessage(400, valid.message));
                }
            } 
        }

        if (!Array.isArray(emergencyContacts) || emergencyContacts.length === 0) {
            return res.json(resProcessor.newMessage(400, 'Se requiere al menos 1 contacto de emergencia'));
        } else {
            for (const emergencyContact of emergencyContacts) {
                const valid = validateEmergencyContact(emergencyContact);
                if (!valid.result) {
                    return res.json(resProcessor.newMessage(400, valid.message));
                }
            } 
        }

        if (!Array.isArray(parents) || parents.length === 0) {
            return res.json(resProcessor.newMessage(400, 'Se requiere al menos 1 padre'));
        } else {
            for (const parent of parents) {
                const valid = await validateParent(parent);
                if (!valid.result) {
                    return res.json(resProcessor.newMessage(400, valid.message));
                }
            } 
        }

        const validPediatrician = validatePediatrician(pediatrician);
        if (!validPediatrician.result) {
            return res.json(resProcessor.newMessage(400, validPediatrician.message));
        }

        const validStudent = validateStudent(student);
        if (!validStudent.result) {
            return res.json(resProcessor.newMessage(400, validStudent.message));
        }
    } catch (error) {
        return res.json(resProcessor.newMessage(500, "Ocurio un error de validación durante la inscripción"));
    }

    try {
        await prisma.$transaction(async (prisma) => {
            let result;
            const resultPediatrician = await prisma.pediatrician.create({
                data: {
                    name: pediatrician.name.toString(),
                    medicalInstitution: pediatrician.medicalInstitution.toString(),
                    officeNumber: pediatrician.officeNumber.toString(),
                    phone: pediatrician.phone.toString(),
                }
            })
    
            const resultParents = []
            for (const parent of parents) {
                const result = await prisma.parent.create({
                    data: {
                        identityCard: parent.identityCard.toString(),
                        name: parent.name.toString(),
                        lastName1: parent.lastName1.toString(),
                        lastName2: parent.lastName2 ? parent.lastName2.toString() : undefined,
                        telephone: parent.telephone ? parent.telephone.toString() : undefined,
                        email: parent.email.toString().toLowerCase(),
                        occupation: parent.occupation ? parent.occupation.toString() : undefined,
                        verified: false,
                    }
                })
                resultParents.push(result);
            }
    
            const resultStudent = await prisma.student.create({
                data: {
                    name: student.name.toString(),
                    lastName1: student.lastName1.toString(),
                    lastName2: student.lastName2 ? student.lastName2.toString() : undefined,
                    status: "PENDING_CHECK",
                    commentary: student.commentary ? student.commentary.toString() : undefined,
                    dateBirth: student.dateBirth.toString(),
                    housePhone: student.housePhone.toString(),
                    address: student.address.toString(),
                    medicalCondition: student.medicalCondition ? student.medicalCondition.toString() : undefined,
                    progressDesired: student.progressDesired ? student.progressDesired.toString() : undefined,
                    allowedPictures: student.allowedPictures ? validator.toBool(student.allowedPictures.toString()) : undefined,
                    
                    idCity: Number(student.idCity),
                    idProgram: Number(student.idProgram),
                    
                    idPediatrician: Number(resultPediatrician.id),
                    idParent: Number(resultParents[0].id),
                },
            })
    
            const resultEmergencyContacts: any = [];
            for (const emergencyContact of emergencyContacts) {
                const result = await prisma.emergencyContact.create({
                    data: {
                        name: emergencyContact.name.toString(),
                        phone: emergencyContact.phone.toString(),
                        idStudent: Number(resultStudent.id),
                    },
                })
                resultEmergencyContacts.push(result);
            }
    
            const resultTutors: any = [];
            for (const tutor of tutors) {
                const result = await prisma.tutor.create({
                    data: {
                        name: tutor.name,
                        occupation: tutor.occupation ? tutor.occupation : undefined,
                        phone: tutor.phone,
                        idStudent: Number(resultStudent.id),
                    },
                })
                resultTutors.push(result);
            }
    
            result = {
                pediatrician: resultPediatrician,
                parents: resultParents,
                student: resultStudent,
                tutors: resultTutors,
                emergencyContacts: resultEmergencyContacts
            }

            res.status(200).json(resProcessor.concatStatus(200, result));     
        });

    } catch (error) {
        return res.json(handleError(error));
    } finally {
        await prisma.$disconnect();
    }
})

function validatePediatrician(pediatrician: any) {
    let message = "";

    if (!(pediatrician.name?.toString() && pediatrician.medicalInstitution?.toString() && pediatrician.officeNumber?.toString() && pediatrician.phone?.toString())) {
        message = "Faltan datos requeridos para el pediatra";
        return {result: false, message: message}
    }

    if (pediatrician.phone.toString() && !validator.validatePhone(pediatrician.phone.toString())) {
        message = "Formato de telefono de pediatra invalido";
        return {result: false, message: message}
    }
    return {result: true}
}

function validateTutor(tutor: any) {
    let message = "";

    if (!(tutor.name?.toString() && tutor.phone?.toString())) {
        message = "Faltan datos requeridos para uno o más tutores";
        return {result: false, message: message}
    }

    if (tutor.phone.toString() && !validator.validatePhone(tutor.phone.toString())) {
        message = "Formato de telefono de uno o más tutores invalido";
        return {result: false, message: message}
    }
    return {result: true}
}

function validateEmergencyContact(emergencyContact: any) {   
    let message = "";

    if (emergencyContact.phone.toString() && !validator.validatePhone(emergencyContact.phone.toString())) {
        message = "Formato de telefono de uno o más contactos de emergencia invalidos";
        return {result: false, message: message}
    }
    return {result: true}
}

async function validateParent(parent: any) {
    let message = "";

    if (!(parent.identityCard?.toString() && parent.name?.toString() && parent.lastName1?.toString() && parent.email?.toString())) {
        message = "Faltan datos requeridos para uno o más padres";
        return {result: false, message: message}
    }

    if (parent.identityCard.toString() && !(await validator.isUnique("parent", "identityCard", parent.identityCard.toString()))) {
        message = "La identificacion del padre debe ser unica. (identityCard not unique)";
        return {result: false, message: message}
    }
    if (parent.email.toString() && !validator.validateEmail(parent.email.toString())) {
        message = "Formato de email de un padre invalido";
        return {result: false, message: message}
    }
    if (parent.email.toString() && !(await validator.isUnique("parent", "email", parent.email.toString()))) {
        message = "El email de un padre ya esta en uso";
        return {result: false, message: message}
    }
    if (parent.phone.toString() && !validator.validatePhone(parent.phone.toString())) {
        message = "Formato de telefono de uno o más padres invalido";
        return {result: false, message: message}
    }
    return {result: true}
}

function validateStudent(student: any) {
    let message = "";

    if (!(student.name?.toString() && student.lastName1?.toString() && student.status?.toString() && student.dateBirth?.toString() && student.housePhone?.toString() && student.address?.toString() && student.idCity?.toString() && student.idProgram?.toString())) {
        message = "Faltan datos requeridos del estudiante";
        return {result: false, message: message}
    }

    if (student.status.toString() && !StatusStudent.includes(student.status.toString())) {
        message = "Status de estudiante invalido";
        return {result: false, message: message} 
    }
    if (student.housePhone.toString() && !validator.validatePhone(student.housePhone.toString())) {
        message = "Formato de telefono de casa de estudiante invalido";
        return {result: false, message: message}
    }
    if (student.dateBirth.toString() && !validator.validateDate(student.dateBirth.toString())) {
        message = "Formato de fecha de nacimiento de estudiante invalido";
        return {result: false, message: message}
    }
    if (student.allowedPictures.toString() && !validator.isBoolean(student.allowedPictures.toString())) {
        message = "Entrada invalida no boolena para allowedPictures";
        return {result: false, message: message}
    }
    if (student.idCity.toString() && !validator.isNumeric(student.idCity.toString())) {
        message = "Id de la cuidad invalido: No numerico";
        return {result: false, message: message}
    }
    if (student.idProgram.toString() && !validator.isNumeric(student.idProgram.toString())) {
        message = "Id del programa invalido: No numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;