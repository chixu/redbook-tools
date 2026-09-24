# Word Selector

在仓库根目录执行：

```sh
npm run dev -- wordSelector wordSelector/example.txt
npm run dev -- wordSelector "C:/词表/my words.txt" --port 3001
```

打开命令输出的本地地址。路径以运行命令时的工作目录为基准，含空格时加引号。默认监听 `127.0.0.1`。

文件使用 UTF-8 编码（兼容 BOM、Windows 换行），第一行是表头，后续每行用 `|` 分隔。空行会跳过，单元格首尾空格会去除；允许空备注。每行列数必须与表头一致，第一列作为唯一 key，不能为空、重复或含逗号。

- 点击表头在升序、降序间切换；数字列按数值排序，空值放在最后。
- 默认每页 300 行，可在表格上方输入每页行数（1–10000）并点击“应用”；浏览器会记住该设置。
- 支持首页、上一页、下一页、末页和页码跳转。排序针对整个词表，排序或调整每页行数后回到第一页；翻页不影响已选单词。
- 第一格为复选框，也可以点击整行切换选择；键盘可聚焦复选框后按空格操作。
- 每次修改自动保存，保存期间暂时禁用选择，失败时显示提示。
- `filepath.txt` 的选择保存在旁边的 `filepath.selection` 中，例如 `aaron,abbreviation`。取消全部选择会写入空文件。
- 重启或刷新时恢复选择；文件中已不存在的 key 会被忽略。
- 修改源 TXT 后刷新页面重新加载。运行用户需要读取 TXT 和写入其所在目录的权限。

生产模式：

```sh
npm run build -- wordSelector
npm run start -- wordSelector wordSelector/example.txt
```

构建时无需传入词表。不要同时运行多个进程操作同一份选择文件；单个服务进程内的更新会按顺序写入，并通过临时文件替换保存文件。

验证：

```sh
node --test wordSelector/tests/*.test.mjs
npm run typecheck -- wordSelector
```
