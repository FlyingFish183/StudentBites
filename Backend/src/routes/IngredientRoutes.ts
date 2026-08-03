import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import prisma from '@src/repos/prisma';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Lấy danh sách nguyên liệu.
 *
 * @route GET /api/ingredients
 */
async function list(_req: Request, res: Response) {
  const ingredients = await prisma.ingredient.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: 'asc' },
  });
  res.status(HttpStatusCodes.OK).json({ ingredients });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default { list } as const;
