function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} was not found` });
}

function errorHandler(err, req, res, next) {
  // express.json() reports malformed JSON with a SyntaxError and status 400.
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Request body contains invalid JSON' });
  }
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = status === 500 ? 'An unexpected server error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
