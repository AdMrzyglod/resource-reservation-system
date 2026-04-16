## 🚀 Getting Started (Docker Commands)

Use these commands to manage the application lifecycle.

### 1. Initial Setup & First Run
Builds images, starts services, runs migrations, and seeds initial data.

```bash
docker-compose --profile init up -d --build
```

### 2. Standard Startup
Starts the environment quickly without re-running initialization.

```bash
docker-compose up -d --build
```

### 3. Stop Services
Stops and removes containers (keeps data intact).

```bash
docker-compose down
```

### 4. Full Reset (Clear Everything)
Stops services and permanently deletes all database volumes.

```bash
docker-compose down -v
```

