import { Role, RequestStatus, ApprovalStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { createNotification } from './notification.service';
import { mockStore, isDbConnectionError, MockServiceRequest } from '../mock/mockStore';

export async function generateRequestNumber(): Promise<string> {
  try {
    const latest = await prisma.serviceRequest.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { requestNumber: true },
    });

    let nextNum = 1;
    if (latest && latest.requestNumber.startsWith('REQ')) {
      const numPart = parseInt(latest.requestNumber.replace('REQ', ''), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }

    return `REQ${String(nextNum).padStart(6, '0')}`;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const nextNum = mockStore.serviceRequests.length + 1;
      return `REQ${String(nextNum).padStart(6, '0')}`;
    }
    throw err;
  }
}

export async function listCatalogItems(category?: string) {
  const where: Prisma.ServiceCatalogItemWhereInput = { isActive: true };
  if (category && category !== 'ALL') {
    where.category = category;
  }

  try {
    return await prisma.serviceCatalogItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      console.warn('⚠️ [ITSM Catalog Service] DB unreachable. Using in-memory store.');
      let items = mockStore.catalogItems.filter((c) => c.isActive);
      if (category && category !== 'ALL') {
        items = items.filter((c) => c.category === category);
      }
      return items;
    }
    throw err;
  }
}

export async function getCatalogItemById(id: string) {
  try {
    const item = await prisma.serviceCatalogItem.findUnique({ where: { id } });
    if (!item) {
      throw new AppError('Service catalog item not found', 404);
    }
    return item;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const item = mockStore.catalogItems.find((c) => c.id === id);
      if (!item) {
        throw new AppError('Service catalog item not found', 404);
      }
      return item;
    }
    throw err;
  }
}

export async function createServiceRequest(
  data: { serviceCatalogItemId: string; description: string },
  requesterId: string
) {
  if (!data.serviceCatalogItemId || !data.description) {
    throw new AppError('serviceCatalogItemId and description are required.', 400);
  }

  const requestNumber = await generateRequestNumber();

  try {
    const catalogItem = await prisma.serviceCatalogItem.findUnique({
      where: { id: data.serviceCatalogItemId },
    });

    if (!catalogItem) {
      throw new AppError('Selected service catalog item does not exist.', 404);
    }

    return await prisma.serviceRequest.create({
      data: {
        requestNumber,
        serviceCatalogItemId: data.serviceCatalogItemId,
        requesterId,
        description: data.description,
        status: RequestStatus.SUBMITTED,
        approvalStatus: ApprovalStatus.PENDING,
      },
      include: {
        catalogItem: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const catItem = mockStore.catalogItems.find((c) => c.id === data.serviceCatalogItemId);
      if (!catItem) {
        throw new AppError('Selected service catalog item does not exist.', 404);
      }
      const newReq: MockServiceRequest = {
        id: `req-${Date.now()}`,
        requestNumber,
        serviceCatalogItemId: data.serviceCatalogItemId,
        requesterId,
        description: data.description,
        status: RequestStatus.SUBMITTED,
        approvalStatus: ApprovalStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.serviceRequests.unshift(newReq);
      return mockStore.getRequestWithRelations(newReq);
    }
    throw err;
  }
}

export async function listServiceRequests(
  user: { userId: string; role: Role },
  filters: { status?: string; search?: string } = {}
) {
  const where: Prisma.ServiceRequestWhereInput = {};

  if (user.role === Role.User) {
    where.requesterId = user.userId;
  }

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status as RequestStatus;
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { requestNumber: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { catalogItem: { name: { contains: term, mode: 'insensitive' } } },
    ];
  }

  try {
    return await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        catalogItem: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      console.warn('⚠️ [ITSM Catalog Service] DB unreachable. Using in-memory store.');
      let list = [...mockStore.serviceRequests];
      if (user.role === Role.User) {
        list = list.filter((r) => r.requesterId === user.userId);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter((r) => r.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase();
        list = list.filter((r) => {
          const cat = mockStore.catalogItems.find((c) => c.id === r.serviceCatalogItemId);
          return (
            r.requestNumber.toLowerCase().includes(s) ||
            r.description.toLowerCase().includes(s) ||
            (cat && cat.name.toLowerCase().includes(s))
          );
        });
      }
      return list.map((r) => mockStore.getRequestWithRelations(r));
    }
    throw err;
  }
}

export async function getServiceRequestById(
  idOrNumber: string,
  user: { userId: string; role: Role }
) {
  try {
    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { requestNumber: idOrNumber }],
      },
      include: {
        catalogItem: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    if (!request) {
      throw new AppError('Service request not found', 404);
    }

    if (user.role === Role.User && request.requesterId !== user.userId) {
      throw new AppError('Forbidden. You can only view your own service requests.', 403);
    }

    return request;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = mockStore.serviceRequests.find((r) => r.id === idOrNumber || r.requestNumber === idOrNumber);
      if (!found) {
        throw new AppError('Service request not found', 404);
      }
      if (user.role === Role.User && found.requesterId !== user.userId) {
        throw new AppError('Forbidden. You can only view your own service requests.', 403);
      }
      return mockStore.getRequestWithRelations(found);
    }
    throw err;
  }
}

