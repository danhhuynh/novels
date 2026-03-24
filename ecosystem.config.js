module.exports = {
    apps: [
        {
            name: "novels-web",
            script: "./services/web/server.js",
            instances: "1",
            exec_mode: "fork",
            env_file: ".env",
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production"
            }
        },
        {
            name: "novels-auth",
            script: "./services/auth/server.js",
            instances: "1",
            exec_mode: "fork",
            env_file: ".env",
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production"
            }
        }
    ]
};
