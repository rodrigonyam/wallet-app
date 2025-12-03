# Production WSGI server configuration
bind = "0.0.0.0:8000"
workers = 2
worker_class = "sync"
worker_connections = 1000
timeout = 600
keepalive = 5
max_requests = 1000
max_requests_jitter = 100
preload_app = True
reload = False

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "azure-openai-demo"

# Server mechanics
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (handled by Azure App Service)
keyfile = None
certfile = None