const { prisma } = require("../config/db");

const officeSelect = {
  id: true,
  code: true,
  nameAm: true,
  nameEn: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function normalizeBooleanQuery(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
}

async function getOffices({ page = 1, pageSize = 20, search, isActive }) {
  const where = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { nameAm: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
    ];
  }

  const activeValue = normalizeBooleanQuery(isActive);
  if (activeValue !== undefined) {
    where.isActive = activeValue;
  }

  const total = await prisma.office.count({ where });
  const offices = await prisma.office.findMany({
    where,
    select: officeSelect,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });

  return {
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    },
    offices,
  };
}

async function findOfficeById(id) {
  return prisma.office.findUnique({ where: { id }, select: officeSelect });
}

async function findOfficeByCode(code) {
  return prisma.office.findUnique({ where: { code }, select: officeSelect });
}

async function createOffice({ code, nameAm, nameEn, isActive = true }) {
  return prisma.office.create({
    data: {
      code,
      nameAm,
      nameEn,
      isActive,
    },
    select: officeSelect,
  });
}

async function updateOffice(id, data) {
  return prisma.office.update({
    where: { id },
    data,
    select: officeSelect,
  });
}

async function updateOfficeStatus(id, isActive) {
  return prisma.office.update({
    where: { id },
    data: { isActive },
    select: officeSelect,
  });
}

async function deleteOffice(id) {
  return prisma.$transaction(async (transaction) => {
    const office = await transaction.office.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        nameEn: true,
        _count: {
          select: {
            users: true,
            tickets: true,
            technicianOffices: true,
          },
        },
      },
    });

    if (!office) {
      const error = new Error("Office not found.");
      error.statusCode = 404;
      throw error;
    }

    const dependencies = [];
    if (office._count.users > 0) dependencies.push("users");
    if (office._count.tickets > 0) dependencies.push("tickets");
    if (office._count.technicianOffices > 0) {
      dependencies.push("technician assignments");
    }

    if (dependencies.length > 0) {
      const error = new Error(
        `Office cannot be deleted because it has associated ${dependencies.join(", ")}.`,
      );
      error.statusCode = 409;
      throw error;
    }

    return transaction.office.delete({
      where: { id },
      select: { id: true, code: true, nameEn: true },
    });
  });
}

async function getOfficesByIds(ids) {
  return prisma.office.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
}

async function getActiveOfficeOptions() {
  return prisma.office.findMany({
    where: { isActive: true },
    select: { id: true, code: true, nameAm: true, nameEn: true },
    orderBy: { nameEn: "asc" },
  });
}

module.exports = {
  getOffices,
  findOfficeById,
  findOfficeByCode,
  createOffice,
  updateOffice,
  updateOfficeStatus,
  deleteOffice,
  getOfficesByIds,
  getActiveOfficeOptions,
};
