import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Registra en `audit_logs` cada operación que modifica datos (POST/PUT/PATCH/DELETE)
 * junto con el usuario autenticado. La escritura del log nunca debe interrumpir
 * la petición: cualquier fallo se captura y se registra solo en consola.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    if (!MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const user = (req as any).user as
      | { id?: number; usuario?: string; role?: string }
      | undefined;

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        void this.record(req, user, res.statusCode);
      }),
    );
  }

  private async record(
    req: Request,
    user: { id?: number; usuario?: string; role?: string } | undefined,
    statusCode: number,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user?.id ?? null,
          usuario: user?.usuario ?? null,
          rol: user?.role ?? null,
          metodo: req.method,
          ruta: req.originalUrl?.slice(0, 500) ?? req.url,
          statusCode,
        },
      });
    } catch (err) {
      this.logger.error('No se pudo registrar el log de auditoría', err as Error);
    }
  }
}
