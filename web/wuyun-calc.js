/* 五运六气 当前节气与六气推算。依赖 lunar-javascript（全局 Solar，或 Node 下 require）。
   所有时刻按北京时间（Asia/Shanghai）计算。Hark 2026-11-08 */
(function (root) {
  var L = root.Solar ? root : (typeof require === 'function' ? require('lunar-javascript') : null);
  var STEP_NAMES = ['初', '二', '三', '四', '五', '终'];
  var BOUNDS = ['大寒', '春分', '小满', '大暑', '秋分', '小雪', 'DA_HAN'];
  var LABEL = { DA_HAN: '大寒' };
  function bj(d) { // Date -> 北京时间各分量
    var t = new Date(d.getTime() + 8 * 3600e3);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), s: t.getUTCSeconds() };
  }
  function table(y) { return L.Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable(); }
  function dayNo(a, b) { // 两个 Solar 之间相差的日历天数
    return Math.round((Date.UTC(b.getYear(), b.getMonth() - 1, b.getDay()) - Date.UTC(a.getYear(), a.getMonth() - 1, a.getDay())) / 864e5);
  }
  function compute(date, yunqi) {
    var p = bj(date || new Date());
    var now = L.Solar.fromYmdHms(p.y, p.m, p.d, p.h, p.mi, p.s);
    var nowStr = now.toYmdHms();
    var prev = now.getLunar().getPrevJieQi(true);
    if (prev.getSolar().toYmdHms() > nowStr) prev = prev.getSolar().next(-1).getLunar().getPrevJieQi(true); // 交节当天、交节时刻之前
    var jq = prev.getSolar();
    var y = p.y, t = table(y);
    if (nowStr < t['大寒'].toYmdHms()) { y -= 1; t = table(y); }
    var step = 0;
    for (var i = 0; i < 6; i++) if (nowStr >= t[BOUNDS[i]].toYmdHms() && nowStr < t[BOUNDS[i + 1]].toYmdHms()) step = i + 1;
    var idx = ((y - 4) % 60 + 60) % 60;
    var yr = yunqi && yunqi.years ? yunqi.years[idx] : null;
    var st = yr ? yr.steps[step - 1] : null;
    var from = t[BOUNDS[step - 1]], to = t[BOUNDS[step]];
    return {
      jieqi: prev.getName(), jieqiTime: jq.toYmdHms(), jieqiDay: dayNo(jq, now) + 1,
      yunqiYear: y, ganzhi: yr ? yr.ganzhi : null, suiyun: yr ? yr.suiyun : null,
      sitian: yr ? yr.sitian : null, zaiquan: yr ? yr.zaiquan : null,
      step: step, stepName: STEP_NAMES[step - 1] + '之气',
      from: LABEL[BOUNDS[step - 1]] || BOUNDS[step - 1], fromTime: from.toYmdHms(),
      to: LABEL[BOUNDS[step]] || BOUNDS[step], toTime: to.toYmdHms(),
      zhuqi: st ? st.zhuqi : null, keqi: st ? st.keqi : null,
      headline: prev.getName() + ' · 第 ' + (dayNo(jq, now) + 1) + ' 天｜' + STEP_NAMES[step - 1] + '之气（' + (LABEL[BOUNDS[step - 1]] || BOUNDS[step - 1]) + '—' + (LABEL[BOUNDS[step]] || BOUNDS[step]) + '），' + (yr ? yr.ganzhi : '')
    };
  }
  function parseDateParam(q) { // ?date=YYYY-MM-DD 或 YYYY-MM-DDTHH:mm，按北京时间解析，不依赖浏览器宽松解析
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(q || '');
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], (m[4] ? +m[4] : 12) - 8, m[5] ? +m[5] : 0));
  }
  var api = { compute: compute, parseDateParam: parseDateParam };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WuyunCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
