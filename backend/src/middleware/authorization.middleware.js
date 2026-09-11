function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      const error = new Error(
        "Forbidden. You do not have permission to access this resource.",
      );
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
}

module.exports = {
  authorizeRoles,
};
