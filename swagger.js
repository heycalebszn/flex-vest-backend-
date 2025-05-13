const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./config/swagger.config');

const router = express.Router();

// Serve Swagger documentation
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerConfig));

module.exports = router; 