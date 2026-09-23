# redbook-tools

多个独立的 Next.js Web 项目，共用根目录的一套 Next.js、React、TypeScript 依赖和基础配置。

```text
redbook-tools/
├── package.json          # 所有项目共用的依赖和运行命令
├── package-lock.json
├── next.config.mjs       # 公共 Next.js 配置
├── tsconfig.base.json    # 公共 TypeScript 配置
├── scripts/run-project.mjs
└── inventory/            # 独立的库存 Web 项目
    ├── app/
    ├── components/
    ├── lib/
    ├── data/
    ├── next.config.mjs   # 继承公共配置，可在此覆盖项目配置
    └── tsconfig.json     # 继承公共配置，保留项目自己的路径别名
```

## 安装和运行

在仓库根目录执行，依赖只安装一次：

```sh
npm ci
npm run dev -- inventory
npm run typecheck -- inventory
npm run build -- inventory
npm run start -- inventory
```

省略项目名时默认运行 `inventory`。`start` 需要先执行该项目的 `build`。
框架版本统一在根目录 `package.json` 管理。

每个项目使用自己的路由、`.env.local`、`public/`、数据目录和 `.next/` 构建目录。
命令始终以项目目录为工作目录，因此 `process.cwd()` 指向该项目。

## 新增项目

1. 在根目录创建项目文件夹，例如 `reports/`（名称使用字母、数字、连字符或下划线）。
2. 创建自己的 `app/layout.tsx` 和 `app/page.tsx`。
3. 复制 `inventory/next.config.mjs`、`inventory/tsconfig.json` 和 `inventory/next-env.d.ts` 到新项目，按需覆盖项目配置。
4. 执行 `npm run dev -- reports --port 3001`。

新项目无需单独的 `package.json` 或 `node_modules`。需要额外依赖时，在根目录运行 `npm install <包名>`。
不同项目可以在独立终端中同时运行，使用不同端口即可：

```sh
npm run dev -- inventory --port 3000
npm run dev -- reports --port 3001
```
