#!/usr/bin/env python3
"""AT-103：生成 assets/showcase/apps.json（102 项），依据 cards.json + 人工条目 + 截图报告。"""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "assets" / "showcase" / "apps.json"
REPORT = Path(__file__).resolve().parent / "shot_report.json"

MANUAL = [
    {
        "slug": "robotics-bench", "title": "Robotics Bench", "subtitle": "机器人电路实验台（镜像学习版）",
        "url": "/apps/robotics-bench/", "category": "独立应用", "tags": ["机器人", "电子电路", "教育"],
        "desc": "Movez 做的浏览器 3D 电子实验室：13 块真实开发板从贴片、回流焊到烙铁焊全程可上手，本站镜像仅供学习，版权归原作者。",
        "credit": "原作者 Movez（@0xMovez）· 镜像学习版",
    },
    {
        "slug": "saltline", "title": "Saltline", "subtitle": "港口潜行小游戏（已授权转载）",
        "url": "/apps/saltline/", "category": "独立应用", "tags": ["独立游戏", "潜行", "程序化生成"],
        "desc": "港务局潜行游戏：剪断三处监控链路再乘船撤离，画面与音效全部在浏览器内程序化生成。",
        "credit": "原作者 Felix Rieseberg（Anthropic）· Claude Fable 5.2 生成 · 已获授权署名转载",
    },
    {
        "slug": "what-the-water-keeps", "title": "What the water keeps", "subtitle": "提灯行舟叙事游戏（已授权转载）",
        "url": "/apps/what-the-water-keeps/", "category": "独立应用", "tags": ["独立游戏", "叙事互动"],
        "desc": "提一盏灯驾小船沿宽阔水道穿行风格迥异的连续场景，也可以任由水流带你漂。",
        "credit": "原作者 Kevin Ngo（@kevin_t_ngo）· 已获授权署名转载",
    },
    {
        "slug": "auditorbench", "title": "AuditorBench", "subtitle": "AI 审计员可靠性评测基准",
        "url": "/project/auditorbench/", "category": "专题页", "tags": ["AI 安全", "审计", "评测基准"],
        "desc": "研究大语言模型审计员的稳定性、误报、上下文影响与集成可靠性的受控实验基准。",
        "credit": "",
    },
    {
        "slug": "fable-52-prompt-map", "title": "Fable 5.2 提示词解剖图", "subtitle": "系统提示词结构全解",
        "url": "/project/fable-52-prompt-map/", "category": "专题页", "tags": ["提示词工程", "可视化"],
        "desc": "Claude Fable 5.2 完整系统提示词逐条拆解：129 个工具接口、44 套内置技能，关键条款原文摘录。",
        "credit": "",
    },
    {
        "slug": "fable-52-showcase", "title": "Claude Fable 5.2 惊人作品专题", "subtitle": "社区代表作盘点",
        "url": "/project/fable-52-showcase/", "category": "专题页", "tags": ["专题", "AI 作品"],
        "desc": "Fable 5.2 发布一周内社区代表性作品盘点：12 件作品总表、成本与耗时数据、源代码可得性标注。",
        "credit": "",
    },
    {
        "slug": "dsh-research-lab", "title": "DSH Research Lab", "subtitle": "高校科研智能体工作台",
        "url": "/project/dsh-research-lab/", "category": "专题页", "tags": ["科研工具", "开源", "智能体"],
        "desc": "基于 DeepSeek Harness 的开源科研智能体框架：真实公开数据、分层架构、49 项自动验收，支持按学科定制。",
        "credit": "",
    },
    {
        "slug": "beaker-mixer", "title": "烧杯混合互动实验", "subtitle": "在浏览器里做化学",
        "url": "/beaker-mixer.html", "category": "互动实验", "tags": ["化学实验", "互动"],
        "desc": "选取试剂倒入烧杯自由混合，实时观察颜色、沉淀与气泡等反应现象。",
        "credit": "",
    },
]

def main():
    cards = json.loads((REPO / "edulab" / "assets" / "data" / "cards.json").read_text())
    report = json.loads(REPORT.read_text()) if REPORT.exists() else {}
    items = []
    for lab in cards["labs"]:
        slug = lab["slug"]
        ok = report.get(slug, {}).get("ok", False)
        items.append({
            "slug": slug,
            "title": lab["name"],
            "subtitle": lab.get("subtitle", ""),
            "url": f"/edulab/{slug}/",
            "thumb": f"/assets/showcase/thumbs/{slug}.jpg",
            "category": "3D 教学实验",
            "tags": [lab.get("subject", "综合")],
            "desc": lab.get("desc", ""),
            "credit": "",
            "shot": ok,
        })
    for m in MANUAL:
        ok = report.get(m["slug"], {}).get("ok", False)
        m = dict(m)
        m["thumb"] = f"/assets/showcase/thumbs/{m['slug']}.jpg"
        m["shot"] = ok
        items.append(m)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n")
    cats = {}
    for it in items:
        cats[it["category"]] = cats.get(it["category"], 0) + 1
    failed = [it["slug"] for it in items if not it["shot"]]
    print(f"共 {len(items)} 项; 分类: {cats}; shot=false: {failed}")

if __name__ == "__main__":
    main()