export async function updateServiceRequest(
  id: string,
  data: { status?: RequestStatus; assignedToId?: string | null },
  user: { userId: string; role: Role }
) {
  if (user.role === Role.User) {
    throw new AppError('Forbidden. Only agents and admins can update service requests.', 403);
  }

  try {
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new AppError('Service request not found', 404);
    }

    const updateData: Prisma.ServiceRequestUpdateInput = {};
    if (data.status) {
      updateData.status = data.status;
    }
    if (data.assignedToId !== undefined) {
      if (data.assignedToId === null || data.assignedToId === '') {
        updateData.assignedTo = { disconnect: true };
      } else {
        updateData.assignedTo = { connect: { id: data.assignedToId } };
      }
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        catalogItem: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    if (data.status && data.status !== request.status) {
      await createNotification(
        updated.requesterId,
        'Request Updated',
        `Your service request ${updated.requestNumber} status has been updated to ${updated.status}.`,
        `/requests/${updated.id}`
      );
    }

    return updated;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = mockStore.serviceRequests.find((r) => r.id === id);
      if (!found) throw new AppError('Service request not found', 404);
      if (data.status) found.status = data.status;
      if (data.assignedToId !== undefined) found.assignedToId = data.assignedToId;
      found.updatedAt = new Date();
      return mockStore.getRequestWithRelations(found);
    }
    throw err;
  }
}

export async function approveOrRejectRequest(
  id: string,
  approvalStatus: ApprovalStatus,
  user: { userId: string; role: Role }
) {
  if (user.role === Role.User) {
    throw new AppError('Forbidden. Only managers and administrators can approve or reject requests.', 403);
  }

  const status = approvalStatus === ApprovalStatus.APPROVED ? RequestStatus.IN_PROGRESS : RequestStatus.REJECTED;

  try {
    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) {
      throw new AppError('Service request not found', 404);
    }

    const updated = await prisma.serviceRequest.update({
      where: { id },
      data: {
        approvalStatus,
        status,
        approverId: user.userId,
        approvedAt: new Date(),
      },
      include: {
        catalogItem: true,
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    const actionText = approvalStatus === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected';
    await createNotification(
      updated.requesterId,
      `Request ${actionText}`,
      `Your request ${updated.requestNumber} has been ${actionText.toLowerCase()} by ${user.role}.`,
      `/requests/${updated.id}`
    );

    return updated;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = mockStore.serviceRequests.find((r) => r.id === id);
      if (!found) throw new AppError('Service request not found', 404);
      found.approvalStatus = approvalStatus;
      found.status = status;
      found.approverId = user.userId;
      found.approvedAt = new Date();
      found.updatedAt = new Date();
      return mockStore.getRequestWithRelations(found);
    }
    throw err;
  }
}
