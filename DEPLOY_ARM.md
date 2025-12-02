# ARM Server Deployment Guide / ARM 架构服务器部署指南

This guide is designed for **ARM architecture** servers (e.g., Huawei Kunpeng, AWS Graviton, Oracle Cloud Ampere, Raspberry Pi, etc.).
本指南专为 **ARM 架构** 服务器（如华为云鲲鹏、AWS Graviton、Oracle Cloud Ampere、树莓派 Raspberry Pi 等）设计。

Since this project uses native modules like `better-sqlite3`, pre-built images for x86_64 cannot be used directly on ARM. **You must build the image locally on the target server.**
由于本项目使用了 `better-sqlite3` 等原生模块，在 ARM 架构下无法直接使用为 x86_64 构建的预编译镜像，因此**必须在目标服务器上进行本地构建**。

## 📋 Prerequisites / 前置要求

Before starting, ensure your server meets the following conditions:
在开始之前，请确保您的服务器满足以下条件：

### 1. Software Environment / 软件环境
- **Docker**: Version >= 20.10
- **Docker Compose**: Version >= 2.0
- **Git**: For cloning the code / 用于拉取代码

### 2. Hardware Recommendations / 硬件建议
- **CPU**: At least 2 cores (ARM64) / 至少 2 核 (ARM64)
- **RAM**: 2GB+ recommended (Building process consumes memory) / 建议 2GB 以上 (构建过程较为耗内存)
- **Disk**: At least 5GB free space / 至少 5GB 可用空间

## 🚀 Deployment Steps / 部署步骤

### Step 1: Get the Code / 第一步：获取代码

Download the project code to your server.
将项目代码下载到您的服务器。

```bash
# Method 1: Git Clone (Recommended) / 方式一：使用 Git 克隆 (推荐)
git clone <repository-url> QuizAppG
cd QuizAppG

# Method 2: Upload Zip / 方式二：上传压缩包
# Unzip after uploading / 将 zip 包上传后解压
unzip QuizAppG.zip
cd QuizAppG
```

### Step 2: Prepare Data Directories & Permissions (Critical) / 第二步：准备数据目录与权限 (关键)

Docker container users may have different permissions than host users. To avoid database write errors or upload failures, we need to pre-create directories and grant broad permissions.
Docker 容器内的用户可能与宿主机用户权限不一致，为了避免数据库无法写入或图片无法上传的问题，我们需要预先创建目录并赋予宽泛的权限。

```bash
# 1. Create persistence directories / 创建数据持久化目录
mkdir -p data
mkdir -p public/uploads

# 2. Grant read/write permissions (777 ensures non-root users in container can write)
# 赋予读写权限 (777 确保容器内非 root 用户也能写入)
chmod -R 777 data
chmod -R 777 public/uploads
```

> ⚠️ **Warning**: If you skip this step, you may encounter `SQLITE_CANTOPEN` or `EACCES` errors.
> ⚠️ **注意**：如果您跳过此步骤，启动时可能会遇到 `SQLITE_CANTOPEN` 或 `EACCES` 错误。

### Step 3: Build Image / 第三步：构建镜像

Building on ARM servers may take **5-15 minutes** depending on CPU performance. Please be patient.
在 ARM 服务器上构建镜像可能需要 **5-15 分钟**，具体取决于 CPU 性能。请耐心等待。

```bash
# Start building / 开始构建
docker-compose build
```

**Build Process Explanation / 构建过程说明**:
1.  Download `node:20-alpine` base image. / 下载基础镜像。
2.  Install `python3`, `make`, `g++` (for compiling sqlite). / 安装编译工具。
3.  Download and compile `better-sqlite3`. / 下载并编译 `better-sqlite3`。
4.  Build Next.js application. / 构建 Next.js 应用。

### Step 4: Start Service / 第四步：启动服务

After building, start the service container.
构建完成后，启动服务容器。

```bash
# Start in background / 后台启动
docker-compose up -d
```

### Step 5: Verify Access / 第五步：验证访问

The service listens on host port **3100** by default.
服务启动后，默认监听宿主机的 **3100** 端口。

- Access URL: `http://<Server-IP>:3100/quiz`
- Default Admin: `admin`
- Default Password: `admin`

## ⚙️ Configuration / 配置说明

### Change Port / 修改端口
If port 3100 is occupied, modify `docker-compose.yml`:
如果 3100 端口被占用，请修改 `docker-compose.yml`：

```yaml
services:
  quiz-app:
    ports:
      - "8080:3000"  # Change 8080 to your desired port / 将 8080 改为您想要的端口
```

### Environment Variables / 环境变量
Main configurations are in `docker-compose.yml`:
目前主要配置已集成在 `docker-compose.yml` 中：
- `NODE_ENV=production`: Production mode / 生产模式
- `DB_PATH=/app/data/quiz.db`: Database path / 数据库路径

## 🔧 Maintenance / 日常维护

### View Logs / 查看日志
```bash
docker-compose logs -f --tail=100
```

### Update Application / 更新应用
```bash
# 1. Pull latest code / 拉取最新代码
git pull

# 2. Rebuild (Mandatory as code changed) / 重新构建 (必须步骤，因为代码变了)
docker-compose build

# 3. Restart service / 重启服务
docker-compose up -d
```

### Backup Data / 备份数据
All important data is in `data` and `public/uploads`. Backup these directories regularly.
所有重要数据都在 `data` 和 `public/uploads` 目录下。建议定期备份这两个目录。

```bash
# Backup example / 备份示例
tar -czvf backup_$(date +%Y%m%d).tar.gz data public/uploads
```

## ❓ Troubleshooting / 常见问题排查

### Q1: `JavaScript heap out of memory` during build
**Cause**: Insufficient server memory (common on 1GB RAM machines).
**原因**：服务器内存不足（通常发生在 1GB 内存的机器上）。
**Solution / 解决**:
1.  Add Swap partition. / 增加 Swap 分区（虚拟内存）。
    ```bash
    # Create 2G swap / 创建 2G 的 swap
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    ```
2.  Rerun build. / 重新运行构建。

### Q2: `SQLITE_CANTOPEN: unable to open database file` after start
**Cause**: Insufficient permissions for `data` directory.
**原因**：`data` 目录权限不足。
**Solution / 解决**:
```bash
chmod -R 777 data
docker-compose restart
```

### Q3: 404 or Blank Page / 页面显示 404 或白屏
**Cause**: Incorrect access path.
**原因**：可能是访问路径错误。
**Solution / 解决**:
Ensure you are accessing `/quiz` path, not root `/`.
请确保访问的是 `/quiz` 路径，而不是根路径 `/`。
Correct URL: `http://ip:3100/quiz`

### Q4: How to reset admin password? / 如何重置管理员密码？
If you forgot the password, you can reset the system by deleting the database file (**Warning: All data will be lost**).
如果忘记密码，可以通过删除数据库文件来重置系统（**警告：会丢失所有数据**）。
```bash
docker-compose down
rm data/quiz.db
docker-compose up -d
```
The system will recreate the database on restart, and password will be reset to `admin`.
系统重启后会自动重建数据库，密码恢复为 `admin`。
