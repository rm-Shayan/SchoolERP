export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate body, query, and params combined or separately
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Assign back sanitized and validated data.
      // NOTE (Express 5): `req.query` and `req.params` are getter-only on the
      // request object, so a direct assignment throws. Redefine them instead.
      req.body = parsed.body || req.body;

      if (parsed.query) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          configurable: true,
          writable: true,
          enumerable: true,
        });
      }

      if (parsed.params) {
        Object.defineProperty(req, "params", {
          value: parsed.params,
          configurable: true,
          writable: true,
          enumerable: true,
        });
      }

      return next();
    } catch (error) {
      const issues = error?.issues;
      if (Array.isArray(issues)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: "Validation Error",
          errors: issues.map((err) => ({
            field: err.path?.slice(1).join("."), // e.g. "body.email" -> "email"
            message: err.message,
          })),
        });
      }
      return next(error);
    }
  };
};
