export default function Logger(req, res, next) {
  if (!req.body) req.body = {};
  const start = Date.now();
  const RequestLog = `Request Start - ${new Date().toISOString()} | ${req.method} ${req.path}`;
  console.log(RequestLog);
  console.log(`*****Request Body******* \n${JSON.stringify(req.body)}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    const ResponseLog = `Response End - ${new Date().toISOString()} | ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    console.log(ResponseLog);
  });
  next();
}
