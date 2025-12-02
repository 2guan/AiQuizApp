# General AI Quiz Web APP / 通用AI出题答题网页应用

## 📖 Introduction / 项目简介

**General AI Quiz Web APP** is a modern online knowledge competition platform built with **Next.js** and **AI Large Language Models (LLM)**. It integrates intelligent question generation, online quizzing, automatic scoring, competition management, and user management. It aims to provide an efficient and flexible solution for enterprises, schools, and organizations to conduct knowledge assessments and competitions.

**通用AI出题答题系统** 是一个基于 **Next.js** 和 **AI大模型** 技术构建的现代化在线知识竞赛平台。该系统集成了智能出题、在线答题、自动评分、竞赛管理、用户管理等核心功能，旨在为企业、学校及各类组织提供一个高效、灵活的知识考核与竞赛解决方案。

The Web APP supports administrators to quickly generate questions (including text and image-based questions) via AI, and also supports manual entry. Users can participate in different competitions, and the Web APP will automatically record the time taken and scores, generating a leaderboard.

系统支持管理员通过AI快速生成题目（包括文本和图片题目），同时也支持手动录入。用户可以参与不同的竞赛，系统会自动记录答题时间与分数，并生成排行榜。

## ✨ Key Features / 核心功能

### 1. 🤖 AI Intelligent Question Generation / AI智能出题
- **Multi-mode Generation**: Automatically generate single-choice, multiple-choice, and other question types based on keywords or topics.
  - **多模式生成**：支持根据关键词或主题自动生成单选题、多选题等多种题型。
- **Intelligent Explanation**: AI automatically generates detailed answer explanations for each question to help users understand the knowledge points.
  - **智能解析**：AI自动为每道题目生成详细的答案解析，帮助用户理解知识点。
- **Batch Generation**: Support generating multiple questions at once to significantly improve efficiency.
  - **批量生成**：支持一次性生成多道题目，大幅提高出题效率。

### 2. 🏆 Competition Management / 竞赛管理
- **Multi-Competition Support**: Administrators can create multiple independent competitions, each with its own question bank and records.
  - **多竞赛支持**：管理员可以创建多个独立的竞赛活动，每个竞赛拥有独立的题库和记录。
- **Personalized Configuration**: Support custom competition titles, subtitles, and cover banner images (supports AI automatic generation of banners).
  - **个性化配置**：支持自定义竞赛标题、副标题及封面Banner图片（支持AI自动生成Banner）。
- **Question Management**: Support adding, deleting, modifying, and querying questions, as well as batch import via Excel.
  - **题目管理**：支持对题目进行增删改查，支持Excel批量导入题目。
- **Status Management**: Open or close competitions at any time.
  - **状态管理**：可随时开启或关闭竞赛。

### 3. 👥 User & Permission Management / 用户与权限管理
- **Role Web APP**: Includes two roles: User and Administrator.
  - **角色体系**：包含普通用户和管理员两种角色。
- **Registration Audit**: New users are in "Pending" status by default and need administrator approval to login, ensuring Web APP security.
  - **注册审核**：新注册用户默认为“待审核”状态，需管理员批准后方可登录，确保系统安全。
- **User Management**: Administrators can view the user list, audit, delete, or reset passwords.
  - **用户管理**：管理员可查看用户列表，进行审核、删除或重置密码等操作。

### 4. 📝 Online Quizzing & Scoring / 在线答题与评分
- **Immersive Quizzing**: Clean and beautiful quiz interface with countdown timer.
  - **沉浸式答题**：简洁美观的答题界面，支持倒计时功能。
- **Real-time Feedback**: Scores, time taken, and detailed explanations are displayed immediately after the quiz ends.
  - **实时反馈**：答题结束后立即显示分数、用时及详细的错题解析。
- **Anti-Cheating**: Supports randomizing options (configurable) and limiting quiz time.
  - **防作弊**：支持随机乱序选项（需配置），限制答题时间。

### 5. 📊 Statistics & Leaderboard / 数据统计与排行榜
- **Leaderboard**: Automatically generates real-time leaderboards based on scores and time taken.
  - **排行榜**：按分数和用时自动生成实时排行榜，展示前几名优秀选手。
- **Quiz Records**: Users can view their own history and detailed scores.
  - **答题记录**：用户可查看自己的历史答题记录和详细得分情况。

### 6. ⚙️ Web APP Settings / 系统设置
- **AI Model Configuration**: Support custom OpenAI-format API Key, Base URL, and model names (e.g., GPT-3.5, GPT-4, Claude, etc.).
  - **AI模型配置**：支持自定义OpenAI格式的API Key、Base URL及模型名称（如GPT-3.5, GPT-4, Claude等）。
- **Global Parameters**: Administrators can configure default question counts, time limits, etc.
  - **全局参数**：管理员可配置默认题目数量、答题时间限制等。

## 🛠️ Tech Stack / 技术栈

