const {
  getOffices,
  findOfficeById,
  createOffice,
  updateOffice,
  updateOfficeStatus,
  deleteOffice,
  getActiveOfficeOptions,
} = require("../services/office.service");
const { successResponse, createdResponse, paginatedResponse } = require("../utils/response");

async function listOfficeOptions(req, res, next) {
  try {
    const offices = await getActiveOfficeOptions();
    return res.status(200).json(successResponse("Office options retrieved successfully.", offices));
  } catch (error) {
    return next(error);
  }
}

async function listOffices(req, res, next) {
  try {
    const { page, pageSize, search, isActive } = req.query;
    const data = await getOffices({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search,
      isActive,
    });

    return res
      .status(200)
      .json(paginatedResponse("Offices retrieved successfully.", data.offices, data.meta));
  } catch (error) {
    return next(error);
  }
}

async function getOfficeById(req, res, next) {
  try {
    const { id } = req.params;
    const office = await findOfficeById(id);

    if (!office) {
      const error = new Error("Office not found.");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json(successResponse("Office retrieved successfully.", office));
  } catch (error) {
    return next(error);
  }
}

async function createOfficeHandler(req, res, next) {
  try {
    const { code, nameAm, nameEn, isActive } = req.body;
    const office = await createOffice({ code, nameAm, nameEn, isActive });

    return res.status(201).json(createdResponse("Office created successfully.", office));
  } catch (error) {
    return next(error);
  }
}

async function updateOfficeById(req, res, next) {
  try {
    const { id } = req.params;
    const { code, nameAm, nameEn, isActive } = req.body;
    const office = await updateOffice(id, { code, nameAm, nameEn, isActive });

    return res.status(200).json(successResponse("Office updated successfully.", office));
  } catch (error) {
    return next(error);
  }
}

async function updateOfficeStatusById(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const office = await updateOfficeStatus(id, isActive);

    return res
      .status(200)
      .json(successResponse("Office status updated successfully.", office));
  } catch (error) {
    return next(error);
  }
}

async function deleteOfficeById(req, res, next) {
  try {
    const { id } = req.params;
    const office = await deleteOffice(id);

    return res
      .status(200)
      .json(successResponse("Office deleted successfully.", office));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listOffices,
  getOfficeById,
  createOfficeHandler,
  updateOfficeById,
  updateOfficeStatusById,
  deleteOfficeById,
  listOfficeOptions,
};
