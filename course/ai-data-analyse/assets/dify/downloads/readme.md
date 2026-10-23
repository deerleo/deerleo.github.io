# 公共卫生数据分析 · Dify Cloud 导入包

制作日期：2026-10-23。DSL 格式版本：`0.7.0`，对照 Dify 官方仓库当日 DSL 版本常量及工作流测试样例制作。

## 先选一个文件

| 文件 | 适合什么 | 导入后的准备 |
|---|---|---|
| `公共卫生数据分析_AI解读版.yml` | 课堂演示真实统计计算与 AI 结果解释 | 在节点“06 AI结果解释”选择工作区已配置的模型 |
| `公共卫生数据分析_免模型测试版.yml` | 先验证 Cloud 上的计算与分支，不消耗模型额度 | 无需模型、API 密钥、知识库或自建统计服务 |

两个版本都内置完整 UCI Cleveland 303 条公开记录。计算仅用 Python 标准库，不依赖 pandas、scipy、statsmodels 或 Dify 商店统计插件。

AI 版默认填入的 `langgenius/openai/openai / gpt-4o-mini` 只是一个可替换的模型配置。DSL 不含模型密钥，也不会自动为账号开通额度。你可以换成已经在当前 Dify 工作区配置成功的 DeepSeek、通义、OpenAI 等聊天模型。模型供应商插件如未安装，先在“设置 → 模型供应商”安装和配置，再回节点选模型。更换供应商后检查温度、输出长度等参数是否受支持。

## 导入与第一次测试

1. 进入 <https://cloud.dify.ai/apps> 的工作室。
2. 点击“导入 DSL 文件 / Import DSL file”，选择上述一个 `.yml` 文件，创建应用。应用类型是 **Workflow**。
3. 如果选择 AI 版，打开“06 AI结果解释（请选已配置模型）”，选你自己的可用模型，保存。**不要在工作流代码或提示词中填写密钥**。
4. 点击“测试运行 / Run”。输入栏中的 `csv_text` 和 `research_question` 都可以留空，直接运行。
5. 在输出节点查看 `report`、`audit_json`、`statistics_json`。AI 版还会返回 `factual_report` 与 `ai_interpretation`。
6. 若出现模型未配置或额度不足，修正模型设置；也可先导入免模型版，确认数据计算本身能运行。

这里没有文件上传组件：内置数据可直接运行，换数据时使用下一节的 CSV 文本输入，因此不依赖云端文件提取插件。

## 默认测试的预期结果

| 检查项 | 预期结果 |
|---|---:|
| 原始记录 | 303 |
| 完整案例 | 297 |
| 因必需字段缺失剔除的记录 | 6 |
| `ca` 缺失数 | 4 |
| `thal` 缺失数 | 2 |
| 阳性 | 137 |
| 阴性 | 160 |
| 样本阳性比例 | 46.13% |
| 男性 vs 女性，粗 OR | 3.5739 |
| 年龄≥55 vs <55，粗 OR | 3.3929 |
| 运动诱发心绞痛有 vs 无，粗 OR | 6.9965 |

粗 OR 是根据本数据的 2×2 表计算的**未调整 OR**，与 Research Lab 中多变量 Logistic 回归的调整后 OR 不同。

`测试结果_内置数据报告.md` 与 `测试结果_统计输出.json` 保存了本机实际运行的参考结果。代码中的卡方 / Fisher 结果已与 SciPy 交叉核对，Wilson 区间已与 statsmodels 核对。DSL 图连接、变量引用、Python 代码语法及错误输入分支已做本地检查；**未登录你的 Dify Cloud 工作区实际导入，云端是否成功以你导入后的运行结果为准**。

## 换成自己的数据

先用包内 `测试数据/UCI_Cleveland_303_含表头.csv` 试一次：用文本编辑器打开，全选复制，粘贴进 `csv_text`，运行后应得到相同统计值。不要把 CSV 文件路径填进去。

标准表头为：

```csv
age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal,num
```

- 接受2–1000条记录、15万字符以内的逗号分隔文本；不支持本版本直接读取 `.xlsx`。
- 支持上述标准表头，也支持官方 `processed.cleveland.data` 的无表头14列顺序。
- 列名不区分大小写；有表头时可换列顺序；多余列会忽略，不交给模型。
- 缺失编码支持空值、`?`、`NA`、`N/A`、`null`、`NaN`。对14个必需字段使用完整案例法，不自动插补。
- 缺列、行宽错误、非法编码和非有限数值会拒绝计算；重复记录仅标记并保留，不静默删除。
- 只使用有权处理且已经脱敏的数据。自定义 CSV 的来源、许可及版本由你补充登记。

关键编码：

| 字段 | 含义 / 契约 |
|---|---|
| `age` | 年龄，岁，教学输入检查范围 `(0,120]` |
| `sex` | 原数据编码：0=女性，1=男性 |
| `cp` | 胸痛类型，1/2/3/4 |
| `trestbps` | 静息血压，mmHg |
| `chol` | 血清胆固醇，mg/dL |
| `fbs` | 原数据空腹血糖分类，0/1 |
| `restecg` | 静息心电图分类，0/1/2 |
| `thalach` | 最大心率，次/分钟 |
| `exang` | 运动诱发心绞痛，0/1 |
| `oldpeak` | 相对静息状态的运动ST段压低，非负数 |
| `slope` | ST段斜率类别，1/2/3 |
| `ca` | 原数据造影可见主要血管数，0/1/2/3 |
| `thal` | 原数据类别，3/6/7 |
| `num` | 原始结局0–4；本流程将0映射为阴性，1–4映射为阳性 |

