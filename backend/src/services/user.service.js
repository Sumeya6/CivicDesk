const { prisma } = require("../config/db");
const { getEthiopianPhoneVariants } = require("../utils/phone");

const userSelect = {
  id: true,
  fullName: true,
  phoneNumber: true,
  role: true,
  officeId: true,
  isActive: true,
  preferredLanguage: true,
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

async function findUserByPhone(phoneNumber) {
  const phoneVariants = getEthiopianPhoneVariants(phoneNumber);
  if (phoneVariants.length === 0) {
    return prisma.user.findUnique({ where: { phoneNumber } });
  }

  for (const phoneVariant of phoneVariants) {
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phoneVariant },
    });
    if (user) return user;
  }

  return null;
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

async function findTechnicianById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });
}

async function getUsers({ page = 1, pageSize = 20, search, role, isActive }) {
  const where = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const activeValue = normalizeBooleanQuery(isActive);
  if (activeValue !== undefined) {
    where.isActive = activeValue;
  }

  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    select: userSelect,
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
    users,
  };
}

async function createUser({
  fullName,
  phoneNumber,
  password,
  preferredLanguage,
  officeId,
  role = "EMPLOYEE",
}) {
  return prisma.user.create({
    data: {
      fullName,
      phoneNumber,
      password,
      preferredLanguage,
      officeId,
      role,
    },
    select: userSelect,
  });
}

async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

async function updateUserStatus(id, isActive) {
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: userSelect,
  });
}

async function updateUserRole(id, role) {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: userSelect,
  });
}

async function updatePreferredLanguage(id, preferredLanguage) {
  return prisma.user.update({
    where: { id },
    data: { preferredLanguage },
    select: userSelect,
  });
}

async function deleteUser(id) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        role: true,
        _count: {
          select: {
            employeeTickets: true,
            createdAnnouncements: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    const dependencies = [];
    if (user._count.employeeTickets > 0) dependencies.push("tickets");
    if (user._count.createdAnnouncements > 0) {
      dependencies.push("announcements");
    }
    if (user._count.auditLogs > 0) dependencies.push("audit logs");

    if (dependencies.length > 0) {
      const error = new Error(
        `User cannot be deleted because they have associated ${dependencies.join(", ")}.`,
      );
      error.statusCode = 409;
      throw error;
    }

    return transaction.user.delete({
      where: { id },
      select: { id: true, fullName: true, role: true },
    });
  });
}

async function getTechnicianOfficeIds(technicianId) {
  const assignments = await prisma.technicianOffice.findMany({
    where: { technicianId },
    select: { officeId: true },
  });
  return assignments.map(({ officeId }) => officeId);
}

module.exports = {
  findUserByPhone,
  findUserById,
  findTechnicianById,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  updatePreferredLanguage,
  deleteUser,
  getTechnicianOfficeIds,
};
