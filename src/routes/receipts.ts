import { Router } from 'express';
import { PrismaClient, Receipt } from '@prisma/client'
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../handlers/errorHandler';
import routerHandler from '../handlers/routerHandler';
import moment from 'moment'; 
import { Template, BLANK_PDF, generate } from '@pdfme/generator';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient()

function handleError(error: any) {
    const object = "Receipt";
    return errorHandler.checkError(object, error);
}  

async function generatePDF(data: Receipt) {

    let base64String;
    try {
        base64String = fs.readFileSync('src\\media\\strippedBasePdf.txt', 'utf-8');
    } catch (error: any) {
        console.error('Error reading basepdf.txt:', error);
        throw Error(error)
    }

    const template: Template = {
        basePdf: base64String,
        schemas: [{
            "id": {
                "type": "text",
                "position": {
                "x": 174.36,
                "y": 21.18
                },
                "width": 21.24,
                "height": 5.41,
                "alignment": "right",
                "fontSize": 9,
                "characterSpacing": 0,
                "lineHeight": 1,
                "fontName": "Roboto",
                "verticalAlignment": "middle"
            },
            "date": {
                "type": "text",
                "position": {
                "x": 166.63,
                "y": 53.67
                },
                "width": 25.74,
                "height": 5.41,
                "alignment": "right",
                "fontSize": 10,
                "characterSpacing": 0,
                "lineHeight": 1,
                "fontName": "Roboto",
                "verticalAlignment": "middle"
            },
            "amount": {
                "type": "text",
                "position": {
                "x": 160.00,
                "y": 75.73
                },
                "width": 25.74,
                "height": 5.41,
                "alignment": "left",
                "fontSize": 10,
                "characterSpacing": 0,
                "lineHeight": 1,
                "fontName": "Roboto",
                "verticalAlignment": "middle"
            },
            "name": {
                "type": "text",
                "position": {
                "x": 58.05,
                "y": 65.73
                },
                "width": 96.91,
                "height": 5.41,
                "alignment": "left",
                "fontSize": 12,
                "characterSpacing": 0,
                "lineHeight": 1,
                "fontName": "Roboto",
                "verticalAlignment": "middle"
            },
            "textAmount": {
                "type": "text",
                "position": {
                "x": 58.78,
                "y": 75.73
                },
                "width": 96.64,
                "height": 5.41,
                "alignment": "left",
                "fontSize": 10,
                "characterSpacing": 0,
                "lineHeight": 1,
                "fontName": "Roboto",
                "verticalAlignment": "middle"
            },
            "concept": {
                "type": "text",
                "position": {
                "x": 57.68,
                "y": 87.06
                },
                "width": 96.64,
                "height": 10.7,
                "alignment": "left",
                "fontSize": 10,
                "characterSpacing": 0,
                "lineHeight": 1.3,
                "fontName": "Roboto",
                "verticalAlignment": "top"
            },
            "efectivoSelected": {
                "type": "image",
                "position": {
                "x": 24.35,
                "y": 106.91
                },
                "width": 11.97,
                "height": 5.12,
            },
            "depositoSelected": {
                "type": "image",
                "position": {
                "x": 24.3,
                "y": 115.05
                },
                "width": 12.24,
                "height": 5.12,
            },
            "transferenciaSelected": {
                "type": "image",
                "position": {
                "x": 24.24,
                "y": 122.68
                },
                "width": 12.24,
                "height": 5.38,
            }
            },
        ],
    };

    const selected = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAOCAYAAACl66WxAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABESURBVHgB7dWxEQAQFIPhcDYwCZU93RmLSczAPX1qr8hXpP67hNbHgRPJJpeK3/aaiHBEMYxiGMUwimEUw7xvsl/w4AI/TwgK35yjsgAAAABJRU5ErkJggg==";
    
    const inputs = [
    {
        "id": "#" + data.id.toString(),
        "date": moment(data.date).format('DD/MM/yyyy'),
        "amount": data.amount.toLocaleString('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        "name": data.nameFrom.toUpperCase(),
        "textAmount": data.textAmount.toUpperCase(),
        "concept": data.concept.toUpperCase(),
        "efectivoSelected": data.method === 'Efectivo' ? selected : '',
        "depositoSelected": data.method === 'Deposito en Cuenta' ? selected : '',
        "transferenciaSelected": data.method === 'Transferencia Bancaria' ? selected : '',
    }
    ];

    const pdfBuffer = await generate({ template, inputs });
    const pdfFilePath = path.join('src\\media', 'test.pdf');
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    return pdfFilePath;
}

router.get('/pdf/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await prisma.receipt.findUnique({
            where: { 
                id: Number(id)
            },
        });

        if (!result) {
            return res.status(400).json(resProcessor.newMessage(400, `No se encontro el recibo con id #${Number(id)}`));
        }

        const pdfFilePath = await generatePDF(result); // Generate PDF and get the file path

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt.pdf"`);

        const pdfStream = fs.createReadStream(pdfFilePath);
        pdfStream.pipe(res);

        pdfStream.on('end', () => {
            fs.unlinkSync(pdfFilePath); // Delete the temporary file after sending
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json(resProcessor.newMessage(500, `Ocurrio un error inesperado al generar el pdf para el recibo #${Number(id)}`));
    } finally {
        await prisma.$disconnect();
    }
});


