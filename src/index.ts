/*
    BACKEND SAYA PROJECT

    COMMANDS:
        npx ts-node src/index.ts
        npx prisma generate

    API KEY Ex:
        x-api-key: e923ad05-f9a2-4a4e-887c-20cef3daefdc

*/
import express, { NextFunction, Request, Response, Router } from 'express'
import cors from 'cors';
import { PrismaClient } from '@prisma/client'
import studentsRouter from './routes/students';
import parentsRouter from './routes/parents';
import tutorsRouter from './routes/tutor';
import usersRouter from './routes/user';
import weekDaysRouter from './routes/weekday';
import professorsRouter from './routes/professor';
import productsRouter from './routes/product';
import academicYearsRouter from './routes/AcademicYear';
import activitiesRouter from './routes/activity';
import campsRouter from './routes/camp';
import citiesRouter from './routes/city';
import detailOrderRouter from './routes/detailOrder';
import detailSaleRouter from './routes/detailSale';
import emergencyContactRouter from './routes/emergencyContact';
import evaluationRouter from './routes/evaluation';
import familyRouter from './routes/family';
import invoiceRouter from './routes/invoice';
import objetivesRouter from './routes/objectives';
import orderRouter from './routes/order';
import groupOnCampRouter from './routes/GroupOnCamp';
import paymentRouter from './routes/payment';
import pediatricianRouter from './routes/pediatrician';
import programsRouter from './routes/Program';
import staffRouter from './routes/staff';
import saleRouter from './routes/sale';
import shiftsRouter from './routes/shift';
import professorsForGroupRouter from './routes/professorsForGroup';
import studentOnGroupRouter from './routes/studentOnGroup';
import groupRouter from './routes/group';
import nominaRouter from './routes/nomina';

import errorHandler from './handlers/errorHandler';

const app = express()
const PORT = 3000
const prisma = new PrismaClient()

const corsOptions = {
    origin: '*',
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function checkApiKey(req: Request, res: Response, next: NextFunction): void {
    const key: string = req.headers['x-api-key'] as string ?? '';
    findAuthKeyByKey(key).then((found) => {
        if (found) {
            next();
        } else {
            res.status(401).send('Unauthorized');
        }
    })
}

async function findAuthKeyByKey(key: string): Promise<boolean> {
    let foundKey;
    try {
        foundKey = await prisma.authKey.findUnique({
            where: {
                key,
            },
        });
    } catch (error: any) {
        errorHandler.checkError("AuthKey", error);
        return false;
    } finally {
        await prisma.$disconnect();
    }

    return Boolean(foundKey);
}

function logIPAddress(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip;
    console.log(`La dirección IP del cliente es ${ipAddress}`);
    next();
}

app.get('/', async (req, res) => {
    res.send('Welcome to RestAPI - Sara Project')
})

// Router para las rutas protegidas
const protectedRoutes: Router = express.Router();
protectedRoutes.use(checkApiKey);

// Rastrea IP de las peticiones
app.use(logIPAddress);

// Agregar el path de rutas protegidas
app.use('/api', protectedRoutes);

app.use('/api/students', studentsRouter);
app.use('/api/parents', parentsRouter);
app.use('/api/tutors', tutorsRouter);
app.use('/api/users', usersRouter);
app.use('/api/weekdays', weekDaysRouter);
app.use('/api/professors', professorsRouter);
app.use('/api/products', productsRouter);
app.use('/api/programs', programsRouter);

app.use('/api/academicYears', academicYearsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/camps', campsRouter);
app.use('/api/cities', citiesRouter);

app.use('/api/detailsOrder', detailOrderRouter);
app.use('/api/detailsSale', detailSaleRouter);

app.use('/api/emergencyContacts', emergencyContactRouter);
app.use('/api/evaluations', evaluationRouter);
app.use('/api/family', familyRouter);
app.use('/api/groupOnCamp', groupOnCampRouter);

app.use('/api/invoices', invoiceRouter);
app.use('/api/objetives', objetivesRouter);
app.use('/api/orders', orderRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/pediatricians', pediatricianRouter);

app.use('/api/staff', staffRouter);
app.use('/api/sales', saleRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/professorsForGroup', professorsForGroupRouter);
app.use('/api/studentOnGroup', studentOnGroupRouter);
app.use('/api/groups', groupRouter);

app.use('/api/nomina', nominaRouter);

app.listen(PORT, () =>
    console.log(`SARA REST API server ready at: http://localhost:${PORT}`),
)