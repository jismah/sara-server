/*
    BACKEND SARA PROJECT

    TODO:


    COMMANDS:
        npx ts-node src/index.ts
        npx prisma generate

*/
import express, { NextFunction, Request, Response, Router } from 'express'
import { PrismaClient } from '@prisma/client'
import studentsRouter from './routes/students';
import parentsRouter from './routes/parents';

const app = express()
const prisma = new PrismaClient()

function checkApiKey(req: Request, res: Response, next: NextFunction): void {
    const key: string = req.headers['x-api-key'] as string ?? '';
    findAuthKeyByKey(key).then((found) => {
        // console.log(found);
        if (found) {
            next();
        } else {
            res.status(401).send('Unauthorized');
        }
    })
}

async function findAuthKeyByKey(key: string): Promise<boolean> {
    const foundKey = await prisma.authKey.findUnique({
        where: {
            key,
        },
    });

    return Boolean(foundKey);
}

function logIPAddress(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip;
    console.log(`La dirección IP del cliente es ${ipAddress}`);
    next();
}

app.use(express.json())

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

app.listen(3000, () =>
    console.log('SARA REST API server ready at: http://localhost:3000'),
)