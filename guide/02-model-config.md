# 配置模型访问

harness 通过模型 API 完成对话与 Agent 任务。本文覆盖两种场景：**官方 API（推荐，最简单）**与**任意 OpenAI 兼容接口**（中转站、聚合网关、私有部署）。

## 场景 A：DeepSeek 官方 API（推荐）

只需一步：在**仓库根目录**创建 `.env`（已被 gitignore，不会提交）：

```sh
DEEPSEEK_API_KEY=sk-你的key
```

key 从 https://platform.deepseek.com 获取。默认模型名（如 `deepseek-v4-pro`）由仓库内置，无需额外配置——这就是绝大多数人该用的方式。

`DEEPSEEK_BASE_URL` 环境变量可覆盖官方地址（默认官方公开 API），一般不用改。

## 场景 B：OpenAI 兼容的自定义接口

适用：使用 OpenAI 风格 `/v1/chat/completions` 协议的中转站、聚合服务或公司内部网关。harness 默认使用官方协议，此类服务需要在**用户级配置**里切换协议并声明模型目录。

> 也可以不改配置文件，直接设 `DEEPSEEK_BASE_URL` 指向兼容地址（见场景 A）。但多数 OpenAI 兼容服务与官方协议存在差异（模型名、参数支持），推荐用本节的完整配置方式，可控性更好。

### 配置文件位置

`<用户主目录>/.dsh/`（Windows 是 `C:\Users\<你>\.dsh\`，macOS/Linux 是 `~/.dsh/`），程序首次启动时自动创建：

| 文件 | 内容 |
|---|---|
| `.env` | `DEEPSEEK_API_KEY=sk-...` |
| `settings.yaml` | 接口地址、协议、模型目录；支持热重载，改完不用重启 |

### settings.yaml 写法

```yaml
llm-deepseek:
  protocol: chat-completions            # 切到 OpenAI 风格协议；官方 API 不需要这行
  baseURL: https://你的服务地址/v1        # 写到 /v1 为止，harness 自动补全路径
  models:                               # 模型目录：界面下拉列表能选哪些
    - id: example-model-a               # 必须与该服务白名单里的模型名一字不差
      name: example-model-a             # 界面显示名；建议与 id 相同，便于排查
      contextWindow: 128000             # 按服务的实际参数填
      maxTokens: 65536
    - id: example-model-b
      name: example-model-b
      contextWindow: 128000
      maxTokens: 16384

agent-default-model:                    # 新会话的默认模型（与 models 是两个独立配置！）
  provider: deepseek-official
  model: example-model-a
```

### 关键概念：models 与 agent-default-model 的分工

这是自定义接口场景最容易踩的坑：

- `llm-deepseek.models` 只是**目录**——决定界面里"可以选哪些"
- `agent-default-model` 才是**默认值**——决定新会话"实际用哪个"；不配置时 harness 使用内置默认模型名，而该名字在第三方服务上通常不存在，请求会报 `service ID does not exist` 一类错误

实用技巧：在界面上**手动选择一次模型**，harness 会把它写回 `agent-default-model`，此后新会话默认使用它。

### 怎么验证模型名

第三方服务的每个 key 都有模型白名单，名字必须完全一致（多一个后缀、少一个版本号都不行）。在改配置前先用一条 curl 确认（把地址、key、模型名换成你的）：

```sh
curl -X POST 'https://你的服务地址/v1/chat/completions' \
  -H 'Authorization: Bearer sk-你的key' \
  -H 'Content-Type: application/json' \
  -d '{"model": "example-model-a", "messages": [{"role": "user", "content": "ok"}], "stream": false, "max_tokens": 8}'
```

- 返回 HTTP 200 + JSON → 名字正确，可写进配置
- `not in allowed list` → 该 key 没有此模型权限
- `service ID does not exist` → 模型名写错，去服务商控制台核对

### 改完之后

1. 保存 `settings.yaml`（热重载生效，无需重启）
2. **刷新页面**（前端缓存了旧模型列表）
3. 发消息验证；不行就在界面模型选择器里手动选一次新模型

## 常见问题速查

| 报错片段 | 原因 | 处理 |
|---|---|---|
| `service ID does not exist` | 模型名服务端不认识 | 核对白名单；检查 `agent-default-model` 是否漏配 |
| `model xxx not in allowed list` | key 没有该模型权限 | 换模型或在服务商后台加权限 |
| 401 / invalid key | key 错误或过期 | 检查 `.env`，注意别混入空格 |
| 改了配置没生效 | 前端缓存 | 刷新页面；仍不行重启程序 |

更多报错见 [04-faq.md](04-faq.md)。
