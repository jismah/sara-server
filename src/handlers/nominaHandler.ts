import { Nomina, PrismaClient } from '@prisma/client';
import resProcessor from '../utils/responseProcessor';
import errorHandler from './errorHandler';
import encryptor from '../utils/keys/encryptionUtils';

let instance: NominaHanlder;

class NominaHanlder {
    prisma = new PrismaClient()
    page_size = 12;

    constructor() {
        if (instance) {
            throw new Error("New instance of NominaHanlder cannot be created");
        }
        
        instance = this;
    }

    handleError(error: any) {
      return errorHandler.checkError("Nonima", error);
    }
    
    async getStaffDetails(staffId: number) {
      return this.prisma.staff.findUnique({
        where: {
          id: staffId,
        },
      });
    }

    async countNominas(year: string): Promise<number> {
      const nominasCount = await this.prisma.nomina.count({
        where: {
          deleted: false,
          date: {
            startsWith: year,
          },
        },
      });
    
      return nominasCount;
    }

    async getNominasInYear(year: string, startMonth?: string, endMonth?: string): Promise<Nomina[]> {
      const nominas = await this.prisma.nomina.findMany({
        where: {
          deleted: false,
          date: {
            startsWith: year,
            lte: `${year}-${endMonth || '12'}-31`,
            gte: `${year}-${startMonth || '01'}-01`,
          },
        },
      });

      return nominas
    }

    async getNominaTotals(id: number) {
      const totals = await this.prisma.detailNomina.groupBy({
        by: ["idNomina"],
        _sum: {
          salary: true,
          overtimePay: true,
          sfs: true,
          afp: true,
          loans: true,
          other: true,
          total: true,
        },
        where: {
          deleted: false,
          idNomina: id,
        },
      });
      
      if (totals.length === 0 || !totals[0]._sum) {
        return {
          salary: 0,
          overtimePay: 0,
          sfs: 0,
          afp: 0,
          loans: 0,
          other: 0,
          total: 0,
        };
      }
    
      const sum = totals[0]._sum;

      const roundedTotals = {
        salary: sum.salary ? parseFloat(sum.salary.toFixed(2)) : 0,
        overtimePay: sum.overtimePay ? parseFloat(sum.overtimePay.toFixed(2)) : 0,
        sfs: sum.sfs ? parseFloat(sum.sfs.toFixed(2)) : 0,
        afp: sum.afp ? parseFloat(sum.afp.toFixed(2)) : 0,
        loans: sum.loans ? parseFloat(sum.loans.toFixed(2)) : 0,
        other: sum.other ? parseFloat(sum.other.toFixed(2)) : 0,
        total: sum.total ? parseFloat(sum.total.toFixed(2)) : 0,
      };
    
      return roundedTotals;
    }

