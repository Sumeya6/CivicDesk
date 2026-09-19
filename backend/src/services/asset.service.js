const { prisma } = require("../config/db");

const assetSelect = {
  id: true,
  assetTag: true,
  name: true,
  assetType: true,
  serialNumber: true,
  status: true,
  officeId: true,
  employeeId: true,
  purchaseDate: true,
  warrantyExpiry: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  office: { select: { id: true, code: true, nameAm: true, nameEn: true } },
  employee: { select: { id: true, fullName: true, phoneNumber: true } },
};

function normalizeBooleanQuery(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
}

async function getAssets({ page = 1, pageSize = 20, search, status, officeId, employeeId, assetType }) {
  const where = {};

  if (search) {
    where.OR = [
      { assetTag: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (officeId) where.officeId = officeId;
  if (employeeId) where.employeeId = employeeId;
  if (assetType) where.assetType = assetType;

  const total = await prisma.asset.count({ where });
  const assets = await prisma.asset.findMany({
    where,
    select: assetSelect,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });

  return {
    assets,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    },
  };
}

async function findAssetById(id) {
  return prisma.asset.findUnique({ where: { id }, select: assetSelect });
}

async function getAssetWithTickets(id) {
  return prisma.asset.findUnique({
    where: { id },
    select: {
      ...assetSelect,
      tickets: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          resolvedAt: true,
          closedAt: true,
          employee: { select: { id: true, fullName: true } },
          technician: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function createAsset({ assetTag, name, assetType, serialNumber, status, officeId, employeeId, purchaseDate, warrantyExpiry, notes }) {
  return prisma.asset.create({
    data: {
      assetTag,
      name,
      assetType,
      serialNumber: serialNumber || null,
      status: status || "ACTIVE",
      officeId,
      employeeId: employeeId || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
      notes: notes || null,
    },
    select: assetSelect,
  });
}

async function updateAsset(id, data) {
  const updateData = {};
  if (data.assetTag !== undefined) updateData.assetTag = data.assetTag;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.assetType !== undefined) updateData.assetType = data.assetType;
  if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.officeId !== undefined) updateData.officeId = data.officeId;
  if (data.employeeId !== undefined) updateData.employeeId = data.employeeId || null;
  if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
  if (data.warrantyExpiry !== undefined) updateData.warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry) : null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  return prisma.asset.update({ where: { id }, data: updateData, select: assetSelect });
}

async function archiveAsset(id) {
  return prisma.asset.update({
    where: { id },
    data: { status: "ARCHIVED" },
    select: assetSelect,
  });
}

async function getAssetsByEmployee(employeeId) {
  return prisma.asset.findMany({
    where: { employeeId },
    select: assetSelect,
    orderBy: { createdAt: "desc" },
  });
}

async function getAssetsByTechnicianOffices(technicianId) {
  const assignments = await prisma.technicianOffice.findMany({
    where: { technicianId },
    select: { officeId: true },
  });
  const officeIds = assignments.map((a) => a.officeId);
  if (officeIds.length === 0) return [];

  return prisma.asset.findMany({
    where: { officeId: { in: officeIds } },
    select: assetSelect,
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  getAssets,
  findAssetById,
  getAssetWithTickets,
  createAsset,
  updateAsset,
  archiveAsset,
  getAssetsByEmployee,
  getAssetsByTechnicianOffices,
};
