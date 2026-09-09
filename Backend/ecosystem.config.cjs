module.exports = {
  apps: [
    {
      name: "school-erp",
      script: "src/index.js",
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Auto-restart on crash
      max_restarts: 10,
      min_uptime: "10s",
      // Restart with exponential backoff
      exp_backoff_restart_delay: 100,
      // Memory limit (Suga free trial ~512MB)
      max_memory_restart: "400M",
      // Logging
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
