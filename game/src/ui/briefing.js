// Briefing overlay (over the live 3D hangar scene), controls card, pause and result panels.
import { MISSIONS } from '../missions/missionList.js';
import { state } from '../core/gameState.js';

const $ = (id) => document.getElementById(id);
export function createBriefing({ onStart }) {
  const list = $('missionList');
  list.innerHTML = MISSIONS.map((m) => `<div class="mcard" data-id="${m.id}"><div class="mnum">${m.id}</div><div><div class="mname">${m.title}</div><div class="mdesc">${m.short}</div></div></div>`).join('');
  const cards = [...list.querySelectorAll('.mcard')];
  const select = (id) => { state.missionId = id; cards.forEach((c) => c.classList.toggle('sel', +c.dataset.id === id)); };
  cards.forEach((c) => { c.onclick = () => select(+c.dataset.id); c.ondblclick = () => onStart(+c.dataset.id); });
  $('startBtn').onclick = () => onStart(state.missionId);
  select(1);
  return {
    select,
    showBriefing(v) { $('briefing').style.display = v ? 'flex' : 'none'; },
    showPause(v) { $('pause').style.display = v ? 'flex' : 'none'; },
    showResult(r) {
      const p = $('result');
      if (!r) { p.style.display = 'none'; return; }
      p.className = r.kind; p.style.display = 'flex';
      $('rTitle').textContent = r.title; $('rSub').textContent = r.sub;
      $('rStats').textContent = `TIME ${r.stats.time}s   FUEL ${r.stats.fuel}%   DAMAGE ${r.stats.damage}%   LANDING ${r.stats.landing}`;
    },
  };
}
