import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  listChanges,
  getChangeById,
  createChange,
  updateChange,
  approveOrRejectChange,
  updateChangeStatus,
} from '../services/change.service';

export const getChanges = asyncHandler(async (req: Request, res: Response) => {
  const { status, risk, search, ownerId } = req.query;
  const changes = await listChanges({
    status: status as string,
    risk: risk as string,
    search: search as string,
    ownerId: ownerId as string,
  });

  res.status(200).json({
    success: true,
    data: changes,
  });
});

export const getChange = asyncHandler(async (req: Request, res: Response) => {
  const change = await getChangeById(req.params.id);

  res.status(200).json({
    success: true,
    data: change,
  });
});

export const postChange = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const created = await createChange(req.body, req.user);

  res.status(201).json({
    success: true,
    data: created,
    message: 'Change request created successfully',
  });
});

export const putChange = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await updateChange(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Change request updated successfully',
  });
});

export const postChangeApproval = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { decision } = req.body;
  if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    throw new AppError('decision is required (APPROVED or REJECTED)', 400);
  }

  const updated = await approveOrRejectChange(req.params.id, decision, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: `Change request ${decision.toLowerCase()} successfully`,
  });
});

export const patchChangeStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { status } = req.body;
  if (!status) {
    throw new AppError('status is required', 400);
  }

  const updated = await updateChangeStatus(req.params.id, status, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Change status updated successfully',
  });
});
