#!/usr/bin/env python3
"""AT-104 R2：生成 assets/showcase/apps.json（158 项），依据 cards.json + 人工条目 + 镜像台账 + 截图报告。

镜像游戏段数据源（AT-103 台账 × AT101 games.csv）：
- slug↔csv_id / repo：/Users/leo/repos-local/dispatch/at103-mirror-all.result.md（在此固化为映射表）
- name / category：/Users/leo/repos-local/workorders/AT101-data/games.csv
- 简介：按 index.html 标题与 category 人工提炼（DESC），缺省回退模板句
"""
import csv
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "assets" / "showcase" / "apps.json"
REPORT = Path(__file__).resolve().parent / "shot_report.json"
GAMES_CSV = Path("/Users/leo/repos-local/workorders/AT101-data/games.csv")

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

# ---- AT-103 镜像游戏段（56 款，全量已授权）----
# (slug, csv_id)：按 games.csv 行号排序输出；csv_id→slug 映射依据 at103-mirror-all.result.md 台账
# （one-prompt-worlds-1~8 = ONE_PROMPT_WORLDS 仓 game~game8；aqiula/dawnward、hahaliu1029 四连作、
#   t-minus/earthfm/rufus-crush 为 shared repo；Saltline 本体与 robotics-bench/what-the-water-keeps 已在 MANUAL）
MIRRORS = [
    ("fog-city", "01"), ("dustfall", "02"), ("bayhaven", "03"), ("aquila", "04"), ("dawnward", "05"),
    ("ironvale", "06"), ("the-long-climb", "07"), ("boondocks-woodcrest-files", "08"), ("duel-knights", "09"),
    ("saltline-online", "11"), ("sublevel-07", "12"), ("blameless", "13"), ("dustline-outpost", "14"),
    ("last-return", "15"), ("riftline", "16"), ("graveyard-shift", "17"), ("tidebell", "18"),
    ("mothlight-vesper-9", "19"), ("qingyun-sword-flight", "20"), ("misremember", "21"),
    ("hanford-reach", "22"), ("boring-game", "23"), ("shutterpine", "24"), ("power-the-spire", "25"),
    ("one-prompt-worlds-6", "31"), ("soccer-3d", "32"), ("tuktuk", "33"), ("emberdeep", "34"),
    ("daedalus", "35"), ("sternenjaeger", "36"), ("shuttle-strike", "37"), ("neon-runner", "38"),
    ("becario-del-universo", "39"), ("harvest-standoff", "40"), ("tidemark", "41"), ("the-county", "42"),
    ("makinamon-pulso", "43"), ("liquid-labyrinth", "46"), ("mini-rpg", "47"), ("rufus-crush", "48"),
    ("one-prompt-worlds-1", "49"), ("one-prompt-worlds-2", "50"), ("one-prompt-worlds-3", "51"),
    ("one-prompt-worlds-4", "52"), ("one-prompt-worlds-5", "53"), ("one-prompt-worlds-7", "54"),
    ("one-prompt-worlds-8", "55"), ("maple-run", "56"), ("escape-the-fable", "57"),
    ("circular-tic-tac-toe", "58"), ("earthfm", "59"), ("t-minus", "60"), ("jester", "61"),
    ("retro-sisters", "62"), ("rawza-ring", "63"), ("gifts-for-the-tall-one", "64"),
]

