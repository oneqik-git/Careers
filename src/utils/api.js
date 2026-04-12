const { validationResult } = require('express-validator');

function sendSuccess(res, { status = 200, data, message, meta, legacy } = {}) {
  const body = { success: true };

  if (message) {
    body.message = message;
  }
  if (data !== undefined) {
    body.data = data;
  }
  if (meta) {
    body.meta = meta;
  }
  if (legacy && typeof legacy === 'object') {
    Object.assign(body, legacy);
  }

  return res.status(status).json(body);
}

function sendError(res, {
  status = 400,
  code = 'REQUEST_FAILED',
  message = 'Request failed',
  details,
  legacy,
} = {}) {
  const body = {
    success: false,
    message,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    body.error.details = details;
    body.errors = details;
  }

  if (legacy && typeof legacy === 'object') {
    Object.assign(body, legacy);
  }

  return res.status(status).json(body);
}

function handleValidationErrors(req, res) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return false;
  }

  const details = errors.array().map(({ path, msg, location, value }) => ({
    field: path,
    message: msg,
    location,
    value,
  }));

  sendError(res, {
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details,
  });

  return true;
}

function getPagination(query, {
  defaultPage = 1,
  defaultLimit = 20,
  maxLimit = 100,
} = {}) {
  const page = Math.max(parseInt(query.page, 10) || defaultPage, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

function buildPaginationMeta({ page, limit, count, ...rest }) {
  return {
    page,
    limit,
    count,
    ...rest,
  };
}

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = {
  asyncHandler,
  buildPaginationMeta,
  getPagination,
  handleValidationErrors,
  sendError,
  sendSuccess,
};
