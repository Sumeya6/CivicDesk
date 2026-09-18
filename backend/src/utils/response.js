function successResponse(message, data = null, meta = null) {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return response;
}

function createdResponse(message, data = null, meta = null) {
  return successResponse(message, data, meta);
}

function errorResponse(message, details = null) {
  const response = { success: false, message };
  if (details) response.errors = details;
  return response;
}

function paginatedResponse(message, data, meta) {
  return successResponse(message, data, meta);
}

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse,
};