This project uses a modern full-stack architecture:
本项目采用现代化的全栈开发架构：

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) (Lightweight, high-performance file database / 轻量级、高性能文件数据库)
- **Math Formulas**: KaTeX (For rendering math formulas / 用于渲染数学公式)
- **Excel Processing**: XLSX (For question import/export / 用于题目导入导出)
- **Deployment**: Docker & Docker Compose

## 🚀 Quick Start / 快速开始

### Prerequisites / 前置要求
- Node.js >= 20.0.0
- npm or yarn
- (Optional) Docker & Docker Compose

### Method 1: Local Development / 方式一：本地开发运行

1.  **Clone the project / 克隆项目**
    ```bash
    git clone <repository-url>
    cd QuizAppG
    ```

2.  **Install dependencies / 安装依赖**
    ```bash
    npm install
    ```

3.  **Run development server / 运行开发服务器**
    ```bash
    npm run dev
    ```

4.  **Access the application / 访问应用**
    Open browser and visit `http://localhost:3000/quiz`
    打开浏览器访问 `http://localhost:3000/quiz`

### Method 2: Docker Deployment (Recommended) / 方式二：Docker 部署 (推荐)

This project provides full Docker support, suitable for production environments.
本项目提供了完整的 Docker 支持，适合生产环境部署。

1.  **Build and start containers / 构建并启动容器**
    ```bash
    docker-compose up -d --build
    ```

2.  **Access the application / 访问应用**
    After startup, the app will run on host port `3100` (default configuration).
    容器启动后，应用将运行在宿主机的 `3100` 端口（默认配置）。
    Visit: `http://localhost:3100/quiz`

3.  **Data Persistence / 数据持久化**
    - Database file will be saved in `./data` directory.
      数据库文件将保存在 `./data` 目录。
    - Uploaded images will be saved in `./public/uploads` directory.
      上传的图片将保存在 `./public/uploads` 目录。

## 📂 Project Structure / 项目结构

```
QuizAppG/
├── src/
│   ├── app/                 # Next.js App Router Pages / 页面路由
│   │   ├── api/             # Backend API Endpoints / 后端 API 接口
│   │   ├── dashboard/       # Admin/User Dashboard / 管理员/用户仪表盘
│   │   ├── [id]/            # Quiz Detail, Taking Quiz, Result / 竞赛详情、答题、结果页
│   │   └── page.tsx         # Login/Register Page / 登录/注册页
│   ├── components/          # Shared Components / 公共组件
│   └── lib/                 # Utils & Database Config / 工具函数与数据库配置
│       ├── db.ts            # SQLite Connection & Schema / SQLite 数据库连接与 Schema
│       └── api.ts           # API Request Wrapper / API 请求封装
├── public/                  # Static Assets / 静态资源
├── data/                    # Database Persistence Directory (Docker) / 数据库持久化目录
├── Dockerfile               # Docker Build File / Docker 构建文件
├── docker-compose.yml       # Docker Compose Config / Docker Compose 配置
├── next.config.ts           # Next.js Config / Next.js 配置
└── package.json             # Project Dependencies / 项目依赖配置
```

## 🔑 Default Account / 默认账号

The Web APP automatically creates a default administrator account upon initialization:
系统初始化时会自动创建默认管理员账号：

- **Username**: `admin`
- **Password**: `admin`

> ⚠️ **Note**: Please change the default password in "User Management" after the first login to ensure security.
> ⚠️ **注意**：首次登录后，请务必在“用户管理”中修改默认密码以保证安全。

## 📖 User Guide / 使用指南

1.  **Admin Login**: Log in with default account `admin/admin`.
    **管理员登录**：使用默认账号 `admin/admin` 登录系统。
2.  **Configure AI**: Go to "AI Settings", enter your AI API Key and Base URL.
    **配置AI**：进入“大模型设置”，输入您的 AI API Key 和 Base URL。
3.  **Create Competition**: Click "Create New Competition" on the dashboard, fill in the title and upload a cover.
    **创建竞赛**：在仪表盘点击“创建新竞赛”，填写标题并上传封面。
4.  **Generate Questions**: Go to competition admin panel, select "Question Management", use "AI Generate" to quickly expand the question bank.
    **生成题目**：进入竞赛后台，选择“题目管理”，使用“AI生成题目”功能快速扩充题库。
5.  **Publish Competition**: Share the competition link with users.
    **发布竞赛**：将竞赛链接分享给用户。
6.  **User Participation**: Users register (requires admin approval), then they can see the competition and start quizzing.
    **用户参与**：用户注册账号（需管理员审核通过）后，即可看到竞赛并开始答题。

## 🤝 Contribution / 贡献

Welcome to submit Issues or Pull Requests to improve this project!
欢迎提交 Issue 或 Pull Request 来改进本项目！

## 📄 License / 许可证

[MIT License](LICENSE)

# AiQuizApp
