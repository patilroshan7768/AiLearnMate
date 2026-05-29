
const fs = require('fs');
const path = require('path');

const modulesToTest = [
    './src/config/database',
    './src/config/swagger',
    './src/models/User',
    './src/models/Course',
    './src/models/Log',
    './src/utils/logger',
    './src/utils/jwt',
    './src/middlewares/auth',
    './src/controllers/authController',
    './src/controllers/courseController',
    './src/controllers/aiController',
    './src/controllers/recommendationController',
    './src/controllers/logController',
    './src/controllers/emailController',
    './src/routes/authRoutes',
    './src/routes/courseRoutes',
    './src/routes/aiRoutes',
    './src/routes/recommendationRoutes',
    './src/routes/logRoutes',
    './src/routes/emailRoutes',
    './server.js' // Finally server
];

async function testImports() {
    for (const mod of modulesToTest) {
        try {
            console.log(`Testing require('${mod}')...`);
            require(mod);
            console.log(`PASS: ${mod}`);
        } catch (error) {
            console.error(`FAIL: ${mod}`);
            console.error(error.toString());
            // We stop at the first failure to avoid cascading errors or confusing output
            process.exit(1);
        }
    }
}

testImports();
