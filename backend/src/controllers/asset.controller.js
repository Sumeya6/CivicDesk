const { getAssets, findAssetById, getAssetWithTickets, createAsset, updateAsset, archiveAsset, getAssetsByEmployee, getAssetsByTechnicianOffices } = require("../services/asset.service");
const { successResponse, createdResponse, paginatedResponse } = require("../utils/response");

const VALID_ASSET_TYPES = ["COMPUTER", "PRINTER", "NETWORK_DEVICE", "PHONE", "FURNITURE", "OTHER"];
const VALID_ASSET_STATUSES = ["ACTIVE", "MAINTENANCE", "RETIRED", "ARCHIVED"];

function error(message, statusCode = 400) {
  const result = new Error(message);
  result.statusCode = statusCode;
  return result;
}

async function listAssets(req, res, next) {
  try {
    const { page, pageSize, search, status, officeId, employeeId, assetType } = req.query;
    const data = await getAssets({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      search,
      status,
      officeId,
      employeeId,
      assetType,
    });
    return res.status(200).json(paginatedResponse("Assets retrieved successfully.", data.assets, data.meta));
  } catch (requestError) {
    return next(requestError);
  }
}

async function getAssetById(req, res, next) {
  try {
    const asset = await getAssetWithTickets(req.params.id);
    if (!asset) {
      throw error("Asset not found.", 404);
    }
    return res.status(200).json(successResponse("Asset retrieved successfully.", asset));
  } catch (requestError) {
    return next(requestError);
  }
}

async function createAssetHandler(req, res, next) {
  try {
    const { assetTag, name, assetType, serialNumber, status, officeId, employeeId, purchaseDate, warrantyExpiry, notes } = req.body;
    if (!assetTag?.trim() || !name?.trim() || !officeId) {
      throw error("Asset tag, name, and office are required.", 422);
    }
    if (!VALID_ASSET_TYPES.includes(assetType)) {
      throw error("Invalid asset type.", 422);
    }
    if (status && !VALID_ASSET_STATUSES.includes(status)) {
      throw error("Invalid asset status.", 422);
    }
    const asset = await createAsset({ assetTag: assetTag.trim(), name: name.trim(), assetType, serialNumber, status, officeId, employeeId, purchaseDate, warrantyExpiry, notes });
    return res.status(201).json(createdResponse("Asset created successfully.", asset));
  } catch (requestError) {
    if (requestError.code === "P2002") {
      const err = new Error("Asset tag already exists.");
      err.statusCode = 409;
      return next(err);
    }
    return next(requestError);
  }
}

async function updateAssetById(req, res, next) {
  try {
    const { assetTag, name, assetType, serialNumber, status, officeId, employeeId, purchaseDate, warrantyExpiry, notes } = req.body;
    if (assetType && !VALID_ASSET_TYPES.includes(assetType)) {
      throw error("Invalid asset type.", 422);
    }
    if (status && !VALID_ASSET_STATUSES.includes(status)) {
      throw error("Invalid asset status.", 422);
    }
    const asset = await updateAsset(req.params.id, { assetTag, name, assetType, serialNumber, status, officeId, employeeId, purchaseDate, warrantyExpiry, notes });
    return res.status(200).json(successResponse("Asset updated successfully.", asset));
  } catch (requestError) {
    if (requestError.code === "P2002") {
      const err = new Error("Asset tag already exists.");
      err.statusCode = 409;
      return next(err);
    }
    return next(requestError);
  }
}

async function archiveAssetById(req, res, next) {
  try {
    const asset = await archiveAsset(req.params.id);
    return res.status(200).json(successResponse("Asset archived successfully.", asset));
  } catch (error) {
    return next(error);
  }
}

async function listMyAssets(req, res, next) {
  try {
    const assets = await getAssetsByEmployee(req.user.id);
    return res.status(200).json(successResponse("Assets retrieved successfully.", assets));
  } catch (error) {
    return next(error);
  }
}

async function listTechnicianAssets(req, res, next) {
  try {
    const assets = await getAssetsByTechnicianOffices(req.user.id);
    return res.status(200).json(successResponse("Assets retrieved successfully.", assets));
  } catch (error) {
    return next(error);
  }
}

module.exports = { listAssets, getAssetById, createAssetHandler, updateAssetById, archiveAssetById, listMyAssets, listTechnicianAssets };