代码中对血压、胆固醇、心率、oldpeak设置了较宽的教学数值上限，只用于挡住明显错误输入；这些上限不是临床正常范围。换成其他数据定义时必须调整契约，不能强行套用编码。

## 工作流结构

```text
开始：内置数据 / 粘贴CSV + 研究问题
  ↓
数据审计：列名、类型、缺失、编码、重复、标签映射
  ↓
条件分支：status == ok ?
  ├─ 否 → 明确的输入修正要求 → 结束
  └─ 是 → Python真实统计 → 事实报告
                              ├─ 免模型版 → 结束
                              └─ AI版 → LLM解释 → 合并报告 → 结束
```

统计范围：

- 样本量、阳性数和阴性数；全体、性别、年龄分组的阳性比例及 Wilson 95%CI。
- 年龄、静息血压、胆固醇、最大心率、oldpeak 的全体及结局分组描述统计。
- 三项探索性比较：性别、年龄≥55 vs <55、运动诱发心绞痛有 vs 无。
- 各比较的2×2表、粗OR、未作多重校正的log-Wald 95%CI；所有期望频数≥5时用Pearson卡方，否则用双侧Fisher检验。
- 对可估计的三项检验做Holm多重比较校正。零单元格时仅OR与区间使用各格+0.5修正，p值仍用原始计数。

**当前工作流不训练分类器，不提供AUC、预测概率、调整后OR或多元回归。** `research_question` 用来组织解释，并不会自动生成新计算。如果问题超出以上固定范围，AI应指出输出不足。

## 课堂可直接用的研究问题

```text
请描述这份病例样本中的结局分布，并比较不同性别和年龄分组的样本阳性比例。
解释三项粗OR和Holm校正p值，指出哪些结果仍需人工确认、哪些不能作因果解释。
```

```text
为什么不能把46.13%直接写成一般人群心脏病患病率？
请结合本次数据来源、完整案例处理及粗OR的定义解释。
```

## AI代操作提示词

如果你使用能操作浏览器的AI工具，可以给它下面的任务。若只有普通聊天工具，它只能提供逐步指导。

```text
请在我已登录的 Dify Cloud 工作室，导入我提供的“公共卫生数据分析_AI解读版.yml”。
先核对文件对应应用类型为Workflow，导入后在“06 AI结果解释”选择当前工作区已经配置成功的聊天模型。
不替我购买额度，不回显密钥，不猜模型可用性。
先将两个输入栏都留空试跑，逐节点查看输入输出，确认303条原始记录、297条完整案例、137阳性、160阴性。
再把“错误样例_结局编码越界.csv”的文本放入csv_text，确认走错误分支、未调用模型且未生成统计结论。
核对最终report与statistics_json的数字一致，给我运行记录与仍需人工核验的点。
如果模型配置不通，先导入“公共卫生数据分析_免模型测试版.yml”完成计算链测试。
本次只导入和测试，不发布为公开应用，不发送消息给别人。
```

## 本地复现与改造

源码目录包含三个代码节点的可读Python文件和DSL构建脚本。课堂运行不需要这些本地安装；只有修改或重建DSL时需要。

```bash
# macOS / Linux，在当前包目录
python3 -m venv .venv
source .venv/bin/activate
python -m pip install pyyaml
python 源码/构建DSL.py
```

```powershell
# Windows PowerShell，在当前包目录
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install pyyaml
.\.venv\Scripts\python.exe 源码/构建DSL.py
```

构建脚本会校验包内原始303条数据的SHA256。`源码/数据审计.py`保留内置数据占位符，由构建脚本在导出的DSL中注入真实数据；因此直接调用这个源码文件并留空输入时，不会自动加载内置数据，应传入CSV文本或使用生成后的DSL代码。

## 来源、许可和版本依据

- 数据：[UCI Heart Disease](https://archive.ics.uci.edu/dataset/45/heart+disease)，Cleveland processed subset，303条、14字段，CC BY 4.0。作者与原始研究引用见UCI页面。数据随包再分发时请保留来源与许可。
- 原研究：Detrano et al. (1989), *International application of a new probability algorithm for the diagnosis of coronary artery disease*, American Journal of Cardiology, 64, 304–310。
- 原始数据SHA256：`a74b7efa387bc9d108d7d0115d831fe9b414b29ae7124f331b622b4efa0427c8`。
- [Dify应用导入与导出](https://docs.dify.ai/en/cloud/use-dify/workspace/app-management)。
- [Dify代码节点与沙箱约束](https://docs.dify.ai/en/cloud/use-dify/nodes/code)。
- [Dify官方DSL版本常量](https://github.com/langgenius/dify/blob/main/api/constants/dsl_version.py)。
- [Dify官方工作流测试样例](https://github.com/langgenius/dify/tree/main/api/tests/fixtures/workflow)。
- [DSH Research Lab 项目介绍](https://milulab.com/project/dsh-research-lab)。

这是一份统计教学工作流。历史观察性病例样本用于练习分析、核验和解释，不用于临床诊断或个体健康决策。
