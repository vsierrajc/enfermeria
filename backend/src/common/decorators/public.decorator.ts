import { SetMetadata } from '@nestjs/common';

/** Marca una ruta como pública (sin requerir JWT). */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
