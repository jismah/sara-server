import { PrismaClient, Prisma } from '@prisma/client';
import validator from '../utils/validatorUtils';
import resProcessor from '../utils/responseProcessor';
import errorHandler from '../utils/errorHandler';

class RouterHandler {
    prisma = new PrismaClient();

    models: Record<string, any> = {
        student: this.prisma.student,
        professor: this.prisma.professor,
        parent: this.prisma.parent,
        family: this.prisma.family,
        tutor: this.prisma.tutor,
        emergencyContact: this.prisma.emergencyContact,
        pediatrician: this.prisma.pediatrician,
        payment: this.prisma.payment,
        product: this.prisma.product,
        invoice: this.prisma.invoice,
        sale: this.prisma.sale,
        detailSale: this.prisma.detailSale,
        order: this.prisma.order,
        detailOrder: this.prisma.detailOrder,
        program: this.prisma.program,
        objectives: this.prisma.objectives,
        evaluation: this.prisma.evaluation,
        staff: this.prisma.staff,
        user: this.prisma.user,
        city: this.prisma.city,
        shift: this.prisma.shift,
        weekDay: this.prisma.weekDay,
        group: this.prisma.group,
        professorsForGroup: this.prisma.professorsForGroup,
        studentOnGroup: this.prisma.studentOnGroup,
        groupOnCamp: this.prisma.groupOnCamp,
        academicYear: this.prisma.academicYear,
        camp: this.prisma.camp
    };
    
    handleError(error: any, object: string) {
        return errorHandler.checkError(object, error);
    }

    async getData(modelName: string, pageSize: number, page: any, res: any) {
        let page_int = page && validator.isNumeric(page.toString()) ? Number(page) : 1;
        if (page_int <= 0) {
            page_int = 1
        }

        const offset = (page_int - 1) * pageSize;

        let total;
        let data;

        const model = this.models[modelName];
        if (!model) {
            return res.json(errorHandler.modelNotFound(modelName));
        }

        try {
            data = await model.findMany({
                where: { deleted: false },
                take: pageSize,
                skip: offset,
            });
            
            total = await model.count({
                where: { deleted: false },
            });
        } catch (error) {
            return res.json(this.handleError(error, modelName));
        } finally {
            await this.prisma.$disconnect();
        }

        res.json(resProcessor.concatStatus(200, data, total));
    }
}

let handler = new RouterHandler();
export default handler;
