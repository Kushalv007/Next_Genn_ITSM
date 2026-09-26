import { Role, AssetStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { mockStore, isDbConnectionError, MockAsset } from '../mock/mockStore';

export interface AssetFilters {
  type?: string;
  status?: string;
  search?: string;
  assignedToId?: string;
}

export interface CreateAssetInput {
  assetTag?: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status?: AssetStatus;
  assignedToId?: string | null;
  locationId?: string | null;
}

export interface UpdateAssetInput {
  assetTag?: string;
  name?: string;
  type?: string;
  model?: string;
  serialNumber?: string;
  status?: AssetStatus;
  assignedToId?: string | null;
  locationId?: string | null;
}

export async function generateAssetTag(): Promise<string> {
  try {
    const latest = await prisma.asset.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { assetTag: true },
    });

    let nextNum = 1;
    if (latest && latest.assetTag.startsWith('AST')) {
      const numPart = parseInt(latest.assetTag.replace('AST', ''), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }

    return `AST${String(nextNum).padStart(6, '0')}`;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const nextNum = mockStore.assets.length + 1;
      return `AST${String(nextNum).padStart(6, '0')}`;
    }
    throw err;
  }
}

export async function listAssets(filters: AssetFilters = {}) {
  const where: Prisma.AssetWhereInput = {};

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status as AssetStatus;
  }

  if (filters.type && filters.type !== 'ALL') {
    where.type = filters.type;
  }

  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { assetTag: { contains: term, mode: 'insensitive' } },
      { name: { contains: term, mode: 'insensitive' } },
      { model: { contains: term, mode: 'insensitive' } },
      { serialNumber: { contains: term, mode: 'insensitive' } },
      { locationId: { contains: term, mode: 'insensitive' } },
    ];
  }

  try {
    return await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        _count: {
          select: { incidents: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      console.warn('⚠️ [ITSM Asset Service] DB unreachable. Using in-memory store.');
      let list = [...mockStore.assets];
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter((a) => a.status === filters.status);
      }
      if (filters.type && filters.type !== 'ALL') {
        list = list.filter((a) => a.type === filters.type);
      }
      if (filters.assignedToId) {
        list = list.filter((a) => a.assignedToId === filters.assignedToId);
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.assetTag.toLowerCase().includes(s) ||
            a.name.toLowerCase().includes(s) ||
            a.model.toLowerCase().includes(s) ||
            a.serialNumber.toLowerCase().includes(s) ||
            (a.locationId && a.locationId.toLowerCase().includes(s))
        );
      }
      return list.map((a) => ({
        ...a,
        assignedTo: a.assignedToId ? mockStore.users.find((u) => u.id === a.assignedToId) : null,
        _count: { incidents: 0 },
      }));
    }
    throw err;
  }
}

export async function getAssetById(id: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        incidents: {
          select: {
            id: true,
            ticketNumber: true,
            shortDescription: true,
            status: true,
            priority: true,
            createdAt: true,
            requester: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new AppError('Asset not found', 404);
    }

    return asset;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = mockStore.assets.find((a) => a.id === id || a.assetTag === id);
      if (!found) throw new AppError('Asset not found', 404);
      return {
        ...found,
        assignedTo: found.assignedToId ? mockStore.users.find((u) => u.id === found.assignedToId) : null,
        incidents: [],
      };
    }
    throw err;
  }
}

export async function createAsset(
  data: CreateAssetInput,
  user: { userId: string; role: Role }
) {
  if (user.role === Role.User) {
    throw new AppError('Forbidden. Only technicians and admins can register assets.', 403);
  }

  if (!data.name || !data.type || !data.model || !data.serialNumber) {
    throw new AppError('Asset name, type, model, and serial number are required.', 400);
  }

  const assetTag = data.assetTag?.trim() || (await generateAssetTag());
  const status = data.status ?? (data.assignedToId ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE);

  try {
    const existing = await prisma.asset.findUnique({ where: { assetTag } });
    if (existing) {
      throw new AppError(`Asset with tag ${assetTag} already exists.`, 400);
    }

    return await prisma.asset.create({
      data: {
        assetTag,
        name: data.name.trim(),
        type: data.type.trim(),
        model: data.model.trim(),
        serialNumber: data.serialNumber.trim(),
        status,
        assignedToId: data.assignedToId || null,
        locationId: data.locationId?.trim() || null,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const existing = mockStore.assets.find((a) => a.assetTag === assetTag);
      if (existing) throw new AppError(`Asset with tag ${assetTag} already exists.`, 400);
      const newAsset: MockAsset = {
        id: `ast-${Date.now()}`,
        assetTag,
        name: data.name.trim(),
        type: data.type.trim(),
        model: data.model.trim(),
        serialNumber: data.serialNumber.trim(),
        status,
        assignedToId: data.assignedToId || null,
        locationId: data.locationId?.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.assets.unshift(newAsset);
      return {
        ...newAsset,
        assignedTo: newAsset.assignedToId ? mockStore.users.find((u) => u.id === newAsset.assignedToId) : null,
      };
    }
    throw err;
  }
}

export async function updateAsset(
  id: string,
  data: UpdateAssetInput,
  user: { userId: string; role: Role }
) {
  if (user.role === Role.User) {
    throw new AppError('Forbidden. Only technicians and admins can update assets.', 403);
  }

  try {
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Asset not found', 404);
    }

    const updateData: Prisma.AssetUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type.trim();
    if (data.model !== undefined) updateData.model = data.model.trim();
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber.trim();
    if (data.locationId !== undefined) updateData.locationId = data.locationId?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.assignedToId !== undefined) {
      if (data.assignedToId === null || data.assignedToId === '') {
        updateData.assignedTo = { disconnect: true };
        if (!data.status && existing.status === AssetStatus.ASSIGNED) {
          updateData.status = AssetStatus.AVAILABLE;
        }
      } else {
        updateData.assignedTo = { connect: { id: data.assignedToId } };
        if (!data.status && existing.status === AssetStatus.AVAILABLE) {
          updateData.status = AssetStatus.ASSIGNED;
        }
      }
    }

    return await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        incidents: true,
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const ast = mockStore.assets.find((a) => a.id === id);
      if (!ast) throw new AppError('Asset not found', 404);
      if (data.name !== undefined) ast.name = data.name.trim();
      if (data.type !== undefined) ast.type = data.type.trim();
      if (data.model !== undefined) ast.model = data.model.trim();
      if (data.serialNumber !== undefined) ast.serialNumber = data.serialNumber.trim();
      if (data.locationId !== undefined) ast.locationId = data.locationId?.trim() || null;
      if (data.status !== undefined) ast.status = data.status;
      if (data.assignedToId !== undefined) ast.assignedToId = data.assignedToId || null;
      ast.updatedAt = new Date();
      return {
        ...ast,
        assignedTo: ast.assignedToId ? mockStore.users.find((u) => u.id === ast.assignedToId) : null,
        incidents: [],
      };
    }
    throw err;
  }
}
