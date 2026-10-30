#!/usr/bin/env bash
# ============================================================
# build-whitepaper.sh — 生成个人白皮书 PDF（assets/whitepaper.pdf）
#
# 用法：./build-whitepaper.sh   （在仓库任意位置可执行，自动 cd 到脚本目录）
# 资料更新后重跑一条命令即可：jekyll build → WeasyPrint 渲染 → 同步 _site。
#
# PDF 引擎：WeasyPrint（70.x，独立 venv ~/.venvs/weasyprint）
# 选型理由（工单 WHITEPAPER-20261030）：白皮书页眉页脚依赖 @page margin boxes
# 与页码计数器（counter(page)/counter(pages)），目录页码依赖 target-counter()；
# WeasyPrint 原生支持这些，Chrome/Playwright printToPDF 不支持 @page margin-box
# 内容（需 paged.js 等重方案），故不走 headless chromium 回退。
# CJK 渲染：经 pango/fontconfig 使用 macOS 系统字体 PingFang SC，实测正常。
#
# 依赖：
#   - brew: glib pango cairo（weasyprint 经 cffi dlopen 系统库）
#   - venv: ~/.venvs/weasyprint（缺失时本脚本自动创建并 pip 安装 weasyprint）
#   - DYLD_LIBRARY_PATH=/opt/homebrew/lib：macOS 下 weasyprint 的 dlopen
#     默认找不到 brew 安装的 gobject，需显式指向 brew lib（脚本内已设）。
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

WP_VENV="${WP_VENV:-$HOME/.venvs/weasyprint}"
WP_PY="$WP_VENV/bin/python"

echo "[whitepaper] 0/3 检查 PDF 引擎"
if [ ! -x "$WP_PY" ]; then
  echo "[whitepaper] 未找到 $WP_VENV，自动创建 venv 并安装 weasyprint…"
  python3 -m venv "$WP_VENV"
  "$WP_VENV/bin/pip" install --quiet --disable-pip-version-check weasyprint
fi

echo "[whitepaper] 1/3 jekyll build"
bundle exec jekyll build >/dev/null

echo "[whitepaper] 2/3 WeasyPrint 渲染 _site/whitepaper/index.html"
DYLD_LIBRARY_PATH=/opt/homebrew/lib "$WP_PY" - <<'PY'
import functools
import http.server
import threading

from weasyprint import HTML

# Jekyll 输出的资源引用是站点根绝对路径（/assets/...），file:// 直开会解析到
# 文件系统根（base_url 也救不了根绝对路径）。故起一个仅本机回环的临时
# HTTP server 指向 _site/，以 HTTP 方式加载页面，路径语义与线上一致。
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory="_site")
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()

try:
    doc = HTML(f"http://127.0.0.1:{port}/whitepaper/index.html").render()
    doc.write_pdf("assets/whitepaper.pdf")
    print(f"[whitepaper]    渲染完成：{len(doc.pages)} 页")
finally:
    server.shutdown()
PY

# 说明：直接 cp 同步进 _site/assets/，不再二次全量 jekyll build（省时且等价，
# jekyll 只是把 assets/ 原样拷贝进 _site）。
echo "[whitepaper] 3/3 同步 assets/whitepaper.pdf → _site/assets/"
cp assets/whitepaper.pdf _site/assets/whitepaper.pdf

ls -lh assets/whitepaper.pdf | awk '{print "[whitepaper] 产物: " $NF " (" $5 ")"}'
echo "[whitepaper] 完成。页面 /whitepaper/ · 下载 /assets/whitepaper.pdf"
