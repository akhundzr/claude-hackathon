import json

_HALF_CIRC = 251.33  # π * 80 — arc length for gauge path

_HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Code Scanner Report</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" crossorigin="anonymous">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" crossorigin="anonymous"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#1a1a2e;--card:#16213e;--accent:#0f3460;--highlight:#e94560;--text:#e0e0e0;--text-dim:#888;--green:#4caf50;--yellow:#ff9800;--red:#f44336;--border:rgba(255,255,255,0.08)}
[data-theme="light"]{--bg:#f0f2f5;--card:#ffffff;--accent:#e8eaf6;--highlight:#e94560;--text:#1a1a2e;--text-dim:#555;--border:rgba(0,0,0,0.1)}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,sans-serif;line-height:1.5}
.container{max-width:1200px;margin:0 auto;padding:0 1rem 3rem}
header{background:var(--card);border-bottom:1px solid var(--border);padding:2rem 0;margin-bottom:2rem}
.header-inner{max-width:1200px;margin:0 auto;padding:0 1rem;display:flex;align-items:center;gap:3rem;flex-wrap:wrap}
.gauge-svg{width:220px;height:125px}
.header-stats{display:flex;gap:2.5rem;flex-wrap:wrap}
.stat{text-align:center}
.stat-value{font-size:1.9rem;font-weight:700;color:var(--highlight)}
.stat-label{font-size:.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em}
.card{background:var(--card);border-radius:8px;padding:1.5rem;margin-bottom:1.5rem;border:1px solid var(--border)}
.card h2{font-size:1.05rem;font-weight:600;margin-bottom:1.25rem}
#theme-btn{position:fixed;top:1rem;right:1rem;z-index:100;background:var(--card);border:1px solid var(--border);color:var(--text);padding:.45rem .75rem;border-radius:6px;cursor:pointer;font-size:1rem}
.q-bar-wrap{margin-bottom:.85rem}
.q-bar-label{display:flex;justify-content:space-between;margin-bottom:.25rem;font-size:.85rem}
.q-bar-track{background:var(--accent);border-radius:4px;height:18px;overflow:hidden}
.q-bar-fill{height:100%;border-radius:4px;width:0;transition:width .9s ease-out}
.lang-chart-wrap{display:flex;align-items:center;gap:2rem;flex-wrap:wrap}
.lang-chart-container{width:260px;height:260px;flex-shrink:0}
.lang-legend{flex:1;min-width:200px}
.legend-item{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;font-size:.84rem}
.legend-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:.84rem}
th{text-align:left;padding:.55rem .75rem;border-bottom:2px solid var(--border);color:var(--text-dim);font-weight:600;cursor:pointer;user-select:none;white-space:nowrap}
th:hover{color:var(--text)}
td{padding:.45rem .75rem;border-bottom:1px solid var(--border)}
tr:last-child td{border-bottom:none}
tr.fi{animation:fadeInRow .3s ease-out both}
@keyframes fadeInRow{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.panel-header{display:flex;align-items:center;gap:.6rem;margin-bottom:1rem}
.panel-header h2{margin-bottom:0}
.badge{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 6px;border-radius:13px;font-size:.78rem;font-weight:700}
.bw{background:rgba(255,152,0,.2);color:var(--yellow)}
.be{background:rgba(244,67,54,.2);color:var(--red)}
.finding{border-left:3px solid var(--border);padding:.65rem 1rem;margin-bottom:.5rem;border-radius:0 4px 4px 0;cursor:pointer;transition:background .15s}
.finding:hover{background:var(--accent)}
.finding-header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
.finding-title{font-weight:500;font-size:.84rem}
.finding-loc{font-size:.75rem;color:var(--text-dim);white-space:nowrap}
.finding-detail{font-size:.79rem;color:var(--text-dim);margin-top:.2rem}
.finding-snippet{font-family:monospace;font-size:.77rem;background:var(--bg);padding:.35rem .55rem;border-radius:4px;margin-top:.35rem;overflow-x:auto;display:none}
.finding.expanded .finding-snippet{display:block;animation:slideIn .2s ease-out}
@keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
.fe{border-left-color:var(--red)}.fw{border-left-color:var(--yellow)}
.zero-state{display:flex;align-items:center;gap:.6rem;color:var(--green);font-weight:500}
.file-toolbar{display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap}
#file-search{flex:1;min-width:200px;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:.45rem .75rem;border-radius:6px;font-size:.84rem}
#file-search:focus{outline:none;border-color:var(--highlight)}
.pagination{display:flex;gap:.4rem;align-items:center;justify-content:center;margin-top:.75rem;flex-wrap:wrap}
.page-btn{background:var(--accent);border:1px solid var(--border);color:var(--text);padding:.3rem .6rem;border-radius:4px;cursor:pointer;font-size:.78rem}
.page-btn:hover,.page-btn.active{background:var(--highlight);color:#fff;border-color:var(--highlight)}
.fbe{border-left:3px solid var(--red)}.fbw{border-left:3px solid var(--yellow)}
footer{text-align:center;padding:2rem 1rem;color:var(--text-dim);font-size:.79rem;border-top:1px solid var(--border);margin-top:1rem}
@media(max-width:768px){.header-inner{flex-direction:column;align-items:flex-start}.gauge-svg{width:180px;height:105px}.lang-chart-wrap{flex-direction:column}.lang-chart-container{width:220px;height:220px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
@keyframes gradePulse{0%,100%{opacity:1}50%{opacity:.75}}
#gauge-grade{animation:gradePulse 2s ease-in-out infinite}
</style>
</head>
<body>
<button id="theme-btn" title="Toggle theme">☀</button>

<header class="animate__animated animate__fadeIn">
  <div class="header-inner">
    <div>
      <svg class="gauge-svg" viewBox="0 0 200 115">
        <path d="M 20 100 A 80 80 0 0 0 180 100"
              fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round"/>
        <path id="gauge-fill" d="M 20 100 A 80 80 0 0 0 180 100"
              fill="none" stroke="#e94560" stroke-width="12" stroke-linecap="round"
              stroke-dasharray="251.33 502" stroke-dashoffset="251.33"/>
        <text id="gauge-grade" x="100" y="88" text-anchor="middle"
              font-size="44" font-weight="700" fill="var(--text)" font-family="system-ui,sans-serif">-</text>
        <text id="gauge-score-text" x="100" y="112" text-anchor="middle"
              font-size="12" fill="var(--text-dim)" font-family="system-ui,sans-serif">Score: -</text>
      </svg>
    </div>
    <div class="header-stats">
      <div class="stat animate__animated animate__fadeInUp" style="animation-delay:.1s"><div class="stat-value" id="s-files">-</div><div class="stat-label">Files</div></div>
      <div class="stat animate__animated animate__fadeInUp" style="animation-delay:.2s"><div class="stat-value" id="s-loc">-</div><div class="stat-label">Lines of Code</div></div>
      <div class="stat animate__animated animate__fadeInUp" style="animation-delay:.3s"><div class="stat-value" id="s-dur">-</div><div class="stat-label">Duration ms</div></div>
      <div class="stat animate__animated animate__fadeInUp" style="animation-delay:.4s"><div class="stat-value" id="s-langs">-</div><div class="stat-label">Languages</div></div>
    </div>
  </div>
</header>

<div class="container">
  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.1s">
    <h2>Quality Score Breakdown</h2>
    <div id="quality-bars"></div>
  </div>

  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.2s">
    <h2>Language Distribution</h2>
    <div class="lang-chart-wrap">
      <div class="lang-chart-container"><canvas id="lang-chart"></canvas></div>
      <div class="lang-legend" id="lang-legend"></div>
    </div>
  </div>

  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.3s">
    <h2>Metrics Summary</h2>
    <div class="table-wrap">
      <table id="metrics-table">
        <thead><tr>
          <th data-col="lang">Language ▲</th>
          <th data-col="files">Files</th>
          <th data-col="loc">LOC</th>
          <th data-col="comments">Comments</th>
          <th data-col="blanks">Blanks</th>
          <th data-col="functions">Functions</th>
          <th data-col="classes">Classes</th>
        </tr></thead>
        <tbody id="metrics-body"></tbody>
      </table>
    </div>
  </div>

  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.4s">
    <div class="panel-header">
      <h2>Code Smells</h2>
      <span class="badge bw" id="smell-w">0</span>
      <span class="badge be" id="smell-e">0</span>
    </div>
    <div id="smells-content"></div>
  </div>

  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.5s">
    <div class="panel-header">
      <h2>Security Findings</h2>
      <span class="badge be" id="sec-badge">0</span>
    </div>
    <div id="security-content"></div>
  </div>

  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.6s">
    <h2>File Explorer</h2>
    <div class="file-toolbar">
      <input type="search" id="file-search" placeholder="Search files\u2026">
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th data-fcol="path">File ▲</th>
          <th data-fcol="language">Language</th>
          <th data-fcol="loc">LOC</th>
          <th data-fcol="functions">Fns</th>
          <th data-fcol="smells">Smells</th>
          <th data-fcol="security_issues">Security</th>
        </tr></thead>
        <tbody id="files-body"></tbody>
      </table>
    </div>
    <div class="pagination" id="pagination"></div>
  </div>
</div>

<footer><div id="footer-text">Generated by Code Scanner</div></footer>

<script>
const R=__REPORT_JSON__;
(function(){var s=localStorage.getItem('scanner-theme')||'dark';document.documentElement.dataset.theme=s;document.getElementById('theme-btn').addEventListener('click',function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('scanner-theme',t)})})();
(function(){var sc=R.quality.score,gr=R.quality.grade,HC=251.33,fill=document.getElementById('gauge-fill');var color=sc>=80?'#4caf50':sc>=60?'#ff9800':'#f44336';fill.style.stroke=color;fill.style.transition='stroke-dashoffset 1.5s ease-out';document.getElementById('gauge-grade').textContent=gr;document.getElementById('gauge-score-text').textContent='Score: '+sc;setTimeout(function(){fill.style.strokeDashoffset=HC*(1-sc/100)},200)})();
document.getElementById('s-files').textContent=R.summary.total_files.toLocaleString();
document.getElementById('s-loc').textContent=R.summary.total_loc.toLocaleString();
document.getElementById('s-dur').textContent=R.scan_metadata.scan_duration_ms.toLocaleString();
document.getElementById('s-langs').textContent=Object.keys(R.summary.languages).length;
(function(){var comps=R.quality.components,items=[['Code Smell Score',comps.code_smell_score],['Security Score',comps.security_score],['Comment Ratio Score',comps.comment_score],['Maintainability Score',comps.maintainability_score]],c=document.getElementById('quality-bars');items.forEach(function(item){var col=item[1]>=80?'#4caf50':item[1]>=60?'#ff9800':'#f44336';c.innerHTML+='<div class="q-bar-wrap"><div class="q-bar-label"><span>'+item[0]+'</span><span>'+item[1]+'</span></div><div class="q-bar-track"><div class="q-bar-fill" style="background:'+col+'" data-t="'+item[1]+'"></div></div></div>'});var bars=c.querySelectorAll('.q-bar-fill');new IntersectionObserver(function(es,ob){es.forEach(function(e){if(e.isIntersecting){bars.forEach(function(b){b.style.width=b.dataset.t+'%'});ob.disconnect()}})},{threshold:.2}).observe(c)})();
(function(){var langs=R.summary.languages,labels=Object.keys(langs),data=labels.map(function(l){return langs[l].loc}),COLORS=['#e94560','#4caf50','#2196f3','#ff9800','#9c27b0','#00bcd4','#ff5722','#607d8b','#795548','#cddc39'];new Chart(document.getElementById('lang-chart'),{type:'doughnut',data:{labels:labels,datasets:[{data:data,backgroundColor:COLORS.slice(0,labels.length),hoverOffset:14}]},options:{animation:{duration:1200},plugins:{legend:{display:false}}}});var leg=document.getElementById('lang-legend');labels.forEach(function(lang,i){leg.innerHTML+='<div class="legend-item"><div class="legend-dot" style="background:'+COLORS[i%COLORS.length]+'"></div><span>'+esc(lang)+' &mdash; '+langs[lang].files+' file'+(langs[lang].files!==1?'s':'')+', '+langs[lang].loc.toLocaleString()+' LOC</span></div>'})})();
(function(){var langs=R.summary.languages,rows=Object.entries(langs).map(function(e){return{lang:e[0],files:e[1].files,loc:e[1].loc,comments:e[1].comment_lines,blanks:e[1].blank_lines,functions:e[1].functions,classes:e[1].classes}}),sortCol='lang',sortDir=1;function render(){var sorted=[].concat(rows).sort(function(a,b){var va=a[sortCol],vb=b[sortCol];return typeof va==='string'?sortDir*va.localeCompare(vb):sortDir*(va-vb)});var tb=document.getElementById('metrics-body');tb.innerHTML='';sorted.forEach(function(r,i){var tr=document.createElement('tr');tr.className='fi';tr.style.animationDelay=(i*.05)+'s';tr.innerHTML='<td>'+esc(r.lang)+'</td><td>'+r.files+'</td><td>'+r.loc.toLocaleString()+'</td><td>'+r.comments.toLocaleString()+'</td><td>'+r.blanks.toLocaleString()+'</td><td>'+r.functions+'</td><td>'+r.classes+'</td>';tb.appendChild(tr)})}render();document.querySelectorAll('#metrics-table th').forEach(function(th){th.addEventListener('click',function(){var col=th.dataset.col;if(col===sortCol)sortDir*=-1;else{sortCol=col;sortDir=1}render()})})})();
function countUp(el,n,dur){var s=Date.now();(function step(){var p=Math.min((Date.now()-s)/dur,1);el.textContent=Math.round(p*n);if(p<1)requestAnimationFrame(step)})()}
(function(){var sm=R.code_smells;countUp(document.getElementById('smell-w'),sm.total_warnings,800);countUp(document.getElementById('smell-e'),sm.total_errors,800);var c=document.getElementById('smells-content');if(!sm.findings.length){c.innerHTML='<div class="zero-state"><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#4caf50" stroke-width="2" fill="none"/><path d="M6 10l3 3 5-5" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>No code smells detected</div>';return}sm.findings.forEach(function(f){var d=document.createElement('div');d.className='finding '+(f.severity==='error'?'fe':'fw');d.innerHTML='<div class="finding-header"><span class="finding-title">'+esc(f.type.replace(/_/g,' '))+' in <code>'+esc(f.function_name)+'</code></span><span class="finding-loc">'+esc(f.file)+':'+f.line+'</span></div><div class="finding-detail">'+esc(f.detail)+'</div>';d.addEventListener('click',function(){d.classList.toggle('expanded')});c.appendChild(d)})})();
(function(){var sec=R.security;countUp(document.getElementById('sec-badge'),sec.total_findings,800);var c=document.getElementById('security-content');if(!sec.findings.length){c.innerHTML='<div class="zero-state"><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#4caf50" stroke-width="2" fill="none"/><path d="M6 10l3 3 5-5" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>No security issues detected</div>';return}sec.findings.forEach(function(f){var d=document.createElement('div');d.className='finding fe';d.innerHTML='<div class="finding-header"><span class="finding-title">'+esc(f.type.replace(/_/g,' '))+' &mdash; '+esc(f.pattern)+'</span><span class="finding-loc">'+esc(f.file)+':'+f.line+'</span></div><div class="finding-detail">'+esc(f.detail)+'</div>'+(f.snippet?'<div class="finding-snippet">'+esc(f.snippet)+'</div>':'');d.addEventListener('click',function(){d.classList.toggle('expanded')});c.appendChild(d)})})();
(function(){var PAGE=50,page=0,query='',sortCol='path',sortDir=1,files=R.files;function filtered(){return files.filter(function(f){return!query||f.path.toLowerCase().includes(query)})}function render(){var data=filtered(),sorted=[].concat(data).sort(function(a,b){var va=a[sortCol],vb=b[sortCol];return typeof va==='string'?sortDir*va.localeCompare(vb):sortDir*(va-vb)}),start=page*PAGE,pageData=sorted.slice(start,start+PAGE),tb=document.getElementById('files-body');tb.innerHTML='';pageData.forEach(function(f){var tr=document.createElement('tr');if(f.security_issues>0)tr.className='fbe';else if(f.smells>0)tr.className='fbw';tr.innerHTML='<td style="font-family:monospace;font-size:.79rem">'+esc(f.path)+'</td><td>'+esc(f.language)+'</td><td>'+f.loc+'</td><td>'+f.functions+'</td><td>'+(f.smells||0)+'</td><td>'+(f.security_issues||0)+'</td>';tb.appendChild(tr)});var tot=Math.ceil(sorted.length/PAGE),pag=document.getElementById('pagination');pag.innerHTML='';if(tot>1)for(var i=0;i<tot;i++){(function(pi){var btn=document.createElement('button');btn.className='page-btn'+(pi===page?' active':'');btn.textContent=pi+1;btn.addEventListener('click',function(){page=pi;render()});pag.appendChild(btn)})(i)}}render();document.getElementById('file-search').addEventListener('input',function(e){query=e.target.value.toLowerCase();page=0;render()});document.querySelectorAll('[data-fcol]').forEach(function(th){th.addEventListener('click',function(){var col=th.dataset.fcol;if(col===sortCol)sortDir*=-1;else{sortCol=col;sortDir=1}render()})})})();
document.getElementById('footer-text').textContent='Generated by Code Scanner \u2022 '+R.scan_metadata.timestamp+' \u2022 '+R.scan_metadata.scan_duration_ms+'ms';
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
</script>
</body>
</html>'''


def generate(report: dict) -> str:
    data_json = json.dumps(report, ensure_ascii=False)
    # Prevent </script> inside JSON from breaking the HTML
    data_json = data_json.replace('</', '<\\/')
    return _HTML_TEMPLATE.replace('__REPORT_JSON__', data_json)
