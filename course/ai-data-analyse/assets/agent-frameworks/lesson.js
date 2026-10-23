'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sources = {
  dsh:['DSH 官方仓库','https://github.com/deepseek-ai/deepseek-harness'],
  dshWeb:['DSH Web 使用与模型配置','https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/index.md'],
  dshDeploy:['DSH 反向代理部署','https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/public-deployments.md'],
  labProject:['DSH Research Lab 项目介绍','https://milulab.com/project/dsh-research-lab'],
  lab:['Research Lab 源码与操作手册','https://github.com/milulab/dsh-research-lab'],
  dify:['Dify Docker Compose 部署','https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose'],
  difyCode:['Dify 代码节点','https://docs.dify.ai/en/cloud/use-dify/nodes/code'],
  coze:['Coze Studio 开源版','https://github.com/coze-dev/coze-studio'],
  claude:['Claude Agent SDK 概念','https://code.claude.com/docs/en/agent-sdk/overview'],
  claudeStart:['Claude Agent SDK 快速开始','https://code.claude.com/docs/en/agent-sdk/quickstart'],
  langchain:['LangChain 概念','https://docs.langchain.com/oss/python/langchain/overview'],
  langchainInstall:['LangChain 安装','https://docs.langchain.com/oss/python/langchain/install'],
  langgraph:['LangGraph 概念','https://docs.langchain.com/oss/python/langgraph/overview'],
  education:['UCI Student Performance 数据','https://archive.ics.uci.edu/dataset/320/student+performance'],
  health:['UCI Heart Disease 数据','https://archive.ics.uci.edu/dataset/45/heart+disease'],
  docker:['Docker Desktop 安装','https://docs.docker.com/desktop/'],
  python:['Python 官方下载','https://www.python.org/downloads/'],
  node:['Node.js 官方下载','https://nodejs.org/en/download']
};
const link = id => `<a href="${sources[id][1]}" target="_blank" rel="noopener">${esc(sources[id][0])} ↗</a>`;
const frameworks = {
  dify:{type:'可视化 AI 应用平台 · 本讲主线 A',name:'Dify',desc:'用节点和连线把数据输入、计算、模型解释组织成流程。适合把一套相对固定的分析步骤交给同事重复使用。',input:'表单、文本或文件；数据类型和变量要逐节点映射。',output:'工作流结果、Web 应用或 API；服务端运行计算与模型调用。',cost:'上手快，但统计依赖、文件解析、复杂逻辑仍要代码或外部服务。',scene:'本讲先用数值数组做描述统计，再扩展为“统计 API → 模型解释”。',recipe:'dify-install',source:'dify'},
  coze:{type:'可视化智能体平台',name:'Coze / 扣子',desc:'在可视化环境里组合提示词、知识库、插件和工作流，适合做可对话的数据问答助手，再接入计算服务。',input:'用户消息与已配置资源；插件提供外部能力。',output:'对话、工作流结果与应用接口。发布渠道取决于使用的产品版本。',cost:'要维护资源与插件权限。云端扣子与自部署 Coze Studio 的能力、账号和发布范围要分别确认。',scene:'做一个“上传脱敏数据 → 调用统计工具 → 回答追问”的教学助手。',recipe:'coze-start',source:'coze'},
  dsh:{type:'插件化 Agent Harness · 本讲主线 B',name:'DSH · DeepSeek Harness',desc:'围绕模型执行循环组合插件，提供 Web / CLI 等入口，让智能体读取工作区、调用工具并观察运行结果。它是执行科研任务的底座。',input:'任务目标、项目工作区、模型配置与插件。',output:'工具执行结果、会话与文件产物。具体科研能力来自另外配置的项目和工具。',cost:'需要 Node.js、模型凭据与工作区权限；开发预览阶段应冻结版本。',scene:'让它读取 Research Lab 的协议，调用 Python 管线，再根据真实输出解释。',recipe:'dsh-start',source:'dsh'},
  lab:{type:'基于 DSH 的科研应用模板 · 不是独立基础框架',name:'DSH Research Lab',desc:'把研究协议、Skill、计算脚本与数据包组合成科研工作台。DSH 负责调度，Python 负责统计，教师确认方法和结论。',input:'公开数据、数据字典、预先确定的分析协议与领域知识。',output:'results.json、report.md、CSV 表格、PNG 图，以及可共享的源码包。',cost:'换数据时要重写协议、字典与预期结果，重新验收。已有脚本可独立运行，接入 DSH 后才演示模型调度。',scene:'教育：学习行为与成绩关联；公卫：心脏病风险分类与验证。',recipe:'lab-run',source:'labProject'},
  claude:{type:'将智能体运行能力接入代码的 SDK',name:'Claude Agent SDK',desc:'在 Python 或 TypeScript 应用里使用 Claude Code 的智能体循环、内置工具、权限与会话能力。适合把智能体嵌入自己的业务系统。',input:'程序给定的任务、工作目录、工具许可和模型凭据。',output:'流式消息、工具调用与工作区文件。界面和对外服务由开发者实现。',cost:'需要开发与服务运维。普通模型 API 客户端只提供模型访问；Agent SDK 进一步提供执行循环。',scene:'在院系科研系统里增加“运行分析并解释结果”的后台任务。',recipe:'claude-start',source:'claude'},
  langchain:{type:'模型与工具组合库',name:'LangChain',desc:'提供模型集成、工具与 create_agent 等抽象，便于在代码里组装任务。适合需要切换模型或复用多种工具的团队。',input:'消息、模型、工具函数及系统提示。',output:'Agent 消息与工具执行结果；业务报告按自己的数据契约生成。',cost:'需要写代码和管理依赖。工具函数、错误处理和权限仍由开发者设计。',scene:'把既有的统计函数封装为工具，让模型选择调用并解释结果。',recipe:'langchain-start',source:'langchain'},
  langgraph:{type:'有状态的图编排框架 · 常见误写 Langraph',name:'LangGraph',desc:'显式定义状态、节点和条件边，适合混合确定性处理与模型决策，控制循环、暂停和恢复。可以独立使用，也可作为 LangChain Agent 的底层。',input:'状态对象、节点函数与流转规则。',output:'更新后的状态、事件与最终产物；持久化需要配置检查点存储。',cost:'控制更细，也需要自己定义状态模式、持久化和运行服务。调用 compile() 生成的是可执行图对象。',scene:'数据审计不通过就退回；方法待教师确认时暂停；确认后再建模。',recipe:'langgraph-start',source:'langgraph'}
};
let frameworkId = 'dify';
function showFramework(id){
  frameworkId=id; const f=frameworks[id];
  $$('#frameworks [data-framework]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.framework===id)));
  $('#framework-detail').innerHTML=`<p class="type">${esc(f.type)}</p><h3>${esc(f.name)}</h3><p>${esc(f.desc)}</p><dl><dt>输入什么</dt><dd>${esc(f.input)}</dd><dt>得到什么</dt><dd>${esc(f.output)}</dd><dt>需要承担什么</dt><dd>${esc(f.cost)}</dd></dl><p>${esc(f.scene)}</p><a class="text-link" href="#practice" data-recipe-link="${f.recipe}">进入这条路线的实操 ↗</a><p>${link(f.source)}${id==='lab'?' · '+link('lab'):''}</p>`;
}
$$('[data-framework]').forEach(b=>b.addEventListener('click',()=>showFramework(b.dataset.framework)));
$$('[data-goal]').forEach(b=>b.addEventListener('click',()=>{
  const goal=b.dataset.goal;
  $$('[data-goal]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  $$('[data-lane]').forEach(x=>x.classList.toggle('dim',goal!=='all'&&x.dataset.lane!==goal));
  if(goal!=='all')showFramework({visual:'dify',harness:'lab',code:'langgraph'}[goal]);
}));

const flows=[
  ['开始','values_text · String','声明输入 values_text，填入 JSON 数值数组，例如 [72,81,65,90,76]。这个最小版本不直接处理 Excel 文件。','输入：字符串 → 输出：原样传给代码节点'],
  ['代码','解析与描述统计','把 values_text 映射到代码节点同名参数，解析 JSON，检查长度、类型与数值是否有限。计算 n、均值、样本标准差、最小值和最大值。','输出：ok(Boolean)、stats_json(String)、error(String)'],
  ['条件分支','检查 ok','ok=true 才进入模型；ok=false 进入错误输出。空数组、字符串、布尔值等都应被挡在这里。','成功 → LLM；失败 → 错误模板 → 输出'],
  ['LLM','解释真实计算结果','用户消息仅引用代码节点 stats_json。系统提示限制模型只能解释已有指标，不补造显著性、置信区间或因果结论。','输入：统计 JSON → 输出：简洁描述与局限'],
  ['模板','整理报告','成功分支把统计 JSON 和 LLM 的 text 放进报告模板；失败分支返回代码节点 error。两个分支分别连接各自的输出节点。','输出：Markdown 报告 / 可读错误信息'],
  ['输出','发布前先试跑','先在预览中跑正常、空数组、错误类型三种输入，再发布 Web App。检查最终公开的是应用入口而不是编辑后台。','交付：应用链接 + 输入示例 + 使用说明']
];
function showFlow(i){$$('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.flow)===i)));$('#flow-detail').innerHTML=`<h3>${i+1}. ${esc(flows[i][0])}</h3><p>${esc(flows[i][2])}</p><code>${esc(flows[i][3])}</code>`;}
$('#flow').innerHTML=flows.map((f,i)=>`<button data-flow="${i}" aria-pressed="false"><small>${String(i+1).padStart(2,'0')} / ${esc(f[0])}</small><strong>${esc(f[1])}</strong></button>`).join('');
$$('[data-flow]').forEach(b=>b.addEventListener('click',()=>showFlow(Number(b.dataset.flow))));
function demo(){try{const v=JSON.parse($('#values').value);if(!Array.isArray(v)||v.length<2||v.length>10000||v.some(n=>typeof n!=='number'||!Number.isFinite(n)))throw Error('请输入 2–10000 个有限数值组成的 JSON 数组。');const mean=v.reduce((a,b)=>a+b,0)/v.length;const sd=Math.sqrt(v.reduce((a,b)=>a+(b-mean)**2,0)/(v.length-1));if(!Number.isFinite(mean)||!Number.isFinite(sd))throw Error('数值过大，计算溢出；请检查数据单位。');$('#demo-output').textContent=JSON.stringify({n:v.length,mean:+mean.toFixed(4),sample_sd:+sd.toFixed(4),min:Math.min(...v),max:Math.max(...v)},null,2);}catch(e){$('#demo-output').textContent='输入检查未通过：'+e.message;}}
$('#run-demo').addEventListener('click',demo);

const labs={
  health:{tag:'HealthResearch / UCI Cleveland / 原始 303 例',title:'哪些因素与心脏病状态有关？',body:'先审计缺失与标签映射，再用 297 个完整案例运行建模与验证。管线输出关联检验、OR、交叉验证、ROC 与校准，供课堂复核。历史观察性病例仅用于教学。',task:'课堂动作：打开 results.json，核对训练 / 测试划分，追问“交叉验证 AUC 与测试 AUC 为什么不同？”不要把测试集上选出的阈值称为已通过独立验证。',domain:'public-health / health-research',images:[['health-roc.png','ROC：观察区分能力','核对测试集、标签定义和 AUC 来源；单次划分的表现不能直接推广。'],['health-calibration.png','校准：观察概率是否可信','区分排序能力与概率质量，结合 Brier 分数检查。']]},
  education:{tag:'EduResearch / UCI 葡语课 / 649 名学生 × 33 字段',title:'学习行为与成绩如何关联？',body:'先审计数据类型，再进行关联分析、M1 多元回归与诊断。M2 加入 G1/G2 早期成绩作信息时点对照，提醒学员根据预测时点判断可用特征。',task:'课堂动作：核对 M1 与 M2 的公式、残差和调整 R²。G1/G2 在预测时是否已知决定能否使用，不能只因拟合变好就更换研究问题。观察性结果按关联解释。',domain:'education / edu-research',images:[['education-m1.png','M1：不含 G1/G2 的模型','检查残差结构与异常点，再回到诊断输出确认是否需要稳健推断。'],['education-m2.png','M2：加入 G1/G2 的对照','这组图对应不同的信息集。解释拟合变化前，先核对研究目标与数据时点。']]}
};
function showLab(id){const l=labs[id];$$('[data-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===id)));$('#lab-story').innerHTML=`<p class="tagline">${esc(l.tag)}</p><h3>${esc(l.title)}</h3><p>${esc(l.body)}</p><p>${esc(l.task)}</p><p>${link('labProject')} · ${link(id)} · ${link('lab')}</p>`;$('#domain-label').textContent=l.domain;$('#lab-evidence').innerHTML=l.images.map(([file,title,desc])=>`<figure><img src="./assets/agent-frameworks/${file}" width="${file.startsWith('health')?780:1050}" height="${file.startsWith('health')?780:675}" loading="lazy" alt="${esc(title)}，Research Lab 实际计算输出"><figcaption><b>${esc(title)}</b>${esc(desc)}</figcaption></figure>`).join('');}
$$('[data-case]').forEach(b=>b.addEventListener('click',()=>showLab(b.dataset.case)));

// All code and prompts below are teaching material; this page never executes shell commands.
const codeNode=`def main(values_text: str) -> dict:
    import json, math, statistics
    try:
        values = json.loads(values_text)
        if not isinstance(values, list) or not 2 <= len(values) <= 10000:
            raise ValueError("需要 2–10000 个数值")
        if any(type(x) not in (int, float) or not math.isfinite(x) for x in values):
            raise ValueError("只接受有限数值，不接受文本、空值或布尔值")
        stats = dict(n=len(values), mean=statistics.mean(values),
                     sample_sd=statistics.stdev(values),
                     min=min(values), max=max(values))
        if any(not math.isfinite(x) for x in stats.values()):
            raise ValueError("数值过大，请检查单位")
        return {"ok": True, "stats_json": json.dumps(stats, ensure_ascii=False), "error": ""}
    except (ValueError, TypeError, OverflowError) as e:
        return {"ok": False, "stats_json": "{}", "error": str(e)}`;
const recipeData=[
 {id:'environment',title:'0. 检查与准备环境',intro:'课堂推荐 Python 3.12（打包脚本用了 Path.walk），Node.js 22 LTS。Dify / Coze 自部署另需 Docker 与 Compose；不要求一次装完全部框架。',prompt:'请先识别我的操作系统、CPU 架构、终端和已有环境，检查 Git、Python 3.12、Node.js、npm、Docker 与 Docker Compose。列出缺少的部分，并按我选择的路线只安装需要的组件。macOS 优先使用已有 Homebrew，Windows 使用官方安装器或已有 winget；Dify 自部署使用已启用 WSL2 的 Docker Desktop。不要覆盖已有项目或全局配置。逐步执行，输出实际版本和每步验收结果。安装过程中需要输入的凭据让我在本机填写，不要回显。',unix:String.raw`# 先检查，缺少时按下方官方链接安装
git --version
python3.12 --version
node --version
npm --version
docker --version
docker compose version

# macOS 已安装 Homebrew 时，可安装本讲依赖
brew install git python@3.12 node@22
brew install --cask docker
# 从应用程序启动 Docker Desktop，再执行 docker info
docker info
# Linux 的 Python / Node / Docker 请按发行版官方说明安装。`,windows:String.raw`# PowerShell：逐个检查
git --version
py -3.12 --version
node --version
npm --version
docker --version
docker compose version

# 有 winget 时安装缺少的软件（逐个按需执行）
winget install --id Git.Git -e
winget install --id Python.Python.3.12 -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
# Dify：先按 Docker 文档启用 WSL2；重启并启动 Docker Desktop
# 新开终端复查。winget 的 LTS 版本可能高于课堂基线。`,accept:'DSH 路线能运行 Python / Node；可视化平台自部署能运行 docker info。Dify Compose ≥2.24，最低2核4GiB；macOS Docker 虚拟机按官方建议分配至少8GiB。',refs:['python','node','docker','dify']},
 {id:'dify-install',title:'1. 安装与配置 Dify',intro:'可先用 Dify 云端跳过部署。自部署按当前官方 Compose 文档操作，在课堂前固定所用 release 标签并保留版本记录。以下命令在 Bash 中运行。',prompt:'请按 Dify 官方 Docker Compose 文档 https://docs.dify.ai/en/self-host/deploy/quick-start/docker-compose 帮我部署课堂环境。先检查 Docker 与 Compose 版本、内存和80端口，再获取官方最新 release 标签并记录，不要使用未冻结的开发分支。克隆到新目录，复制 .env.example，生成 DIFY_AGENT_LOCAL_SANDBOX_AUTH_TOKEN 写入 .env，保留原有配置且不打印密钥。启动并检查服务；初始化权限任务退出属正常。打开 /install 初始化账号，指导我在模型供应商设置中配置可用模型和密钥并做一次测试。若是 Windows，使用 WSL Bash 并把项目放在 Linux 文件系统。最后给我启动、查看日志和停止命令。',unix:String.raw`# 已安装 Git、curl、jq、openssl、Docker Compose ≥2.24
# macOS 缺 jq 时：brew install jq
RELEASE_TAG=$(curl -fsSL https://api.github.com/repos/langgenius/dify/releases/latest | jq -r .tag_name)
test -n "$RELEASE_TAG" && test "$RELEASE_TAG" != null || exit 1
git clone --branch "$RELEASE_TAG" --depth 1 https://github.com/langgenius/dify.git dify-class
cd dify-class/docker
cp .env.example .env
openssl rand -base64 32
# 把生成值填进 .env 的 DIFY_AGENT_LOCAL_SANDBOX_AUTH_TOKEN
# 如80端口占用，修改 .env 中 EXPOSE_NGINX_PORT 并记住新地址
docker compose up -d
docker compose ps
docker compose logs --tail 60 api
# 浏览器打开 http://localhost/install
# 初始化后：设置 → 模型供应商 → 配置密钥与可用模型 → 测试
# 课堂后停止但保留数据：docker compose stop`,windows:String.raw`# Windows：本步骤改用 WSL Bash，不要直接粘贴到 PowerShell。
# 先在 Docker Desktop 开启对应发行版的 WSL Integration。
wsl
cd ~
# 在 WSL 安装 git / curl / jq / openssl 后，执行本步骤
# macOS / Linux 选项中给出的完整 Bash 命令。
# 数据留在 ~/dify-class，不放在 /mnt/c。
# 浏览器访问 http://localhost/install。`,accept:'初始化页面可访问，管理员能登录，模型连接测试通过；docker compose ps 无异常服务。记录 release 标签、访问端口与实际版本。',refs:['dify']},
 {id:'dify-flow',title:'2. 搭建数据分析工作流',intro:'采用数值数组输入，先练通变量映射和失败分支。下面的 Python 只使用标准库，可复制到代码节点；完成后用真实 Dify 预览验证。',prompt:'请帮我在 Dify 中建立“数值描述统计”Workflow。先检查当前界面是否可操作；无法操作就给出逐节点指导。开始节点创建必填 String 变量 values_text。代码节点同名接入，解析 JSON 数组，只接受2到10000个有限数值，拒绝布尔、空值和错误类型，使用 Python 标准库计算 n、mean、sample_sd、min、max；返回 ok:Boolean、stats_json:String、error:String。If/Else 按 ok 分支：成功时把 stats_json 给 LLM，只解释已有描述统计，不编造 p 值、置信区间或因果；经模板输出 Markdown。失败时把 error 经错误模板直接输出，不经过 LLM。请明确每条变量映射和输出类型，使用界面的变量选择器插入引用。用 [72,81,65,90,76]、[]、[true,1] 验证。最后列出节点配置与预览结果。',unix:String.raw`# 这里是 Dify 界面配置，不是在终端执行
1. 工作室 → 创建应用 → Workflow
2. 开始：values_text / String / 必填
3. 代码：Python，输入 values_text 选择“开始.values_text”
   输出变量：ok / Boolean；stats_json / String；error / String

# 代码节点粘贴：
${codeNode}

4. 条件分支：选择“代码.ok 等于 true”
5. 成功 → LLM（先选择已配置的模型）
   System：你是统计报告助手。仅使用传入JSON里的已有数字。
   解释 n、均值、样本标准差和范围，说明缺少研究设计信息。
   不生成p值、置信区间、显著性、因果或医学建议。
   User：用变量选择器插入“代码.stats_json”
6. 成功模板：映射 stats=代码.stats_json，text=LLM.text
   模板：统计输出：{{ stats }}\n解释：{{ text }}
   → 成功输出节点：report=模板.output
7. 失败模板：映射 error=代码.error
   模板：输入检查未通过：{{ error }}
   → 失败输出节点：report=失败模板.output
8. 预览测试三种输入，查看每个节点实际值

# 正常样例的计算应为：n=5，mean=76.8
# sample_sd≈9.4181，min=65，max=90
# [] 和 [true,1] 必须走失败分支`,accept:'正常输入输出可核对的统计量；错误输入绕过 LLM。数字来自代码节点，模型只负责解释。高级统计通过受控 Python API 扩展。',refs:['difyCode'],same:true},
 {id:'dify-publish',title:'3. 发布 Dify 给别人用',intro:'发布应用后复制 Web App 链接，先完成一次他人访问测试。自部署实例需要持续运行并具备可达地址；localhost 只指访问者自己的电脑。',prompt:'请帮我发布刚才的 Dify 描述统计工作流。先完成正常与错误输入预览，再发布并取得 Web App 地址。检查链接是否能被目标学员访问，不要把编辑后台或 localhost 当成公网入口。若使用自部署，先按当前版本设置外部访问URL、域名和HTTPS，核对代理和插件回调地址；密钥留服务端。导出不带凭据的 DSL 作为课堂备份，说明接收者仍需配置模型与依赖。使用另一浏览器或让同学打开测试一次，提供一段可转发的使用说明：接受JSON数组、最多10000项、仅做描述统计。请生成说明供我手动转发。',unix:String.raw`# Dify 界面：预览通过 → 发布 → 运行应用 → 复制 Web App 地址
# 不同版本发布菜单略有变化，以当前界面为准
# 工作室应用菜单 → 导出 DSL，留存 .yml
# 另一工作区导入 DSL 后，重新绑定模型 / 插件 / 密钥

# 自部署：仍在 dify-class/docker 目录
docker compose ps
# 在服务器 .env 配置当前版本的外部URL：
# CONSOLE_WEB_URL=https://dify.example.com
# CONSOLE_API_URL=https://dify.example.com
# APP_WEB_URL=https://dify.example.com
# SERVICE_API_URL=https://dify.example.com
# APP_API_URL=https://dify.example.com
# FILES_URL=https://dify.example.com
# 修改后按官方配置说明重新创建服务
docker compose up -d
# 域名需已指向服务器，并由反向代理提供HTTPS
# 最后复制应用实际生成的 /workflow/... 入口，勿手写猜测ID`,windows:String.raw`# 云端 Dify：全部在浏览器完成，流程同 macOS / Linux。
# 自部署：在 WSL 中进入 ~/dify-class/docker
# 按左侧发布步骤配置外部URL，再执行：
docker compose up -d
docker compose ps
# 不把 http://localhost/... 作为分享给异地学员的地址。`,accept:'另一个浏览器 / 学员能打开应用并提交样例。交付链接、样例和 DSL 备份；账号和模型密钥不进入分享材料。',refs:['dify']},
 {id:'dsh-start',title:'4. 启动与配置 DSH',intro:'固定课堂基线 0.2.1-rc.2。先用 Web 设置模型与工作区，再让它执行项目任务。不同 profile 的模型配置需要分别核实。',prompt:'请安装课堂指定的 @deepseek-ai/dsh@0.2.1-rc.2，核对版本，先阅读 dsh --help 与 dsh web --help，再启动本地 Web UI。不要用0.0.0.0，保留默认回环地址。引导我在 Settings → Models 配置 DeepSeek API key 并测试；密钥由我在本机填写，不回显也不写到公开仓库。选择我的 dsh-research-lab 项目作为工作区，开始会话并只读概述项目。不要假设 web 的凭据已自动用于 headless；如果需要 headless，先按官方指南验证其独立配置。请给出本机实际访问地址、模型测试结果和工作目录。',unix:String.raw`node --version
npm install -g @deepseek-ai/dsh@0.2.1-rc.2
dsh --version
dsh web --help
# 进入已下载的 Research Lab 根目录后启动
dsh web
# 默认 http://127.0.0.1:3080；使用终端打印的实际入口
# Settings → Models → 填本机API key → 保存与测试
# Choose workspace → 添加 Research Lab 根目录 → 选中
# 新会话：请只读概述本项目 README 和分析协议

# 只查看配置字段结构，不输出真实凭据
dsh --profile web --dump-config-schema
# 若需要 headless，按官方 provider 文档配置其独立profile
# dsh headless "只读概述本项目 README"`,windows:String.raw`node --version
npm install -g @deepseek-ai/dsh@0.2.1-rc.2
dsh --version
dsh web --help
# PowerShell 进入 Research Lab 目录后：
dsh web
# 在 Settings → Models 配置并测试模型
# Choose workspace 选择项目根目录，再发起会话
dsh --profile web --dump-config-schema
# 若 npm.ps1 被系统策略阻止，可使用 npm.cmd 安装
# 或在已准备好 Node 的 WSL Bash 环境里运行整条DSH路线`,accept:'版本符合基线；Web 连接模型成功；能读取选定工作区的 README。DSH 可以调用工具不等于已经安装科研领域能力。',refs:['dsh','dshWeb']},
 {id:'lab-run',title:'5. 跑通教育与公卫实验',intro:'无模型密钥也能先跑 Python 管线。此时验证的是计算层；接入 DSH 后再让智能体调用它，观察真实工具执行记录。',prompt:'请在新目录克隆 https://github.com/milulab/dsh-research-lab.git，记录 commit 和项目版本。使用 Python 3.12 建独立虚拟环境并安装 requirements.txt，不修改全局Python。阅读 README、两个数据集 protocol.md 和数据字典；保持 raw 只读。依次运行 examples/education-demo/run_t1_t5.py、examples/health-demo/run_h1_h5.py 和 scripts/verify.py。汇总每步退出状态与实际输出路径；任何失败先定位原因，不改预期结果来凑验收。然后逐项打开 results.json、report.md、tables、figures，任选一个关键统计量与 expected 中结果核对。没有成功执行时不得报告统计数字。',unix:String.raw`git clone https://github.com/milulab/dsh-research-lab.git
cd dsh-research-lab
git rev-parse HEAD
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python examples/education-demo/run_t1_t5.py
python examples/health-demo/run_h1_h5.py
python scripts/verify.py
# 输出目录：examples/education-demo/outputs/
#           examples/health-demo/outputs/
# 打开 report.md，并对照 results.json / tables / figures
# 每次新开终端先激活 .venv，再运行脚本`,windows:String.raw`git clone https://github.com/milulab/dsh-research-lab.git
cd dsh-research-lab
git rev-parse HEAD
py -3.12 -m venv .venv
# 直接用虚拟环境解释器，避免激活策略问题
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe examples/education-demo/run_t1_t5.py
.\.venv\Scripts\python.exe examples/health-demo/run_h1_h5.py
.\.venv\Scripts\python.exe scripts/verify.py
# 输出在两个 examples 子目录的 outputs/ 中`,accept:'两套管线都完成且 verify 总验收通过；用实际执行结果判断，不在讲义里硬编码“通过项数”。能指出一条结论对应的 JSON 字段与计算脚本。',refs:['lab','education','health']},
 {id:'lab-agent',title:'6. 让 DSH 调度科研任务',intro:'先走兼容性更直观的路径：会话中显式读取 Skill 与协议，再调用脚本。Preset 是复用角色与规程的配置；现有安装脚本假设特定 DSH 源码布局，npm 安装时可能跳过。',prompt:'你现在位于 dsh-research-lab 根目录。先阅读 README、skills/research-design/SKILL.md、skills/data-intake/SKILL.md、skills/data-quality/SKILL.md、skills/statistical-modeling/SKILL.md 和 skills/evidence-traceability/SKILL.md。以教育实验为第一轮，先读对应 protocol.md 和数据字典，向我展示分析计划与输出契约并等待我确认方法。确认后用项目 .venv 的Python运行 examples/education-demo/run_t1_t5.py，再运行 scripts/verify.py --suite education，读取真实 outputs/results.json 与 report.md 进行解释，报告每个数字的来源，不得编造缺失指标。第二轮迁移到公卫：说明哪些工具复用、哪些协议和字段需要更换，再经我确认运行对应管线。最后列出工具执行记录、结果文件和人工复核点。',unix:String.raw`# 在 Research Lab 根目录，并已激活Python虚拟环境
source .venv/bin/activate
dsh web
# 选定本项目工作区，将左侧任务提示词发给DSH
# 如没有自动继承虚拟环境，让它使用 .venv/bin/python

# 进阶：已有完整 DSH 源码并已构建时，安装命名Preset
# 先确认 DSH_DIR/apps/cli/config/agent-presets 确实存在
# 把下面路径换成你的实际源码目录
DSH_DIR=/path/to/deepseek-harness bash scripts/install.sh --preset edu-research
DSH_DIR=/path/to/deepseek-harness bash scripts/install.sh --preset health-research
# 仅用于脚本兼容的源码布局；成功后在该运行时Web中确认Preset可选
# npm布局不匹配时，使用上方显式读取规程的路径。
# 复制到源码目录并不保证全局npm启动的DSH会加载它。`,windows:String.raw`# 推荐先用显式读取规程的路径：
dsh web
# 选定工作区，复制左侧提示词
# 在提示词中让DSH调用 .venv\Scripts\python.exe

# 定向核验可手动执行
.\.venv\Scripts\python.exe scripts/verify.py --suite education
.\.venv\Scripts\python.exe scripts/verify.py --suite health
# 现有Preset安装脚本为Bash且假设源码布局。
# 若要安装命名Preset，在WSL完整源码环境使用对应Bash命令，
# 或按当前DSH版本官方配置指南注册，不强行复制到未知目录。`,accept:'看到实际 Python 工具调用、退出状态及生成文件。模型的回答与 results.json 对得上；运行普通脚本和智能体调度应分别演示。',refs:['lab','dshWeb']},
 {id:'lab-custom',title:'7. 制作自己的领域 Agent',intro:'以现有模板为起点。更换数据后，重新建立协议和验证基准，避免沿用教育或公卫实验的结论。',prompt:'请在 dsh-research-lab 中为我的新研究任务制作 my-domain 智能体。先向我收集研究问题、观察单位、数据字典、结果变量和数据许可，不猜字段。阅读 templates/new-domain 与 docs/customize-agent.md，复制模板后明确 domain.yml、protocol.md、SKILL.md、数据来源与SHA256；只复用适用的 tools。新增 examples/my-domain-demo/run_a1_a5.py 和独立复算脚本，并在 scripts/verify.py 注册新的 my-domain suite，禁止只创建空目录声称已完成。清空旧数据锚点，经过人工方法确认后实际计算新的预期结果。加入正常输入与缺列失败场景，运行新suite。最后制作命名Preset，并说明当前DSH版本如何加载。',unix:String.raw`# Research Lab 根目录：先读模板，再复制
cp -R templates/new-domain domains/my-domain
mkdir -p datasets/my-domain/raw datasets/my-domain/processed
mkdir -p datasets/my-domain/metadata datasets/my-domain/expected
mkdir -p skills/my-domain-analysis
cp templates/new-domain/SKILL.md skills/my-domain-analysis/SKILL.md
cp -R presets/research-lab presets/my-domain

# 手工编辑：
# domains/my-domain/domain.yml 与 protocol.md
# metadata/source.yml 与 data_dictionary.csv
# skills/my-domain-analysis/SKILL.md
# presets/my-domain/preset.yml 与 agent.cordis.yml
# 新增 examples/my-domain-demo/run_a1_a5.py 与独立复算
# 在 scripts/verify.py 中注册 my-domain suite

# 完成上述代码和登记后才能执行（当前仓库不自带此suite）
python examples/my-domain-demo/run_a1_a5.py
python scripts/verify.py --suite my-domain`,windows:String.raw`# Research Lab 根目录
Copy-Item templates/new-domain domains/my-domain -Recurse
New-Item -ItemType Directory -Force datasets/my-domain/raw
New-Item -ItemType Directory -Force datasets/my-domain/processed
New-Item -ItemType Directory -Force datasets/my-domain/metadata
New-Item -ItemType Directory -Force datasets/my-domain/expected
New-Item -ItemType Directory -Force skills/my-domain-analysis
Copy-Item templates/new-domain/SKILL.md skills/my-domain-analysis/SKILL.md
Copy-Item presets/research-lab presets/my-domain -Recurse
# 按macOS/Linux栏列出的文件逐项编辑并编写新管线与验收。
# 新suite注册完成后：
.\.venv\Scripts\python.exe examples/my-domain-demo/run_a1_a5.py
.\.venv\Scripts\python.exe scripts/verify.py --suite my-domain`,accept:'新数据有自己的来源、协议、计算与复核。正常样例生成真实报告，缺列样例拒绝继续。新suite真实通过后再进入分发。',refs:['lab']},
 {id:'lab-package',title:'8. 构建、打包与分发',intro:'Research Lab v0.2.0 构建脚本生成源码压缩包及 SHA256，不生成独立可执行程序。脚本用了 Path.walk，构建机使用 Python 3.12+。DSH 前端源码才需要 pnpm 构建。',prompt:'请在当前 Research Lab 项目使用 Python 3.12+运行总验收，全部通过再运行 scripts/build_package.py。检查压缩包内容和SHA256，确认不含密钥、.venv或私有数据。解包到一个新的临时目录并建立全新虚拟环境，重新安装依赖、运行教育和公卫管线及 verify，不要借用原目录环境。给接收者生成安装说明，说明这是源码包、需要Python依赖，DSH模型配置另行完成。若要发布，先准备release标题、变更和附件供我检查；本步骤只生成可分享的本地材料。不要把未经验证的包称为独立可执行软件。',unix:String.raw`# Python 3.12+；Research Lab根目录
python --version
python scripts/verify.py
python scripts/build_package.py
# 仅前一条命令成功后继续下一步
ls dist
# macOS：在dist目录验包
cd dist
shasum -a 256 -c dsh-research-lab-0.2.0-checksums.sha256
# Linux：sha256sum -c dsh-research-lab-0.2.0-checksums.sha256
# 将实际.tar.gz复制给同学，解到新目录按README重新安装与验收

# 可选：只有开发DSH源码界面/插件时才走源码构建
# 在另外的完整deepseek-harness源码目录：
# pnpm install
# pnpm run build
# pnpm dsh web
# 这不会把Research Lab自动编译为单个可执行文件`,windows:String.raw`# 使用Python 3.12+，Research Lab根目录
.\.venv\Scripts\python.exe scripts/verify.py
.\.venv\Scripts\python.exe scripts/build_package.py
Get-ChildItem dist
# 按实际生成的zip文件名替换占位符
Get-FileHash dist/<实际文件名>.zip -Algorithm SHA256
Get-Content dist/dsh-research-lab-0.2.0-checksums.sha256
# 比对哈希后，在新目录解包
Expand-Archive dist/<实际文件名>.zip -DestinationPath <新目录>
# 在解包项目中重新建立venv、安装依赖、运行两套实验与verify`,accept:'新目录和独立环境也能通过验收。交付源码包、校验和、版本与运行说明；修改项目版本后请同步替换命令中的版本号。',refs:['lab','dsh']},
 {id:'lab-deploy',title:'9. 服务器部署与访问',intro:'DSH 是可执行本地命令的工作区工具。课堂给指定学员开放时，用独立用户、专用目录、HTTPS 与访问控制；每组独立实例，先验证输出再分享入口。',prompt:'请为我的已验收Research Lab准备一份受控服务器部署方案和可执行配置。先确认服务器系统、SSH账号、域名、目标用户和证书条件，不猜服务器地址。使用独立低权限用户与专用目录，安装冻结版本的DSH及Python依赖，先在服务器跑verify。DSH只监听127.0.0.1:3080，由Nginx提供HTTPS、保留Host并转发WebSocket；使用当前版本支持的public-url和trusted-host，补充systemd服务配置、实际绝对路径和服务端模型凭据配置。额外设置代理层访问认证，每组独立工作区，检查API key、raw只读和目录权限。先用SSH端口转发做验收，公网DNS与证书准备好后才应用公网配置。输出可分享入口与运行维护说明，不自动把链接发送给任何人。',unix:String.raw`# 在服务器：已解包项目、建立venv、安装依赖
source .venv/bin/activate
python scripts/verify.py
# 设置服务端Web模型与专用工作区，然后保持进程运行
dsh web --no-open --host 127.0.0.1 --port 3080

# 先在学员本机另一个终端建立SSH隧道（替换用户和地址）
ssh -N -L 3080:127.0.0.1:3080 <user>@<server>
# 通过本机3080访问服务打印的实际入口（含运行凭证）

# 域名/证书/代理认证都就绪后，服务端启动参数：
dsh web --no-open --host 127.0.0.1 --port 3080 \
  --public-url https://research.example.com/ \
  --trusted-host research.example.com

# Nginx示例，放在已配置TLS的server {}内；域名是占位符
# 代理层账号先用服务器工具创建到 /etc/nginx/research.htpasswd
location / {
    auth_basic "Research classroom";
    auth_basic_user_file /etc/nginx/research.htpasswd;
    proxy_pass http://127.0.0.1:3080;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cookie_flags ~ secure;
}
# 由管理员在确认配置后执行 nginx -t，再重载服务。
# 长期运行用systemd，设置专用User、WorkingDirectory、绝对ExecStart，
# PATH包含项目.venv/bin与Node目录，重启后再次验证。
# trusted-host只做Host校验，用户认证仍由运行凭证与代理认证完成。`,windows:String.raw`# 服务器侧推荐Linux，按macOS/Linux栏在服务器执行。
# Windows本机PowerShell可用OpenSSH做验收隧道：
ssh -N -L 3080:127.0.0.1:3080 <user>@<server>
# 浏览器通过本机3080打开服务端打印的实际入口。
# 公网分享前完成HTTPS、认证、独立用户与工作目录隔离。
# localhost本身不是远程学员可直接访问的服务器地址。`,accept:'服务器实验验收通过；授权用户可访问，未授权浏览器被挡住；WebSocket可用，重启后服务恢复。只有静态报告可以单独托管，实时智能体需要持续运行的后端。',refs:['dshDeploy','lab']},
 {id:'coze-start',title:'拓展 A. Coze 起步',intro:'云端扣子可以直接建助手。若要本地安装，以下使用开源 Coze Studio，发布能力和资源与云端产品分别确认。',prompt:'请帮助我用Coze制作一个数据分析问答助手，先确认我用云端扣子还是开源Coze Studio。若自部署，按 https://github.com/coze-dev/coze-studio 当前README在新目录安装，检查Docker、Compose及内存，启动后注册账号并配置模型。创建助手，把研究边界写入系统提示，先用固定的描述统计工作流作为工具，再测试追问。统计通过代码或外部API真实执行；没有计算结果就不编造数字。明确云端与自部署版可用的发布方式，做一次他人访问测试，并记录实际版本和操作路径。',unix:String.raw`# 自部署Coze Studio；Docker服务已运行
git clone https://github.com/coze-dev/coze-studio.git
cd coze-studio
git rev-parse HEAD
make web
# 注册：http://localhost:8888/sign
# 模型管理：http://localhost:8888/admin/#model-management
# 应用：http://localhost:8888/
# 创建Agent → 配置系统提示、知识与统计工作流 → 测试 → 发布
# 模型服务配置与界面以当前版本为准`,windows:String.raw`git clone https://github.com/coze-dev/coze-studio.git
cd coze-studio
Copy-Item ./docker/.env.example ./docker/.env
docker compose -f ./docker/docker-compose.yml up
# Docker Desktop已运行，按README准备所需组件
# 注册：http://localhost:8888/sign
# 模型管理：http://localhost:8888/admin/#model-management
# 云端扣子：直接在网页创建，无需以上部署命令`,accept:'能对话且能调用真实统计步骤。把插件返回的数字和最终回答逐项核对；发布方式与所用版本一致。',refs:['coze']},
 {id:'claude-start',title:'拓展 B. Claude Agent SDK',intro:'这个最小例子先只读项目文档，验证 SDK 循环和工具权限。完整分析需要另行设计计算工具、允许执行的动作及服务部署。',prompt:'请在独立目录创建Claude Agent SDK的Python最小示例，按 https://code.claude.com/docs/en/agent-sdk/quickstart 安装claude-agent-sdk，检查当前版本。通过本机环境变量配置ANTHROPIC_API_KEY，不写入代码或回显。用query和ClaudeAgentOptions，工作目录只指向一份教学项目，只允许Read与Glob，读取README并概述输入输出，先不允许Bash或文件写入。实际运行并报告工具调用与响应。如果下一步做统计，先设计受控计算工具及权限、结果JSON契约和人工确认节点，再扩展；不要把一次普通模型API请求当成完整智能体。',unix:String.raw`mkdir claude-research-demo
cd claude-research-demo
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install claude-agent-sdk
export ANTHROPIC_API_KEY='<在本机填写>'
# 保存为 agent.py，替换cwd为教学项目的绝对路径
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        cwd="/absolute/path/to/teaching-project",
        allowed_tools=["Read", "Glob"],
        max_turns=3,
    )
    async for message in query(
        prompt="只读README，概述项目数据输入和输出，不运行脚本。",
        options=options,
    ):
        print(message)

asyncio.run(main())

# 终端：python agent.py`,windows:String.raw`mkdir claude-research-demo
cd claude-research-demo
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install claude-agent-sdk
$env:ANTHROPIC_API_KEY='<在本机填写>'
# 保存macOS/Linux栏中的Python代码为agent.py
# cwd换成Windows绝对路径，如 r"C:\Users\you\teaching-project"
.\.venv\Scripts\python.exe agent.py
# 当前SDK通常附带Claude Code二进制；若当前平台不含，按官方文档补装。`,accept:'SDK实际读取允许的文档并返回消息。密钥、账号模型可用性与计费独立确认；SDK本身不会替你生成公开站点。',refs:['claude','claudeStart']},
 {id:'langchain-start',title:'拓展 C. LangChain 工具调用',intro:'把确定性的 Python 函数注册成工具。这里用固定演示数组验证调用链，接真实数据前再设计文件读取、权限和字段检查。',prompt:'请创建LangChain最小数据分析Agent，按官方当前create_agent API安装langchain与langchain-anthropic。用独立虚拟环境和ANTHROPIC_API_KEY环境变量，模型ID从我账号可用模型中选择并通过MODEL_ID传入，不要猜。将固定教学数组[72,81,65,90,76]的均值函数注册为工具，要求模型先调用工具再解释。运行后打印工具消息与最终响应，核对均值76.8；不允许未调用工具就宣称已计算。记录依赖版本，下一步再把输入参数化并加入错误输入检查。',unix:String.raw`mkdir langchain-research-demo
cd langchain-research-demo
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install langchain langchain-anthropic
export ANTHROPIC_API_KEY='<在本机填写>'
export MODEL_ID='<账号中实际可用的Claude模型ID>'
# 保存为 agent.py
import os
from langchain.agents import create_agent
from langchain_anthropic import ChatAnthropic

def demo_mean() -> float:
    """计算固定教学样例的真实均值。"""
    values = [72, 81, 65, 90, 76]
    return sum(values) / len(values)

agent = create_agent(
    model=ChatAnthropic(model=os.environ["MODEL_ID"]),
    tools=[demo_mean],
    system_prompt="先调用demo_mean，再依据返回值解释，不补造指标。",
)
result = agent.invoke({"messages": [
    {"role": "user", "content": "计算演示数组的均值并解释"}
]})
for message in result["messages"]:
    print(message)

# 终端：python agent.py
# python -m pip freeze > requirements-lock.txt`,windows:String.raw`mkdir langchain-research-demo
cd langchain-research-demo
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install langchain langchain-anthropic
$env:ANTHROPIC_API_KEY='<在本机填写>'
$env:MODEL_ID='<实际可用的Claude模型ID>'
# 保存macOS/Linux栏中的Python代码为agent.py
.\.venv\Scripts\python.exe agent.py`,accept:'输出中存在 demo_mean 的真实工具调用及返回值76.8，最终文字与工具值一致。需要可分享服务时另封装API、鉴权和前端。',refs:['langchain','langchainInstall']},
 {id:'langgraph-start',title:'拓展 D. LangGraph 状态图',intro:'先用不依赖模型的图理解状态与分支。compile() 构建可执行图，不等于编译成程序包；接入模型、检查点和人工中断是后续扩展。',prompt:'请创建LangGraph最小可运行示例：TypedDict状态包含values、ok、mean和error。audit节点检查至少2个有限数值，条件边把成功送到compute、失败直接到END；compute计算均值。使用StateGraph、START、END、compile与invoke。分别运行正常数组和空数组，打印最终状态，证明失败时未执行计算。这个例子不调用模型；请另画出以后增加“人工确认→模型解读→结果核验”节点的位置，并说明真正的暂停恢复需要interrupt和持久化checkpointer，不能只加一个名叫人工确认的普通节点。',unix:String.raw`mkdir langgraph-research-demo
cd langgraph-research-demo
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install langgraph
# 保存为 graph.py
import math
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict, total=False):
    values: list[float]
    ok: bool
    mean: float
    error: str

def audit(s):
    v = s.get("values")
    ok = (isinstance(v, list) and len(v) >= 2 and
          all(type(x) in (int, float) and math.isfinite(x) for x in v))
    return {"ok": ok, "error": "" if ok else "输入不符合数据契约"}

def compute(s):
    return {"mean": sum(s["values"]) / len(s["values"])}

builder = StateGraph(State)
builder.add_node("audit", audit)
builder.add_node("compute", compute)
builder.add_edge(START, "audit")
builder.add_conditional_edges("audit", lambda s: "compute" if s["ok"] else END)
builder.add_edge("compute", END)
graph = builder.compile()
print(graph.invoke({"values": [72, 81, 65, 90, 76]}))
print(graph.invoke({"values": []}))

# 终端：python graph.py
# 实际工程再配置interrupt、checkpointer与thread_id以暂停/恢复。`,windows:String.raw`mkdir langgraph-research-demo
cd langgraph-research-demo
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install langgraph
# 保存macOS/Linux栏中的Python代码为graph.py
.\.venv\Scripts\python.exe graph.py
# 此示例不需要模型密钥；输出正常均值与失败状态。`,accept:'正常数组最终状态含mean=76.8；空数组只有失败状态，不产生均值。能区分确定性状态图、带模型节点的Agent及完整在线服务。',refs:['langgraph']}
];
let recipeId='environment';
const basePrompt='\n\n执行规则：先检查当前目录与已有配置。每一步给出真实执行结果和验收依据，失败就停在当前步定位问题。涉及凭据让我在本机填写，不回显；不要修改原始数据、覆盖无关项目或直接发送消息给别人。';
function manual(r){return $('#platform').value==='windows'&&!r.same?r.windows:r.unix;}
function showRecipe(id){
  recipeId=id;const r=recipeData.find(x=>x.id===id);if(!r)return;
  $$('[data-recipe]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.recipe===id)));
  const i=recipeData.indexOf(r);
  $('#recipe-detail').innerHTML=`<h3>${esc(r.title)}</h3><p class="intro">${esc(r.intro)}</p><div class="dual-path"><div class="path"><h4>交给 AI 执行 <button class="copy" data-copy="prompt">复制提示词</button></h4><pre id="prompt-code">${esc(r.prompt+basePrompt)}</pre></div><div class="path"><h4>自己操作 <button class="copy" data-copy="manual">复制命令 / 配置</button></h4><pre id="manual-code">${esc(manual(r))}</pre></div></div><p class="accept"><strong>完成标志：</strong>${esc(r.accept)}</p><p class="source">依据：${r.refs.map(link).join(' · ')}</p><div class="recipe-next"><button data-step="-1" ${i===0?'disabled':''}>← 上一步</button><button data-step="1" ${i===recipeData.length-1?'disabled':''}>下一步 →</button></div>`;
}
$('#recipe-list').innerHTML=recipeData.map(r=>`<button data-recipe="${r.id}" aria-pressed="false">${esc(r.title)}</button>`).join('');
$$('[data-recipe]').forEach(b=>b.addEventListener('click',()=>{showRecipe(b.dataset.recipe);if(innerWidth<700)$('#recipe-detail').scrollIntoView({block:'start'});}));
$('#platform').addEventListener('change',()=>showRecipe(recipeId));
let toastTimer;
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
document.addEventListener('click',async e=>{
  const route=e.target.closest('[data-recipe-link]');if(route)showRecipe(route.dataset.recipeLink);
  const copy=e.target.closest('[data-copy]');if(copy){const text=$(copy.dataset.copy==='prompt'?'#prompt-code':'#manual-code').textContent;try{await navigator.clipboard.writeText(text);toast('已复制，可粘贴到你的工具中');}catch{const range=document.createRange();range.selectNodeContents($(copy.dataset.copy==='prompt'?'#prompt-code':'#manual-code'));const s=getSelection();s.removeAllRanges();s.addRange(range);toast('请按 Ctrl/Cmd + C 复制已选内容');}}
  const step=e.target.closest('[data-step]');if(step){const i=recipeData.findIndex(r=>r.id===recipeId)+Number(step.dataset.step);if(recipeData[i]){showRecipe(recipeData[i].id);$('#recipe-detail').scrollIntoView({block:'start'});}}
});
$('#download-notes').addEventListener('click',()=>{
 const txt='# 第7讲：智能体框架与搭建实操\n\n核对日期：2026-10-23\n系统：'+$('#platform').selectedOptions[0].textContent+'\n\n'+recipeData.map(r=>`## ${r.title}\n\n${r.intro}\n\n### 交给AI\n\n${r.prompt+basePrompt}\n\n### 手工命令与配置\n\n\x60\x60\x60text\n${manual(r)}\n\x60\x60\x60\n\n完成标志：${r.accept}\n\n依据：${r.refs.map(id=>sources[id].join('：')).join('\n')}\n`).join('\n');
 const url=URL.createObjectURL(new Blob([txt],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='第7讲-智能体搭建双路径讲义.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('讲义已生成，包含当前系统的全部步骤');
});
$('#source-links').innerHTML=Object.keys(sources).map(link).join('');
showFramework('dify');showFlow(0);showLab('health');showRecipe('environment');demo();
