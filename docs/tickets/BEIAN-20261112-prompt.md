你是本任务的执行工程师。先完整读工单文件 /Users/leo/milulab/docs/tickets/BEIAN-20261112.md，然后严格按工单执行。

任务摘要：给 milulab 站点（/Users/leo/milulab，Jekyll）全站页脚追加 ICP 备案信息「京ICP备15043385号-87」，链接到 https://beian.miit.gov.cn/ 。

执行步骤：
1. 读工单原文，理解约束（禁动 _site/、edulab/、dsh-research-lab/；禁自动 commit；禁 push）
2. 改 /Users/leo/milulab/index.html 的 site-footer（追加备案 span，含链接）
3. 改 /Users/leo/milulab/_includes/footer.html（default layout 页脚）
4. 写一次性脚本批量给所有含 subpage-footer 的页面（约81个 HTML）追加备案链接，先改 2 个文件人工验证 diff 正确后再全量执行；脚本执行完即删
5. 检查 404.html、_layouts/post.html 是否有页脚需要同步处理，有则一并改
6. 在 /Users/leo/milulab 下跑 bundle exec jekyll build 验证构建（如 bundle 不可用则跳过构建，仅做静态检查）
7. 抽查 _site/index.html、_site/work/index.html、_site/blog/index.html 构建产物含备案号
8. 把结果写进 /Users/leo/milulab/docs/tickets/BEIAN-20261112-result.md：改动文件清单（git diff --stat）、构建结果、抽查结论、遗留问题

完成判据：全站（首页+81个subpage-footer页面+default layout页+404/post如有页脚）页脚均含「京ICP备15043385号-87」链接；_site/ edulab/ dsh-research-lab/ 零改动；工作区留改动不 commit。
