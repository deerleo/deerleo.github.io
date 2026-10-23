import json
import math
import statistics


def wilson(k, n):
    if not n:
        return None
    z = 1.959963984540054
    p = k / n
    denominator = 1 + z * z / n
    midpoint = (p + z * z / (2 * n)) / denominator
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator
    return [max(0.0, midpoint - half), min(1.0, midpoint + half)]


def fisher_two_sided(a, b, c, d):
    n, row, col = a + b + c + d, a + b, a + c

    def logcomb(total, k):
        return math.lgamma(total + 1) - math.lgamma(k + 1) - math.lgamma(total - k + 1)

    def logp(x):
        return logcomb(col, x) + logcomb(n - col, row - x) - logcomb(n, row)

    observed = logp(a)
    p = sum(math.exp(logp(x)) for x in range(max(0, row - (n - col)), min(row, col) + 1)
            if logp(x) <= observed + 1e-10)
    return min(1.0, p)


def table_test(rows, name, predicate, exposed_label, reference_label):
    exposed = [r for r in rows if predicate(r)]
    reference = [r for r in rows if not predicate(r)]
    a = sum(r['disease'] for r in exposed)
    b = len(exposed) - a
    c = sum(r['disease'] for r in reference)
    d = len(reference) - c
    result = {'comparison': name, 'exposed_label': exposed_label, 'reference_label': reference_label,
              'cells': {'a_exposed_positive': a, 'b_exposed_negative': b,
                        'c_reference_positive': c, 'd_reference_negative': d},
              'exposed_n': a + b, 'reference_n': c + d,
              'exposed_positive_fraction': a / (a + b) if a + b else None,
              'reference_positive_fraction': c / (c + d) if c + d else None,
              'odds_ratio': None, 'or_ci95': None, 'p_value': None,
              'p_holm': None, 'test': '不可估计', 'chi_square': None,
              'min_expected': None, 'correction': '无', 'note': ''}
    n = a + b + c + d
    if not (a + b and c + d and a + c and b + d):
        result['note'] = '分组为空或结局没有变异，不计算OR与检验。'
        return result
    expected = [(a + b) * (a + c) / n, (a + b) * (b + d) / n,
                (c + d) * (a + c) / n, (c + d) * (b + d) / n]
    result['min_expected'] = min(expected)
    if min(expected) < 5:
        result['test'] = 'Fisher 双侧精确检验'
        result['p_value'] = fisher_two_sided(a, b, c, d)
    else:
        x2 = n * (a * d - b * c) ** 2 / ((a + b) * (c + d) * (a + c) * (b + d))
        result['test'] = 'Pearson 卡方检验，df=1，无连续性校正'
        result['chi_square'] = x2
        result['p_value'] = math.erfc(math.sqrt(x2 / 2))
    cells = [float(a), float(b), float(c), float(d)]
    if min(cells) == 0:
        cells = [x + 0.5 for x in cells]
        result['correction'] = 'OR与区间使用Haldane–Anscombe各格+0.5；p值使用原始计数'
    aa, bb, cc, dd = cells
    estimate = aa * dd / (bb * cc)
    se = math.sqrt(sum(1 / x for x in cells))
    result['odds_ratio'] = estimate
    result['or_ci95'] = [math.exp(math.log(estimate) - 1.959963984540054 * se),
                         math.exp(math.log(estimate) + 1.959963984540054 * se)]
    result['note'] = '粗OR，未调整混杂；95%CI为未做多重校正的log-Wald近似区间。'
    if min(expected) < 5:
        result['note'] += '稀疏单元格下OR区间近似较粗，谨慎解释。'
    return result


def main(rows_json: str, audit_json: str) -> dict:
    rows = json.loads(rows_json)
    audit = json.loads(audit_json)
    n = len(rows)
    positives = sum(r['disease'] for r in rows)
    groups = []
    for name, predicate in [('全体', lambda r: True), ('男性(sex=1)', lambda r: r['sex'] == 1),
                            ('女性(sex=0)', lambda r: r['sex'] == 0),
                            ('年龄≥55岁', lambda r: r['age'] >= 55),
                            ('年龄<55岁', lambda r: r['age'] < 55)]:
        selected = [r for r in rows if predicate(r)]
        k = sum(r['disease'] for r in selected)
        groups.append({'group': name, 'n': len(selected), 'positive': k,
                       'positive_fraction': k / len(selected) if selected else None,
                       'wilson_ci95': wilson(k, len(selected))})
    descriptive = []
    for col, unit in [('age', '岁'), ('trestbps', 'mmHg'), ('chol', 'mg/dL'),
                      ('thalach', '次/分钟'), ('oldpeak', '原始单位')]:
        result = {'variable': col, 'unit': unit}
        for group, selector in [('all', lambda r: True), ('negative', lambda r: r['disease'] == 0),
                                ('positive', lambda r: r['disease'] == 1)]:
            values = [r[col] for r in rows if selector(r)]
            result[group] = {'n': len(values), 'mean': statistics.mean(values) if values else None,
                             'sample_sd': statistics.stdev(values) if len(values) > 1 else None,
                             'median': statistics.median(values) if values else None,
                             'min': min(values) if values else None, 'max': max(values) if values else None}
        descriptive.append(result)
    comparisons = [
        table_test(rows, '男性 vs 女性', lambda r: r['sex'] == 1, '男性', '女性'),
        table_test(rows, '年龄≥55 vs <55', lambda r: r['age'] >= 55, '≥55岁', '<55岁'),
        table_test(rows, '运动诱发心绞痛有 vs 无', lambda r: r['exang'] == 1, 'exang=1', 'exang=0'),
    ]
    # Holm 校正包含当前数据中可估计的比较，不能把缺失p值当作0。
    valid = sorted([i for i, r in enumerate(comparisons) if r['p_value'] is not None],
                   key=lambda i: comparisons[i]['p_value'])
    running = 0.0
    for rank, index in enumerate(valid):
        running = max(running, min(1.0, (len(valid) - rank) * comparisons[index]['p_value']))
        comparisons[index]['p_holm'] = running
    result = {
        'analysis': '公共卫生历史病例样本的描述统计与探索性关联分析',
        'n': n, 'positive': positives, 'negative': n - positives,
        'sample_positive_fraction': positives / n, 'wilson_ci95': wilson(positives, n),
        'subgroups': groups, 'descriptive': descriptive, 'comparisons': comparisons,
        'multiple_testing': '对可估计的性别、年龄分组、运动诱发心绞痛三项探索性检验作Holm校正',
        'estimated_test_count': len(valid), 'ci_method': '样本阳性比例：Wilson；粗OR：log-Wald',
        'limitations': [
            '这是历史病例样本中的阳性比例，不能作为一般人群患病率或发病率。',
            '观察性关联不等于因果。粗OR未控制年龄、性别等混杂，也不是风险比或概率倍数。',
            '年龄55岁分界仅用于教学探索，不是临床诊断阈值。',
            '完整案例剔除可能带来选择偏差；区间未纳入抽样设计或多重比较校正。',
            '本流程没有训练预测模型、没有ROC/AUC、没有多元Logistic回归，不得补造这些结果。',
        ], 'audit': audit,
    }
    return {'statistics_json': json.dumps(result, ensure_ascii=False, allow_nan=False)}
