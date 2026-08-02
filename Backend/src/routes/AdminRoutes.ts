import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { getActor } from '@src/routes/common/admin-auth';
import AdminService from '@src/services/AdminService';

/******************************************************************************
                                Helpers
******************************************************************************/

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Express 5 khai params là string | string[]; ở đây luôn là một giá trị. */
function param(req: Request, name: string): string {
  const raw = (req.params as Record<string, string | string[]>)[name];
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Danh sách bảng + số bản ghi.
 *
 * @route GET /api/admin/models
 */
async function listModels(_: Request, res: Response) {
  const models = await AdminService.listModels();
  res.status(HttpStatusCodes.OK).json({ models });
}

/**
 * Danh sách bản ghi của một bảng, có phân trang và tìm kiếm.
 *
 * @route GET /api/admin/:model?page=&pageSize=&q=&sortBy=&sortDir=
 */
async function list(req: Request, res: Response) {
  const result = await AdminService.list(param(req, 'model'), {
    page: num(req.query.page, 1),
    pageSize: num(req.query.pageSize, 20),
    q: str(req.query.q),
    sortBy: str(req.query.sortBy),
    sortDir: req.query.sortDir === 'asc' ? 'asc' : 'desc',
    filterField: str(req.query.filterField),
    filterValue: str(req.query.filterValue),
  });
  res.status(HttpStatusCodes.OK).json(result);
}

/**
 * Danh sách để chọn khoá ngoại.
 *
 * @route GET /api/admin/:model/options?q=
 */
async function options(req: Request, res: Response) {
  const result = await AdminService.options(
    param(req, 'model'),
    str(req.query.q),
  );
  res.status(HttpStatusCodes.OK).json(result);
}

/**
 * Một bản ghi.
 *
 * @route GET /api/admin/:model/:id
 */
async function getOne(req: Request, res: Response) {
  const result = await AdminService.getOne(param(req, 'model'), param(req, 'id'));
  res.status(HttpStatusCodes.OK).json(result);
}

/**
 * Tạo bản ghi.
 *
 * @route POST /api/admin/:model
 */
async function create(req: Request, res: Response) {
  const row = await AdminService.create(
    param(req, 'model'),
    req.body as Record<string, unknown>,
    getActor(res),
  );
  res.status(HttpStatusCodes.CREATED).json({ row });
}

/**
 * Sửa bản ghi.
 *
 * @route PUT /api/admin/:model/:id
 */
async function update(req: Request, res: Response) {
  const row = await AdminService.update(
    param(req, 'model'),
    param(req, 'id'),
    req.body as Record<string, unknown>,
    getActor(res),
  );
  res.status(HttpStatusCodes.OK).json({ row });
}

/**
 * Xoá bản ghi.
 *
 * @route DELETE /api/admin/:model/:id
 */
async function remove(req: Request, res: Response) {
  await AdminService.remove(param(req, 'model'), param(req, 'id'), getActor(res));
  res.status(HttpStatusCodes.OK).json({ ok: true });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  listModels,
  list,
  options,
  getOne,
  create,
  update,
  remove,
} as const;
