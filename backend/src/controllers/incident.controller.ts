import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  listIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  addIncidentComment,
  getIncidentAgents,
} from '../services/incident.service';

export const getIncidents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { status, priority, category, search, assignedToId } = req.query;

  const incidents = await listIncidents(req.user, {
    status: status as string,
    priority: priority as string,
    category: category as string,
    search: search as string,
    assignedToId: assignedToId as string,
  });

  res.status(200).json({
    success: true,
    data: incidents,
  });
});

export const getIncident = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const incident = await getIncidentById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: incident,
  });
});

export const postIncident = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const newIncident = await createIncident(req.body, req.user.userId);

  res.status(201).json({
    success: true,
    data: newIncident,
    message: 'Incident created successfully',
  });
});

export const putIncident = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await updateIncident(req.params.id, req.body, req.user);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Incident updated successfully',
  });
});

export const postComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const comment = await addIncidentComment(req.params.id, req.body.content, req.user);

  res.status(201).json({
    success: true,
    data: comment,
    message: 'Comment added successfully',
  });
});

export const getAgents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const agents = await getIncidentAgents();

  res.status(200).json({
    success: true,
    data: agents,
  });
});