    async getTotalsByDate(year: string, month: string) {
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
    
      const totals = await this.prisma.detailNomina.groupBy({
        by: ["date"],
        _sum: {
          salary: true,
          overtimePay: true,
          sfs: true,
          afp: true,
          loans: true,
          other: true,
          total: true,
        },
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    
      const aggregatedTotals = {
        salary: 0,
        overtimePay: 0,
        sfs: 0,
        afp: 0,
        loans: 0,
        other: 0,
        total: 0,
      };
    
      for (const total of totals) {
        aggregatedTotals.salary += total._sum.salary ? total._sum.salary : 0;
        aggregatedTotals.overtimePay += total._sum.overtimePay ? total._sum.overtimePay : 0;
        aggregatedTotals.sfs += total._sum.sfs ? total._sum.sfs : 0;
        aggregatedTotals.afp += total._sum.afp ? total._sum.afp : 0;
        aggregatedTotals.loans += total._sum.loans ? total._sum.loans : 0;
        aggregatedTotals.other += total._sum.other ? total._sum.other : 0;
        aggregatedTotals.total += total._sum.total ? total._sum.total : 0;
      }
    
      return aggregatedTotals;
    }

    async getYearlyTotalsForStaff(idStaff: number, year: string) {
      const totals = await this.prisma.detailNomina.groupBy({
        by: ["idStaff"],
        _sum: {
          salary: true,
          overtimePay: true,
          sfs: true,
          afp: true,
          loans: true,
          other: true,
          total: true,
        },
        where: {
          deleted: false,
          idStaff: idStaff,
          date: {
            startsWith: year,
          },
        },
      });
      
      if (totals.length === 0 || !totals[0]._sum) {
        return {
          salary: 0,
          overtimePay: 0,
          sfs: 0,
          afp: 0,
          loans: 0,
          other: 0,
          total: 0,
        };
      }
    
      const sum = totals[0]._sum;

      const roundedTotals = {
        salary: sum.salary ? parseFloat(sum.salary.toFixed(2)) : 0,
        overtimePay: sum.overtimePay ? parseFloat(sum.overtimePay.toFixed(2)) : 0,
        sfs: sum.sfs ? parseFloat(sum.sfs.toFixed(2)) : 0,
        afp: sum.afp ? parseFloat(sum.afp.toFixed(2)) : 0,
        loans: sum.loans ? parseFloat(sum.loans.toFixed(2)) : 0,
        other: sum.other ? parseFloat(sum.other.toFixed(2)) : 0,
        total: sum.total ? parseFloat(sum.total.toFixed(2)) : 0,
      };
    
      return roundedTotals;
    }    

    async getByStaff(idStaff: number, year: string, month?: string) {
      let date;
      if (!month || Number(month) <= 0 || Number(month) > 12) {
        date = `${year}`
      } else {
        date = `${year}-${month}`
      }

      const nominas = await this.prisma.detailNomina.findMany({
        where: {
          deleted: false,
          idStaff: idStaff,
          date: {
            startsWith: date
          },
        },
      });

      const totals = await this.getYearlyTotalsForStaff(idStaff, year);
      
      return resProcessor.concatStatus(200, {nominas: nominas, totals: totals}, nominas.length)
    }
    
    // detail = True, incluye los objetos DetailNomina relacionados
    // detail = False, incluye los totales de DetailNomina
    async getById(id: number, detail: Boolean) {
      let nomina;

      try {
        if (detail) {
          nomina = await this.prisma.nomina.findUnique({
            where: {
              id: id,
            },
            include: {
              DetailNomina: true,
            },
          });

          return resProcessor.concatStatus(200, nomina);

        } else {
          const [nomina, totals] = await Promise.all([
            this.prisma.nomina.findUnique({
              where: {
                id,
              },
            }),
            this.getNominaTotals(id),
          ]);
          
          if (!nomina) {
            return errorHandler.objectNotFound("Nomina");
          } else {
            const response = {
              id: nomina.id,
              date: nomina.date,
              type: nomina.type,
              totals: totals,
            };
            
            return resProcessor.concatStatus(200, response);
          }
        }
      } catch (error) {
        return this.handleError(error);
      } finally {
        await this.prisma.$disconnect();
      }
    }

    getMonthRange(page: number, entries: number, asNumber?: boolean) {
      const start = (((page - 1) * this.page_size) / entries ) + 1
      const startMonth = start.toString().padStart(2, '0');

      const end = (this.page_size / entries) + (start - 1)
      const endMonth = end.toString().padStart(2, '0');

      if (asNumber) {
        return { startNum: start, endNum: end }
      } else {
        return { start: startMonth, end: endMonth}   
      }
    }

    // Could return less than the page_size if the months are not all filled
    async getQuincenal(year: string, page?: number) {
      if (!page || page <= 0) {
        page = 1
      }

      const { start: startMonth, end: endMonth } = this.getMonthRange(page, 2);

      try {
        const nominas = await this.getNominasInYear(year, startMonth, endMonth);
    
        const quincenales = [];
    
        for (const nomina of nominas) {
          const totals = await this.getNominaTotals(nomina.id);
          const response = {
            id: nomina.id,
            date: nomina.date,
            type: nomina.type,
            totals: totals,
          };
          quincenales.push(response);
        }
        
        return resProcessor.concatStatus(200, quincenales, quincenales.length);

      } catch (error) {
        return this.handleError(error);
      } finally {
        await this.prisma.$disconnect();
      }
    }

    async getAllQuincenal(year: string) {
      try {
        const nominas = await this.getNominasInYear(year);
    
        const quincenales = [];
    
        for (const nomina of nominas) {
          const totals = await this.getNominaTotals(nomina.id);
          const response = {
            id: nomina.id,
            date: nomina.date,
            type: nomina.type,
            totals: totals,
          };
          quincenales.push(response);
        }
        
        return resProcessor.concatStatus(200, quincenales, quincenales.length);

      } catch (error) {
        return this.handleError(error);
      } finally {
        await this.prisma.$disconnect();
      }
    }

    async getMonthly(year: string, page?: number) {
      if (!page || page <= 0) {
        page = 1
      }

      const { startNum: start = 0, endNum: end = 0 } = this.getMonthRange(page, 1, true);

      try {    
        const mensuales = [];
    
        for (let i = start; i <= end ; i++) {
          const month = i.toString().padStart(2, '0');
          const response = {
            month: month,
            totals: await this.getTotalsByDate(year.toString(), month)
          }
          mensuales.push(response)
        }
        
        return resProcessor.concatStatus(200, mensuales, mensuales.length);

      } catch (error) {
        return this.handleError(error);
      } finally {
        await this.prisma.$disconnect();
      }
    }
  
    async getBankDoc(nominaId: number, accountType: string, accountCurrency: string, accountNumber: string) {
      try {
        const nomina = await this.prisma.nomina.findUnique({
          where: {
            id: nominaId,
          },
          include: {
            DetailNomina: {
              select: {
                idStaff: true,
                total: true,
              },
            },
          },
        });

        if (!nomina) {
          return errorHandler.objectNotFound("Nomina")
        }
    
        const docParts = [];
    
        for (const detail of nomina.DetailNomina) {
          const staff = await this.getStaffDetails(detail.idStaff);
          if (!staff) {
            return errorHandler.recordNotFound("Nomina - Staff")
          }
    
          const accFrom = `${accountType},${accountCurrency},${accountNumber},`;

          let bankAccount;
          try {
            bankAccount = encryptor.decrypt(staff.bankAccount)
          } catch (error: any) {
            return resProcessor.newMessage(500, `Hubo un error al buscar la cuenta bancaria del empleado: ${staff.name + " " + staff.lastName1}`);
          }

          const staffDetails = [
            staff.bankRoute,
            staff.AccountType,
            bankAccount,
            detail.total,
            `${staff.name} ${staff.lastName1}${staff.lastName2 ? ' ' + staff.lastName2 : ''}`,
            `cedula,${staff.cedula}`,
            `Pago nomina para la fecha ${nomina.date}`,
          ];
    
          docParts.push(accFrom.concat(staffDetails.join(',')));
        }
    
        const doc = docParts.join("\n");
        const response = {
          document: doc,
          date: nomina.date
        }
        return resProcessor.concatStatus(200, response);

      } catch (error) {
        return this.handleError(error);
      } finally {
        await this.prisma.$disconnect();
      }
    }

    async getRecent(num_months: number): Promise<Array<{ year: string, month: string, total: number }>> {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
    
      const results = [];
    
      for (let i = 0; i < num_months; i++) {
        const year = currentYear - Math.floor((currentMonth + i - 1) / 12);
        const month = (currentMonth + 12 - i) % 12 || 12;
        const monthString = month.toString().padStart(2, '0');
        const yearString = year.toString();
    
        const totals = await this.getTotalsByDate(yearString, monthString);
    
        results.push({
          year: yearString,
          month: monthString,
          total: totals.total,
        });
      }

      console.log(results);
      return results;
    }  

  }

let nominaHanlder = new NominaHanlder();
export default nominaHanlder;
