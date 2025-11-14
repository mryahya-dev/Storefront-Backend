// src/middleware/pagination.ts
import { Request, Response, NextFunction } from "express";

export interface Paging {
  limit: number;
  offset: number;
}

export function parsePaging(defaultLimit = 20, maxLimit = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawLimit = parseInt((req.query.limit as string) || "", 10);
    const rawOffset = parseInt((req.query.offset as string) || "", 10);

    let limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    (req as any).paging = { limit, offset } as Paging;
    next();
  };
}
