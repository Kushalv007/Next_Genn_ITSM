import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  listProblems,
  getProblemById,
  createProblem,
  updateProblem,
  linkIncidentToProblem,
  unlinkIncidentFromProblem,
} from '../services/problem.service';

export const getProblems = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, ownerId } = req.query;
  const problems = await listProblems({
    status: status as string,
    search: search as string,
    ownerId: ownerId as string,
  });

  res.status(200).json({
    success: true,
    data: problems,
  });
});

export const getProblem = asyncHandler(async (req: Request, res: Response) => {
  const problem = await getProblemById(req.params.id);

  res.status(200).json({
    success: true,
    data: problem,
  });
});

export const postProblem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const created = await createProblem(req.body, req.user);

  res.status(201).json({
    success: true,
    data: created,
    message: 'Problem record created successfully',
  });
});

export const putProblem = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await updateProblem(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Problem record updated successfully',
  });
});

export const postLinkIncident = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { incidentId } = req.body;
  if (!incidentId) {
    throw new AppError('incidentId is required.', 400);
  }

  const updatedIncident = await linkIncidentToProblem(req.params.id, incidentId, req.user);

  res.status(200).json({
    success: true,
    data: updatedIncident,
    message: 'Incident linked to problem successfully',
  });
});

export const postUnlinkIncident = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { incidentId } = req.body;
  if (!incidentId) {
    throw new AppError('incidentId is required.', 400);
  }

  await unlinkIncidentFromProblem(req.params.id, incidentId, req.user);

  res.status(200).json({
    success: true,
    message: 'Incident unlinked from problem successfully',
  });
});
