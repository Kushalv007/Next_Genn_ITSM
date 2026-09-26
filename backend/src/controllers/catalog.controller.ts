import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  listCatalogItems,
  getCatalogItemById,
  createServiceRequest,
  listServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  approveOrRejectRequest,
} from '../services/catalog.service';

export const getCatalogItems = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  const items = await listCatalogItems(category as string);

  res.status(200).json({
    success: true,
    data: items,
  });
});

export const getCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await getCatalogItemById(req.params.id);

  res.status(200).json({
    success: true,
    data: item,
  });
});

export const postRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const newRequest = await createServiceRequest(req.body, req.user.userId);

  res.status(201).json({
    success: true,
    data: newRequest,
    message: 'Service request submitted successfully',
  });
});

export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { status, search } = req.query;
  const requests = await listServiceRequests(req.user, {
    status: status as string,
    search: search as string,
  });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const request = await getServiceRequestById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: request,
  });
});

export const putRequest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await updateServiceRequest(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Service request updated successfully',
  });
});

export const postApproval = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { approvalStatus } = req.body;
  if (!approvalStatus) {
    throw new AppError('approvalStatus is required (APPROVED or REJECTED)', 400);
  }

  const updated = await approveOrRejectRequest(req.params.id, approvalStatus, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: `Service request ${approvalStatus.toLowerCase()} successfully`,
  });
});

