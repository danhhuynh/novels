module.exports = {
    apps: [{
        name: "novels-app",
        script: "./server.js",
        instances: "1", // Or "max" for clustering across all CPU cores
        exec_mode: "fork",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
            PORT: 3000
        }
    }]
};
