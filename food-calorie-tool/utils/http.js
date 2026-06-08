function sendSuccess(res, data, status = 200, meta) {
  const payload = {
    success: true,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
}

function sendError(res, status, code, message, details) {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
}

module.exports = {
  sendError,
  sendSuccess,
};
