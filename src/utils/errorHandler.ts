import { PrismaClientInitializationError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import resProcessor from '../utils/responseProcessor';

let instance: ErrorHandler;

class ErrorHandler {
    constructor() {
        if (instance) {
            throw new Error("New instance of errorHandler cannot be created");
        }
        
        instance = this;
    } 

    checkError(object: string, error: any) {
        console.log(error);
        
        if (error.code === 'P2003') {
            return this.badIdError(object);
        }
        if (error.code === 'P2025') {
            return this.recordNotFound(object);
        }
        if (error instanceof PrismaClientValidationError) {
            return this.badDataError(object);
        }
        if (error instanceof PrismaClientInitializationError) {
            return this.cantConnectError(object);
        }
        return resProcessor.newMessage(500, "Ocurrió un error en una operacion de: [" + object + "]");
    }

    cantConnectError(object: string) {
        return resProcessor.newMessage(500, "[" + object + "] " + "Ocurrio un error al conectarse con la base de datos. Verifique su conexión.");
    }

    badIdError(object: string) {
        return resProcessor.newMessage(400, "[" + object + "] " + "Se recibio un Id invalido en la data");
    }

    badDataError(object: string) {
        return resProcessor.newMessage(400, "[" + object + "] " + "PrismaClientValidationError: Se recibio data erronea. Verifique el id del objeto.");
    }

    recordNotFound(object: string) {
        return resProcessor.newMessage(500, "[" + object + "] " + "Una operación falló porque depende de uno o más registros que se requirieron pero no se encontraron.");
    }  
}

let errorHandler = new ErrorHandler();
export default errorHandler;