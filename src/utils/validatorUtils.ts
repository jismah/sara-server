import { PrismaClient } from '@prisma/client';

let instance: Validator;

class Validator {
    prisma: any;
    
    constructor() {
        if (instance) {
            throw new Error("New instance cannot be created!!");
        }
        
        this.prisma = new PrismaClient()
        instance = this;
    }

    async isUnique(model: string, field: string, value: any) {
        const existingRecord = await this.prisma[model].findUnique({
            where: {
                [field]: value
            },
            select: {
                id: true
            }
        });
        
        await this.prisma.$disconnect();
        return !existingRecord;
    }

    validatePhone(phone: string) {
        const pattern = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
        return pattern.test(phone);
    }

    validateEmail(email: string) {
        const pattern = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        return pattern.test(email);
    }

    validateCedula(cedula: string) {
        const pattern = /^(\d{11}|\d{3}-\d{7}-\d{1})$/;
        return pattern.test(cedula);
    }

    formatCedula(cedula: string) {
        return cedula.replace(/-/g, '');
    }

    isNumeric(input: string) {
        input = input.trim();
        return /^\d*\.?\d+$/.test(input);
    }

    validateTime(time: string) {
        // Formato: (HH:mm:ss)
        const pattern = /^(?:(?:([01]?\d|2[0-3]):){1}([0-5]?\d):){1}([0-5]?\d)$/;
        return pattern.test(time);
    }

    validateDate(date: string) {
        // Formato: (YYYY-MM-DD)
        const dateformat = /^\d{4}[-](0?[1-9]|1[0-2])[-](0?[1-9]|[1-2][0-9]|3[01])$/;
   
        if (date.match(dateformat)) {
            let operator = date.split('/');
     
            let datepart: string[] = [];
            if (operator.length > 1) {
                datepart = date.split('-');
            }
            let year = parseInt(datepart[0]);
            let month = parseInt(datepart[1]);
            let day = parseInt(datepart[2]);
    
            let ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (month == 1 || month > 2) {
                if (day > ListofDays[month - 1]) {    
                    return false;
                }
            } else if (month == 2) {
                let leapYear = false;
                if ((!(year % 4) && year % 100) || !(year % 400)) leapYear = true;
                if ((leapYear == false) && (day >= 29)) return false;
                else
                    if ((leapYear == true) && (day > 29)) {
                        return false;
                    }
            }
        } else {
            return false;
        }
        return true;
    }

    isBoolean(bool: string) {
        if (bool.toLowerCase() === 'true') {
            return true;
        }
        if (bool.toLowerCase() === 'false') {
            return true;
        }
        return false;
    }

    toBool(bool: string): boolean {
        if (bool.toLowerCase() === 'true') {
            return true;
        }
        if (bool.toLowerCase() === 'false') {
            return false;
        }

        throw new Error("Invalid String given: failed boolean conversion");
    }
      
}

let validator = new Validator();
export default validator;