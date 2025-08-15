export default function ErrorHandler(err, req, res, next) {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";

  console.error("Error : " + err.message);
  return res.status(statusCode).json({
    statusCode,
    message,
  });
}
