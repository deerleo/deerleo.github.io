#!/usr/bin/env python3
"""AT-103 showcase 截图流水线。

用法:
  python3 screenshot_all.py [--site-dir /tmp/at103-site] [--only slug1,slug2]
  python3 screenshot_all.py --retry-failed

- 起本地 http.server 指向构建后的站点目录
- chromium headless 1280x800 @2x 截图 → PIL 转 JPEG q80 宽 640
- 落盘 assets/showcase/thumbs/<slug>.jpg，报告写 tools/showcase/shot_report.json
"""
import argparse
import asyncio
import json
import os
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
THUMBS = REPO / "assets" / "showcase" / "thumbs"
REPORT = Path(__file__).resolve().parent / "shot_report.json"
PORT = 8723
VIEW_W, VIEW_H = 1280, 800
OUT_W = 640
JPEG_Q = 80

# 特殊等待：第三方镜像应用资产多，加载慢
SLOW_WAIT_MS = {"saltline": 6000, "what-the-water-keeps": 6000}
DEFAULT_WAIT_MS = 2500

from PIL import Image, ImageStat  # noqa: E402


def load_targets(site_dir: Path):
    """汇总 102 个截图目标: (slug, path)。"""
    targets = []
    cards = json.loads((REPO / "edulab" / "assets" / "data" / "cards.json").read_text())
    for lab in cards["labs"]:
        targets.append({"slug": lab["slug"], "url_path": f"/edulab/{lab['slug']}/", "wait": DEFAULT_WAIT_MS})
    for slug, url_path in [
        ("robotics-bench", "/apps/robotics-bench/"),
        ("saltline", "/apps/saltline/"),
        ("what-the-water-keeps", "/apps/what-the-water-keeps/"),
        ("auditorbench", "/project/auditorbench/"),
        ("fable-52-prompt-map", "/project/fable-52-prompt-map/"),
        ("fable-52-showcase", "/project/fable-52-showcase/"),
        ("dsh-research-lab", "/project/dsh-research-lab/"),
        ("beaker-mixer", "/beaker-mixer.html"),
    ]:
        targets.append({"slug": slug, "url_path": url_path, "wait": SLOW_WAIT_MS.get(slug, DEFAULT_WAIT_MS)})
    # 目录不存在的目标直接标失败
    for t in targets:
        if not (site_dir / t["url_path"].lstrip("/").rstrip("/") ).exists() and not (site_dir / t["url_path"].lstrip("/")).exists():
            t["pre_fail"] = "目录不存在"
    return targets


class Server:
    def __init__(self, site_dir: Path):
        self.proc = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", str(site_dir)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        time.sleep(1.0)

    def stop(self):
        self.proc.terminate()
        try:
            self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()


def jpeg_stats(img: Image.Image):
    stat = ImageStat.Stat(img.convert("L"))
    return stat.mean[0], stat.stddev[0]


async def shoot_one(browser, sem, base, item, report, dsf=2, wait_override=None):
    slug = item["slug"]
    async with sem:
        wait = wait_override or item.get("wait", DEFAULT_WAIT_MS)
        attempts = [
            {"wait": wait, "nav_timeout": 30000, "shot_timeout": 60000, "dsf": dsf},
            {"wait": wait * 2, "nav_timeout": 45000, "shot_timeout": 90000, "dsf": 1},  # 重试：等待翻倍 + dsf 降 1 减轻渲染压力
        ]
        if item.get("pre_fail"):
            report[slug] = {"ok": False, "error": item["pre_fail"], "stddev": None}
            print(f"  [SKIP] {slug}: {item['pre_fail']}", flush=True)
            return
        for i, a in enumerate(attempts):
            page = await browser.new_page(viewport={"width": VIEW_W, "height": VIEW_H}, device_scale_factor=a["dsf"])
            try:
                await page.goto(base + item["url_path"], timeout=a["nav_timeout"], wait_until="load")
                try:
                    await page.wait_for_load_state("networkidle", timeout=8000)
                except Exception:
                    pass  # 长轮询页面永不 idle，忽略
                await page.wait_for_timeout(a["wait"])
                png_path = Path("/tmp") / f"at103_{slug}.png"
                await page.screenshot(path=str(png_path), timeout=a["shot_timeout"], animations="disabled")
                img = Image.open(png_path)
                mean, stddev = jpeg_stats(img)
                if stddev < 4.0 and i == 0:
                    print(f"  [BLANK?] {slug} stddev={stddev:.1f} → 等待翻倍重试", flush=True)
                    continue
                out = THUMBS / f"{slug}.jpg"
                img = img.resize((OUT_W, round(OUT_W * VIEW_H / VIEW_W)), Image.LANCZOS)
                img.convert("RGB").save(out, "JPEG", quality=JPEG_Q)
                report[slug] = {"ok": True, "stddev": round(stddev, 1), "attempt": i + 1}
                print(f"  [OK] {slug} stddev={stddev:.1f}", flush=True)
                break
            except Exception as e:
                if i == len(attempts) - 1:
                    report[slug] = {"ok": False, "error": f"{type(e).__name__}: {str(e)[:160]}", "stddev": None}
                    print(f"  [FAIL] {slug}: {e}", flush=True)
            finally:
                await page.close()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site-dir", default="/tmp/at103-site")
    ap.add_argument("--only", default="", help="逗号分隔 slug，只截这些")
    ap.add_argument("--wait", type=int, default=0, help="覆盖基础等待毫秒数（如 15000）")
    args = ap.parse_args()
    site_dir = Path(args.site_dir)
    THUMBS.mkdir(parents=True, exist_ok=True)
    targets = load_targets(site_dir)
    if args.only:
        keep = set(args.only.split(","))
        targets = [t for t in targets if t["slug"] in keep]

    report = {}
    if REPORT.exists():
        report = json.loads(REPORT.read_text())  # 增量合并，保留先前结果
        if not args.only:
            for t in targets:
                report.pop(t["slug"], None)  # 全量跑时清掉本轮目标旧记录
    server = Server(site_dir)
    from playwright.async_api import async_playwright
    t0 = time.time()
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(args=["--enable-unsafe-swiftshader"])
            sem = asyncio.Semaphore(4)
            await asyncio.gather(*(shoot_one(browser, sem, f"http://127.0.0.1:{PORT}", t, report,
                                             wait_override=args.wait or None) for t in targets))
            await browser.close()
    finally:
        server.stop()
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=1))
    ok = sum(1 for r in report.values() if r["ok"])
    print(f"\n完成: {ok}/{len(report)} 成功, 耗时 {time.time()-t0:.0f}s → {REPORT}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
