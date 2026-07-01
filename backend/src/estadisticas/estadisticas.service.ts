import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstadisticasService {
  constructor(private prisma: PrismaService) {}

  async getResumen(query?: { desde?: string; hasta?: string }) {
    const whereFecha: any = {};
    if (query?.desde || query?.hasta) {
      if (query.desde) whereFecha.gte = new Date(query.desde);
      if (query.hasta) whereFecha.lte = new Date(query.hasta);
    }

    const whereControles = Object.keys(whereFecha).length ? { fecha: whereFecha } : {};

    const [
      totalPacientes,
      totalControles,
      controlesPorTipo,
      totalRecetas,
      totalRemisiones,
      remisionesPorEstado,
    ] = await Promise.all([
      this.prisma.paciente.count({ where: { activo: true } }),
      this.prisma.control.count({ where: whereControles }),
      this.prisma.control.groupBy({
        by: ['tipo'],
        _count: true,
        where: whereControles,
      }),
      this.prisma.receta.count({
        where: Object.keys(whereFecha).length
          ? { fechaInicio: whereFecha }
          : {},
      }),
      this.prisma.remision.count({
        where: Object.keys(whereFecha).length
          ? { fechaRemision: whereFecha }
          : {},
      }),
      this.prisma.remision.groupBy({
        by: ['estado'],
        _count: true,
        where: Object.keys(whereFecha).length
          ? { fechaRemision: whereFecha }
          : {},
      }),
    ]);

    const empleadoMasAsistido = await this.prisma.control.groupBy({
      by: ['pacienteId'],
      _count: true,
      orderBy: { _count: { pacienteId: 'desc' } },
      take: 1,
      where: whereControles,
    });

    let topPaciente = null;
    if (empleadoMasAsistido.length > 0) {
      topPaciente = await this.prisma.paciente.findUnique({
        where: { id: empleadoMasAsistido[0].pacienteId },
      });
    }

    const medicamentoMasRecetado = await this.prisma.receta.groupBy({
      by: ['medicamentoId'],
      _count: true,
      orderBy: { _count: { medicamentoId: 'desc' } },
      take: 1,
      where: Object.keys(whereFecha).length
        ? { fechaInicio: whereFecha }
        : {},
    });

    let topMedicamento = null;
    if (medicamentoMasRecetado.length > 0) {
      topMedicamento = await this.prisma.medicamento.findUnique({
        where: { id: medicamentoMasRecetado[0].medicamentoId },
      });
    }

    return {
      totalPacientes,
      totalControles,
      controlesPorTipo: controlesPorTipo.map((c) => ({
        tipo: c.tipo,
        cantidad: c._count,
      })),
      totalRecetas,
      totalRemisiones,
      remisionesPorEstado: remisionesPorEstado.map((r) => ({
        estado: r.estado,
        cantidad: r._count,
      })),
      topPaciente,
      topMedicamento,
    };
  }

  async getControlesPorMes(anio?: number) {
    const year = anio || new Date().getFullYear();

    const controles = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT
        MONTH(fecha) as mes,
        COUNT(*) as cantidad
      FROM controles
      WHERE YEAR(fecha) = ?
      GROUP BY MONTH(fecha)
      ORDER BY mes`,
      year,
    );

    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];

    return controles.map((c) => ({
      mes: meses[c.mes - 1],
      mesNumero: c.mes,
      cantidad: Number(c.cantidad),
    }));
  }

  async getPresionPromedio(query?: { desde?: string; hasta?: string }) {
    const where: any = {};
    if (query?.desde || query?.hasta) {
      where.fecha = {};
      if (query.desde) where.fecha.gte = new Date(query.desde);
      if (query.hasta) where.fecha.lte = new Date(query.hasta);
    }

    const resultado = await this.prisma.control.aggregate({
      _avg: {
        presionSistolica: true,
        presionDiastolica: true,
        temperatura: true,
        pulso: true,
        saturacionO2: true,
      },
      where: {
        ...where,
        presionSistolica: { not: null },
      },
    });

    return {
      promedioSistolica: resultado._avg.presionSistolica
        ? Math.round(Number(resultado._avg.presionSistolica))
        : 0,
      promedioDiastolica: resultado._avg.presionDiastolica
        ? Math.round(Number(resultado._avg.presionDiastolica))
        : 0,
      promedioTemperatura: resultado._avg.temperatura
        ? Number(resultado._avg.temperatura).toFixed(1)
        : 0,
      promedioPulso: resultado._avg.pulso
        ? Math.round(Number(resultado._avg.pulso))
        : 0,
      promedioSaturacion: resultado._avg.saturacionO2
        ? Math.round(Number(resultado._avg.saturacionO2))
        : 0,
    };
  }

  async getControlesPorTipo() {
    const resultado = await this.prisma.control.groupBy({
      by: ['tipo'],
      _count: true,
    });

    return resultado.map((r) => ({
      tipo: r.tipo,
      cantidad: r._count,
    }));
  }

  async getRemisionesPorEstado() {
    const resultado = await this.prisma.remision.groupBy({
      by: ['estado'],
      _count: true,
    });

    return resultado.map((r) => ({
      estado: r.estado,
      cantidad: r._count,
    }));
  }
}