# slug→仓库（台账）；作者取仓库用户名段
MIRROR_REPO = {
    "fog-city": "Rikinshah787/Game-Fable-5.2", "dustfall": "webKing021/dustfall",
    "bayhaven": "fablestar/bayhaven", "aquila": "GavinLOrio/Fable-5.2-random-game",
    "dawnward": "GavinLOrio/Fable-5.2-random-game", "ironvale": "SharpWizard/ironvale",
    "the-long-climb": "HILAYTRIVEDI/thirty-days", "boondocks-woodcrest-files": "Achraf921/boondocks",
    "duel-knights": "bitofastickler/duel-knights", "saltline-online": "wenzhengshi/fable5-2-salt-online",
    "sublevel-07": "wquguru/fable52-fps-repro", "blameless": "Petyok/blameless",
    "dustline-outpost": "systemsluke/fable5.2game", "last-return": "StefanKnol/Last-Return",
    "riftline": "wongh26/claude_fps", "graveyard-shift": "ethanplusai/zombies",
    "tidebell": "hahaliu1029/fable5.2demo", "mothlight-vesper-9": "hahaliu1029/fable5.2demo",
    "qingyun-sword-flight": "hahaliu1029/fable5.2demo", "misremember": "hahaliu1029/fable5.2demo",
    "hanford-reach": "chzbloom123/settlement-bluff-fable5.2",
    "boring-game": "jakozaur/sf_bay_area_transit_fable_5_2_game", "shutterpine": "DQuanBui/shutterpine",
    "power-the-spire": "cdurgun/claude-fable-3d-world",
    "one-prompt-worlds-1": "shioa2006-game/ONE_PROMPT_WORLDS", "one-prompt-worlds-2": "shioa2006-game/ONE_PROMPT_WORLDS",
    "one-prompt-worlds-3": "shioa2006-game/ONE_PROMPT_WORLDS", "one-prompt-worlds-4": "shioa2006-game/ONE_PROMPT_WORLDS",
    "one-prompt-worlds-5": "shioa2006-game/ONE_PROMPT_WORLDS", "one-prompt-worlds-6": "shioa2006-game/ONE_PROMPT_WORLDS",
    "one-prompt-worlds-7": "shioa2006-game/ONE_PROMPT_WORLDS", "one-prompt-worlds-8": "shioa2006-game/ONE_PROMPT_WORLDS",
    "soccer-3d": "ShaunPrice/soccer-3d", "tuktuk": "basemazab/tuktuk", "emberdeep": "DNDNoob/EmberDeep",
    "daedalus": "S77FFY/daedalus", "sternenjaeger": "oldzitterhand/sternenjaeger",
    "shuttle-strike": "fedifianto/shuttlestrike", "neon-runner": "Ilias-AK/NewGameFromFable5.2",
    "becario-del-universo": "masugus/fable5.2-5min-game", "harvest-standoff": "andreteow/farm-ca",
    "tidemark": "CocoSgt/dsh-game-tidemark", "the-county": "TheMizeGuy/fable-5.2-potatobench",
    "makinamon-pulso": "gavilanbe/makinamon-pulso", "liquid-labyrinth": "tuki0918/maze-exit",
    "mini-rpg": "ertertwert/Mini-RPG", "rufus-crush": "bhoult/phone-games",
    "maple-run": "nanha0130/maple-run-fable", "escape-the-fable": "ai-gamez-r-funz/escape-the-fable",
    "circular-tic-tac-toe": "muhammad-sayed-mahdy/circular-tic-tac-toe-web", "earthfm": "Aarosunn/SpaceApps",
    "t-minus": "XDracam/spaceappschallenge2026", "jester": "aaron-sulbaran/jester",
    "retro-sisters": "rob0511-777/Retro-Sisters", "rawza-ring": "Hashmatullahzaher/mazar-rawza-race",
    "gifts-for-the-tall-one": "eyeb0l/catslop",
}

