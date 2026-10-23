import json


def main(statistics_json: str, research_question: str = '') -> dict:
    s = json.loads(statistics_json)
    a = s['audit']

    def number(x, digits=2):
        return '不可估计' if x is None else ('%.' + str(digits) + 'f') % x

    def percent(x):
        return '不可估计' if x is None else '%.2f%%' % (x * 100)

    def pvalue(x):
        return '不可估计' if x is None else ('<0.001' if x < 0.001 else '%.4f' % x)

    def interval(v, is_percent=False):
        if v is None:
            return '不可估计'
        f = percent if is_percent else number
        return '[' + f(v[0]) + ', ' + f(v[1]) + ']'

    def mean_sd(d):
        return number(d['mean']) + ' ± ' + number(d['sample_sd'])

    question = (research_question or '').strip()[:2000]
    question = question.replace('\n', ' ').replace('\r', ' ').replace('|', ' / ').replace('<', '＜').replace('>', '＞')
    lines = [
        '# 公共卫生数据分析报告',
        '', '> 本报告数值由 Python 代码节点真实计算。免模型版文字为固定模板，不是LLM生成。',
        '', '## 1. 问题与数据',
        '', '**研究问题：** ' + (question or '描述病例样本阳性比例，并探索其与性别、年龄分组及运动诱发心绞痛的关联。'),
        '', '**本次执行范围：** 描述统计、分组比例、粗OR与三项探索性检验。自定义问题超出范围时，当前数值不构成该问题的答案。',
        '', '**来源：** ' + a['source'],
        '**纳入规则：** ' + a['missing_strategy'],
        '**结局编码：** ' + a['label_mapping'],
        '', '## 2. 数据审计', '',
        '| 项目 | 结果 |', '|---|---:|',
        '| 输入记录 | %d |' % a['input_rows'],
        '| 完整案例 | %d |' % a['retained_rows'],
        '| 因必需字段缺失剔除 | %d |' % a['removed_missing_rows'],
        '| 重复记录（保留并标记） | %d |' % a['duplicate_rows_retained'],
        '', '**逐字段缺失：** ' + '；'.join('%s=%d' % (k, v) for k, v in a['missing_by_column'].items() if v),
    ]
    if not any(a['missing_by_column'].values()):
        lines[-1] = '**逐字段缺失：** 所有必需字段均无缺失。'
    lines += ['', '## 3. 样本结局与分组', '',
              '| 分组 | n | 阳性数 | 样本阳性比例 | Wilson 95%CI |', '|---|---:|---:|---:|---|']
    for r in s['subgroups']:
        lines.append('| %s | %d | %d | %s | %s |' %
                     (r['group'], r['n'], r['positive'], percent(r['positive_fraction']), interval(r['wilson_ci95'], True)))
    lines += ['', '这里的比例仅描述这份病例样本。Wilson区间基于二项分布近似，不能解决样本代表性问题。',
              '', '## 4. 连续指标（均值 ± 样本标准差）', '',
              '| 指标 | 单位 | 全体 | 阴性组 | 阳性组 |', '|---|---|---:|---:|---:|']
    for r in s['descriptive']:
        lines.append('| %s | %s | %s | %s | %s |' %
                     (r['variable'], r['unit'], mean_sd(r['all']), mean_sd(r['negative']), mean_sd(r['positive'])))
    lines += ['', '本表仅作描述，不对连续指标的组间差异作显著性检验。',
              '', '## 5. 探索性关联', '',
              '| 比较（前者为暴露组） | 粗OR | 未校正95%CI | 原始p | Holm校正p |', '|---|---:|---|---:|---:|']
    for r in s['comparisons']:
        lines.append('| %s | %s | %s | %s | %s |' %
                     (r['comparison'], number(r['odds_ratio']), interval(r['or_ci95']),
                      pvalue(r['p_value']), pvalue(r['p_holm'])))
    lines += ['', '**检验选择及2×2计数：**']
    for r in s['comparisons']:
        c = r['cells']
        lines += ['- %s：暴露组 阳性%d/阴性%d；参照组 阳性%d/阴性%d。%s；%s %s' %
                  (r['comparison'], c['a_exposed_positive'], c['b_exposed_negative'],
                   c['c_reference_positive'], c['d_reference_negative'], r['test'], r['correction'], r['note'])]
    lines += ['', '所有期望频数≥5时使用未作连续性校正的Pearson卡方，否则使用双侧Fisher精确检验。',
              s['multiple_testing'] + '。OR区间未作多重校正，与Holm校正p值的判读可能不同。',
              '', '## 6. 可报告结论与人工复核', '',
              '纳入%d例完整案例，其中阳性%d例，样本阳性比例为%s，Wilson 95%%CI %s。' %
              (s['n'], s['positive'], percent(s['sample_positive_fraction']), interval(s['wilson_ci95'], True)),
              '', '请核对原始数据版本、缺失处理、分组编码、混杂因素及研究设计。粗OR仅表示本样本中的未调整关联。',
              '', '## 7. 局限', '']
    lines.extend('- ' + x for x in s['limitations'])
    lines += ['', '## 8. 来源与复现', '',
              'UCI Heart Disease： https://archive.ics.uci.edu/dataset/45/heart+disease',
              '内置数据：Cleveland 303记录、14字段，CC BY 4.0；参见UCI数据集作者与引用说明。',
              '原始文件 SHA256：`' + a['raw_sha256'] + '`' if a['raw_sha256'] else '自定义CSV的来源、许可与版本由上传者登记。',
              '项目介绍：https://milulab.com/project/dsh-research-lab',
              '输出中的 audit_json 与 statistics_json 可供逐项复核。']
    return {'report': '\n'.join(lines)}
