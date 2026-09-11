const bcrypt = require("bcryptjs");
const {
  findUserByPhone,
  findUserById,
  findTechnicianById,
  getUsers,
  updateUser,
  updateUserStatus,
  updateUserRole,
  updatePreferredLanguage,
  deleteUser,
  getTechnicianOfficeIds,
  createUser,
} = require("../services/user.service");
const {
  getOfficesByIds,
  findOfficeByCode,
} = require("../services/office.service");
const {
  replaceTechnicianOffices,
} = require("../services/technicianOffice.service");

async function createUserByAdmin(req, res, next) {
  try {
    const {
      fullName,
      phoneNumber,
      password,
      preferredLanguage,
      officeId,
      role,
    } = req.body;

    const existingUser = await findUserByPhone(phoneNumber);
    if (existingUser) {
      const error = new Error("Phone number is already registered.");
      error.statusCode = 409;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      fullName,
      phoneNumber,
      password: hashedPassword,
      preferredLanguage,
      officeId,
      role,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function createTechnicianByAdmin(req, res, next) {
  try {
    const { fullName, phoneNumber, password, preferredLanguage } = req.body;
    const existingUser = await findUserByPhone(phoneNumber);
    if (existingUser) {
      const error = new Error("Phone number is already registered.");
      error.statusCode = 409;
      return next(error);
    }

    const itOffice = await findOfficeByCode("IT");
    if (!itOffice || !itOffice.isActive) {
      const error = new Error(
        "The IT office is not configured or is inactive.",
      );
      error.statusCode = 500;
      return next(error);
    }

    const user = await createUser({
      fullName,
      phoneNumber,
      password: await bcrypt.hash(password, 10),
      preferredLanguage,
      officeId: itOffice.id,
      role: "TECHNICIAN",
    });
    await replaceTechnicianOffices(user.id, [itOffice.id]);

    return res.status(201).json({
      message: "Technician created successfully.",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword } = req.body;

    const user = await findUserById(id);
    if (!user) {
      const error = new Error("Authenticated user not found.");
      error.statusCode = 401;
      return next(error);
    }

    const userWithPassword =
      await require("../config/db").prisma.user.findUnique({
        where: { id },
        select: { password: true },
      });

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password,
    );
    if (!isPasswordValid) {
      const error = new Error("Current password is incorrect.");
      error.statusCode = 401;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await require("../config/db").prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const { page, pageSize, search, role, isActive } = req.query;
    const data = await getUsers({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search,
      role,
      isActive,
    });

    return res.status(200).json({
      message: "Users retrieved successfully.",
      ...data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      message: "User retrieved successfully.",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function getTechnicianOfficeAssignments(req, res, next) {
  try {
    const officeIds = await getTechnicianOfficeIds(req.params.id);
    return res.status(200).json({ officeIds });
  } catch (error) {
    return next(error);
  }
}

async function getMyTechnicianOfficeAssignments(req, res, next) {
  try {
    const officeIds = await getTechnicianOfficeIds(req.user.id);
    return res.status(200).json({ officeIds });
  } catch (error) {
    return next(error);
  }
}

async function updateUserById(req, res, next) {
  try {
    const { id } = req.params;
    const {
      fullName,
      phoneNumber,
      preferredLanguage,
      officeId,
      role,
      isActive,
    } = req.body;

    const updated = await updateUser(id, {
      fullName,
      phoneNumber,
      preferredLanguage,
      officeId,
      role,
      isActive,
    });

    return res.status(200).json({
      message: "User updated successfully.",
      user: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUserStatusById(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await updateUserStatus(id, isActive);

    return res.status(200).json({
      message: "User status updated successfully.",
      user: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUserRoleById(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updated = await updateUserRole(id, role);

    return res.status(200).json({
      message: "User role updated successfully.",
      user: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function updatePreferredLanguageByMe(req, res, next) {
  try {
    const { id } = req.user;
    const { preferredLanguage } = req.body;

    const updated = await updatePreferredLanguage(id, preferredLanguage);

    return res.status(200).json({
      message: "Preferred language updated successfully.",
      user: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUserById(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      const error = new Error("You cannot delete your own account.");
      error.statusCode = 403;
      return next(error);
    }

    const deletedUser = await deleteUser(id);

    return res.status(200).json({
      message: "User deleted successfully.",
      user: deletedUser,
    });
  } catch (error) {
    return next(error);
  }
}

async function assignTechnicianOffices(req, res, next) {
  try {
    const technicianId = req.params.id;
    const { officeIds } = req.body;

    const technician = await findTechnicianById(technicianId);
    if (!technician) {
      const error = new Error("Technician not found.");
      error.statusCode = 404;
      return next(error);
    }

    if (technician.role !== "TECHNICIAN") {
      const error = new Error("User is not a technician.");
      error.statusCode = 400;
      return next(error);
    }

    const existingOffices = await getOfficesByIds(officeIds);
    if (existingOffices.length !== officeIds.length) {
      const error = new Error("One or more office IDs are invalid.");
      error.statusCode = 404;
      return next(error);
    }

    await replaceTechnicianOffices(technicianId, officeIds);

    return res.status(200).json({
      message: "Technician office assignments updated successfully.",
      technicianId,
      officeIds,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createUserByAdmin,
  createTechnicianByAdmin,
  changePassword,
  listUsers,
  getUserById,
  getTechnicianOfficeAssignments,
  getMyTechnicianOfficeAssignments,
  updateUserById,
  updateUserStatusById,
  updateUserRoleById,
  updatePreferredLanguageByMe,
  deleteUserById,
  assignTechnicianOffices,
};