// LISTAR POR FECHA
router.get('/:idFamily', async (req, res) => {
    const { idFamily } = req.params;
    let { year, month, day } = req.query;

    if (!year || !validator.isNumeric(year.toString())) {
        year = moment().format('yyyy')
    }
    if (!month || !validator.isNumeric(month.toString())) {
        month = moment().format('MM')
    } else {
        month = month.toString().padStart(2, '0');
    }
    if (!day || !validator.isNumeric(day.toString())) {
        day = moment().format('DD')
    } else {
        day = day.toString().padStart(2, '0');
    }

    let results;
    try {
        results = await prisma.receipt.findMany({
            where: {
                idFamily: Number(idFamily.toString()),
                date: `${year}-${month}-${day}`,
                deleted: false,
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, results));
});

// LISTAR MEDIANTE ID
router.get('/family/:idFamily', async (req, res) => {
    const { idFamily } = req.params

    let result;
    try {
        result = await prisma.receipt.findMany({
            where: { 
                idFamily: Number(idFamily),
                deleted: false 
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, result, result.length));
})

// ELIMINAR (LOGICO) MEDIANTE ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params

    let result;
    try {
        result = await prisma.receipt.update({
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

    res.json(resProcessor.concatStatus(200, result));
})

// ACTUALIZAR MEDIANTE ID
router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { date, nameFrom, amount, textAmount, concept, method, idFamily } = req.body

    const valid = await validate(date.toString(), amount.toString(), idFamily.toString());
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }
    
    let result;
    try {
        result = await prisma.receipt.update({
            where: { id: Number(id) },
            data: {
                date: date ? date.toString() : undefined,
                nameFrom: nameFrom ? nameFrom.toString(): undefined,
                amount: amount ? parseFloat(parseFloat(amount).toFixed(2)) : undefined,
                textAmount: textAmount ? textAmount.toString() : undefined,
                concept: concept ? concept.toString() : undefined,
                method: method ? method.toString() : undefined,
                idFamily: idFamily ? Number(idFamily.toString()) : undefined
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.json(resProcessor.concatStatus(200, result)); 
})

// CREAR NUEVO RECORD
router.post('/', async (req, res) => {
    const { date, nameFrom, amount, textAmount, concept, method, idFamily } = req.body

    if (!(date && nameFrom && amount && textAmount && concept && method && idFamily)) {
        return res.json(resProcessor.newMessage(400, 'Faltan datos requeridos' ));
    }

    const valid = await validate(date.toString(), amount.toString(), idFamily.toString());
    if (!valid.result) {
        return res.json(resProcessor.newMessage(400, valid.message));
    }

    let result;
    try {
        result = await prisma.receipt.create({
            data: {
                date: date.toString(),
                nameFrom: nameFrom.toString(),
                amount: parseFloat(parseFloat(amount).toFixed(2)),
                textAmount: textAmount.toString(),
                concept: concept.toString(),
                method: method.toString(),
                idFamily: Number(idFamily.toString())
            },
        })
    } catch (error: any) {
        return res.json(handleError(error));
        
    } finally {
        await prisma.$disconnect();
    }

    res.status(200).json(resProcessor.concatStatus(200, result));
})

async function validate(date: string, amount: string, idFamily: string) {
    
    let message = "";
    if (date && !validator.validateDate(date)) {
        message = "Formato de fecha invalido";
        return {result: false, message: message}
    }
    if (amount && !validator.isNumeric(amount)) {
        message = "Monto invalido: No numerico";
        return {result: false, message: message}
    }
    if (idFamily && !validator.isNumeric(idFamily)) {
        message = "Id de familia no numerico";
        return {result: false, message: message}
    }
    return {result: true}
}

export default router;