# 一句话中文简介（依 index.html 标题 + csv 类别人工提炼；缺省回退模板句）
MIRROR_DESC = {
    "fog-city": "雾都题材的 3D 开放世界：穿行雾街探索，含大规模 glb/hdr 场景资产。",
    "dustfall": "尘暴废土题材的 three.js 开放世界，浏览器直接进入探索。",
    "bayhaven": "海滨湾镇 Bayhaven 的 three.js 开放世界，自由漫游式探索。",
    "aquila": "Aquila：3D 开放世界探索小品，与 Dawnward 同仓（作者连作）。",
    "dawnward": "低多边形风格的短篇 3D 冒险，作者连作之一。",
    "ironvale": "Ironvale 铁谷 RTS：浏览器上的采集、建设与军团对阵。",
    "the-long-climb": "The Long Climb（Thirty Days）：三十天攀登长路的开放世界叙事。",
    "boondocks-woodcrest-files": "《The Boondocks》同人 2D 动作游戏：Woodcrest 街区冒险（fan game）。",
    "duel-knights": "Duel Knights：中世纪骑士一对一 3D 对决，格挡闪避见招拆招。",
    "saltline-online": "盐线行动 Online：多人港口 FPS 的单机前端镜像，联机模式需自建服务端。",
    "sublevel-07": "SUBLEVEL 07：地下设施 FPS，首页为作者的复现说明页，点入即玩。",
    "blameless": "WebGL FPS 射击游戏，加载即战；原仓库另带可选成绩榜单服务。",
    "dustline-outpost": "边哨据点防守射击：在沙尘哨站抵御一波波进攻。",
    "last-return": "Last Return：单文件构建产物的 WebGL FPS，加载即玩。",
    "riftline": "Riftline FPS：PeerJS 浏览器联机对战，单人也可直接开玩。",
    "graveyard-shift": "丧尸夜班守卫射击：WebGL 画面里撑过一波波夜袭。",
    "tidebell": "潮钟 Tidebell：海边题材的 three.js 探索小品。",
    "mothlight-vesper-9": "MOTHLIGHT // Vesper-9：驾驶飞行器夜航穿行的驾驶类小品。",
    "qingyun-sword-flight": "青云宗 · 御剑采灵：中文仙侠题材，御剑飞行采集灵韵。",
    "misremember": "MISREMEMBER：心理恐怖题材的第一人称短篇。",
    "hanford-reach": "崖地聚落建造：在 Hanford Reach 河岸选址、规划并扩建定居点。",
    "boring-game": "旧金山湾区公共交通线路规划模拟：让城市通勤运转起来。",
    "shutterpine": "SHUTTERPINE：松林小镇题材的叙事恐怖短篇。",
    "power-the-spire": "3D 高塔收集探索：逐层向上、边走边收集的小品。",
    "soccer-3d": "Pocket Soccer 3D：自绘 3D 渲染的足球对抗，支持 PWA 安装。",
    "tuktuk": "开嘟嘟车街头载客的驾驶小品（阿拉伯语界面）。",
    "emberdeep": "Emberdeep 余烬深坑：地底矿道冒险。",
    "daedalus": "DAEDALUS：迷宫逃脱解谜，单文件 121KB 轻量开玩。",
    "sternenjaeger": "Sternenjäger（星猎手）：德语界面的太空射击。",
    "shuttle-strike": "Shuttle Strike：摄像头手势追踪的羽毛球体感游戏。",
    "neon-runner": "NEON RUNNER：霓虹赛博风的 Canvas 2D 跑酷。",
    "becario-del-universo": "Becario del Universo（宇宙实习生）：西语休闲五分钟小品。",
    "harvest-standoff": "Harvest Standoff：农场丰收季的竞技对抗。",
    "tidemark": "潮汐战线（Tidemark）：中文原创战棋游戏，回合制策略对阵。",
    "the-county": "县镇经营：从马铃薯田开始的模拟经营小品。",
    "makinamon-pulso": "MAKINAMON · Versión Pulso：西语界面的 Canvas 2D 复古 RPG。",
    "liquid-labyrinth": "Liquid Labyrinth：液体物理解谜，引导流体找到迷宫出口。",
    "mini-rpg": "Mini RPG：自带原声音乐的复古 RPG，内容量远超「迷你」之名。",
    "rufus-crush": "Rufus Crush：Rust→WASM 的小狗三消，手机端友好。",
    "one-prompt-worlds-1": "One Prompt Worlds 系列：拨动光点点亮森林的物理探索小品。",
    "one-prompt-worlds-2": "One Prompt Worlds 系列：一粒种子造就的粒子庭园解谜。",
    "one-prompt-worlds-3": "One Prompt Worlds 系列：灯守坑道的动作 RPG 探险。",
    "one-prompt-worlds-4": "One Prompt Worlds 系列：转动灯台开启三条海路的解谜。",
    "one-prompt-worlds-5": "One Prompt Worlds 系列：回转迷宫三人旅的地牢解谜。",
    "one-prompt-worlds-6": "One Prompt Worlds 系列：身后的埴轮——第一人称日式解谜。",
    "one-prompt-worlds-7": "One Prompt Worlds 系列：以剪刀修剪春日盆栽的解谜。",
    "one-prompt-worlds-8": "One Prompt Worlds 系列：牧羊犬コロ的一天，赶羊入圈的动作小品。",
    "maple-run": "MAPLE RUN · 紅葉ラン：WebGPU 渲染的 3D 枫叶跑酷。",
    "escape-the-fable": "Escape the Fable：密室线索解谜逃脱。",
    "circular-tic-tac-toe": "环形棋盘井字棋：首尾相连的四连棋，可挑战 AI 或双人对弈。",
    "earthfm": "EarthFM 听音辨识：收听各地电台实况音频，猜猜这是哪里（NASA Space Apps 作品）。",
    "t-minus": "T-Minus 多人任务规划：WebRTC 实时协作的发射倒计时推演（NASA Space Apps 作品）。",
    "jester": "摄像头派对游戏：MediaPipe 体感识别，跟随节奏做出搞怪动作。",
    "retro-sisters": "复古 2D 平台跳跃：SID 芯片音效的姊妹冒险。",
    "rawza-ring": "Rawza Ring：绕蓝色清真寺街区的 3D 街头竞速。",
    "gifts-for-the-tall-one": "给高个子的礼物：猫咪题材的收集探索小游戏。",
}


def mirror_items(report):
    rows = {}
    with open(GAMES_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows[row["id"]] = row
    items = []
    for slug, cid in MIRRORS:
        row = rows[cid]
        author = MIRROR_REPO[slug].split("/")[0]
        desc = MIRROR_DESC.get(slug) or f"{row['name']}——Fable 5.2 社区作品镜像，已获原作者授权署名转载"
        ok = report.get(slug, {}).get("ok", False)
        items.append({
            "slug": slug,
            "title": row["name"],
            "subtitle": "Fable 5.2 社区作品镜像",
            "url": f"/apps/{slug}/",
            "thumb": f"/assets/showcase/thumbs/{slug}.jpg",
            "category": "镜像游戏",
            "tags": [row["category"], "Fable 5.2"],
            "desc": desc,
            "credit": f"原作者 {author} · Claude Fable 5.2 生成 · 已获授权署名转载",
            "shot": ok,
        })
    return items


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
    items.extend(mirror_items(report))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n")
    cats = {}
    for it in items:
        cats[it["category"]] = cats.get(it["category"], 0) + 1
    failed = [it["slug"] for it in items if not it["shot"]]
    print(f"共 {len(items)} 项; 分类: {cats}; shot=false: {failed}")

if __name__ == "__main__":
    main()
