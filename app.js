// 参考实现（Hark 2026-11-09）：文案按“地支组 + 步”取，36 张覆盖六十年，任何日期都有卡。
const $ = id => document.querySelector('#' + id);
const FIELDS = ['title', 'sky', 'body', 'drink', 'press', 'move', 'classic', 'plain', 'classic_source', 'classic_note'];
let cards = [], yunqi = null, current = null, ctx = null;
const md = s => s.slice(5, 10); // 'YYYY-MM-DD HH:mm:ss' -> 'MM-DD'
function cardOf(branch, step) { return cards.find(c => c.branch === branch && c.step === step) || null; }
function render(step) {
  const st = ctx.steps[step - 1], yq = ctx.yr.steps[step - 1], c = cardOf(ctx.branch, step);
  current = c;
  FIELDS.forEach(k => { $(k).textContent = (c && c[k]) || ''; });
  $('date').textContent = `${st.from}—${st.to}（${st.fromTime.slice(0, 10)} 至 ${st.toTime.slice(0, 10)}） · 主气 ${yq.zhuqi} · 客气 ${yq.keqi}`;
  $('year').textContent = ctx.r.ganzhi;
  document.querySelectorAll('.step').forEach((e, n) => e.classList.toggle('active', n === step - 1));
}
function timeline() {
  $('steps').innerHTML = '';
  ctx.steps.forEach(st => {
    const c = cardOf(ctx.branch, st.step), yq = ctx.yr.steps[st.step - 1], e = document.createElement('div');
    e.className = 'step' + (st.step === ctx.r.step ? ' active' : '');
    e.innerHTML = `<small>${st.stepName} · ${st.from}—${st.to}（${md(st.fromTime)} 至 ${md(st.toTime)}）</small><strong>${c ? c.title : ''}</strong><em>${yq.zhuqi} · ${yq.keqi}</em>`;
    e.onclick = () => render(st.step);
    $('steps').append(e);
  });
}
async function init() {
  cards = (await fetch('data/cards.json').then(r => r.json())).cards;
  yunqi = await fetch('data/yunqi-60.json').then(r => r.json());
  const q = new URLSearchParams(location.search).get('date');
  const r = WuyunCalc.compute(WuyunCalc.parseDateParam(q) || new Date(), yunqi);
  ctx = { r, yr: yunqi.years[((r.yunqiYear - 4) % 60 + 60) % 60], steps: WuyunCalc.stepsOf(r.yunqiYear), branch: WuyunCalc.branchOf(r.ganzhi) };
  $('season').textContent = r.headline;
  timeline();
  render(r.step);
}
$('info').onclick = () => alert('六气按古人的六段划分，跟立春、立夏、立秋、立冬不完全对齐，所以一步气可能跨两个季节。');
$('share').onclick = async () => { const text = `${(current && current.share) || ''}\n${location.href}`; if (navigator.share) await navigator.share({ title: '五运六气', text }); else await navigator.clipboard.writeText(text).then(() => alert('已复制分享文案')); };
init().catch(e => { $('title').textContent = '数据加载失败，请刷新'; console.error(e); });
