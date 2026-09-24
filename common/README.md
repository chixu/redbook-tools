# 公共文件

这里存放多个 Web 项目共用的样式和约定。共享内容不依赖任何具体项目。

```text
common/
├── styles/
│   ├── index.css       # 公共样式入口
│   ├── tokens.css      # 默认颜色、阴影变量
│   └── base.css        # 基础排版、重置、交互状态
└── rules/
    ├── development.md # 项目边界和开发约定
    └── design.md      # 视觉与交互准则
```

## 接入项目

在 `<项目>/app/layout.tsx` 中先引用公共样式，再引用项目样式：

```tsx
import "../../common/styles/index.css";
import "./globals.css";
```

项目可以在自己的 `globals.css` 中覆盖默认变量，例如：

```css
:root {
  --spruce: #2455a4;
}
```

引用公共入口会应用默认配色、字体、全局重置和焦点样式。只有需要默认变量时，可单独引用 `tokens.css`。
页面布局和业务专用类名放在各项目里。确定有多个项目复用的组件、工具函数或静态资源后，再按需添加 `components/`、`lib/`、`assets/`。

公共规则见 [开发约定](rules/development.md) 和 [设计准则](rules/design.md)。根目录 `AGENTS.md` 引用这些文档，供后续开发时读取；这些文档不是自动执行的 lint 检查。
