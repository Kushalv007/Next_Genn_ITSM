import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
} from '../services/asset.service';

export const getAssets = asyncHandler(async (req: Request, res: Response) => {
  const { type, status, search, assignedToId } = req.query;
  const assets = await listAssets({
    type: type as string,
    status: status as string,
    search: search as string,
    assignedToId: assignedToId as string,
  });

  res.status(200).json({
    success: true,
    data: assets,
  });
});

export const getAsset = asyncHandler(async (req: Request, res: Response) => {
  const asset = await getAssetById(req.params.id);

  res.status(200).json({
    success: true,
    data: asset,
  });
});

export const postAsset = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const created = await createAsset(req.body, req.user);

  res.status(201).json({
    success: true,
    data: created,
    message: 'Asset created successfully',
  });
});

export const putAsset = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await updateAsset(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Asset updated successfully',
  });
});
