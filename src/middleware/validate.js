/**
 * Request Validation Middleware
 * Validates required fields and optional field types.
 * 
 * Usage:
 *   validate({
 *     required: ['field1', 'field2'],
 *     optional: ['field3'],
 *     types: { field1: 'string', field2: 'number' }
 *   })
 */
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        const body = req.body;

        // Check required fields
        if (schema.required) {
            for (const field of schema.required) {
                if (body[field] === undefined || body[field] === null || body[field] === "") {
                    errors.push(`${field} is required`);
                }
            }
        }

        // Check types
        if (schema.types) {
            for (const [field, expectedType] of Object.entries(schema.types)) {
                if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
                    if (expectedType === "number" && isNaN(Number(body[field]))) {
                        errors.push(`${field} must be a valid number`);
                    }
                    if (expectedType === "string" && typeof body[field] !== "string") {
                        errors.push(`${field} must be a string`);
                    }
                    if (expectedType === "array" && !Array.isArray(body[field])) {
                        errors.push(`${field} must be an array`);
                    }
                    if (expectedType === "date") {
                        const date = new Date(body[field]);
                        if (isNaN(date.getTime())) {
                            errors.push(`${field} must be a valid date`);
                        }
                    }
                    if (expectedType === "enum" && schema.enumValues && schema.enumValues[field]) {
                        if (!schema.enumValues[field].includes(body[field])) {
                            errors.push(`${field} must be one of: ${schema.enumValues[field].join(", ")}`);
                        }
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        next();
    };
};

module.exports = validate;
