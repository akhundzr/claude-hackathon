const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Code Scanner Report</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" crossorigin="anonymous">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" crossorigin="anonymous"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--bg2:#161b22;--card:#1c2128;--accent:#21262d;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.14);--text:#e6edf3;--dim:#8b949e;--muted:#6e7681;--green:#3fb950;--yellow:#d29922;--red:#f85149;--blue:#58a6ff;--purple:#bc8cff;--orange:#f0883e;--teal:#56d364;--highlight:#e94560}
[data-theme="light"]{--bg:#f6f8fa;--bg2:#fff;--card:#fff;--accent:#eaeef2;--border:rgba(27,31,36,0.1);--border2:rgba(27,31,36,0.2);--text:#24292f;--dim:#57606a;--muted:#8c959f}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.5;font-size:14px}
.wrap{max-width:1280px;margin:0 auto;padding:0 1.5rem 4rem}
.snav{position:sticky;top:0;z-index:50;background:rgba(13,17,23,.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--border);height:38px;display:flex;align-items:center}
[data-theme="light"] .snav{background:rgba(246,248,250,.92)}
.snav-inner{max-width:1280px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;gap:1.4rem;width:100%;overflow-x:auto;scrollbar-width:none}
.snav-inner::-webkit-scrollbar{display:none}
.snav a{font-size:.75rem;font-weight:500;color:var(--dim);text-decoration:none;white-space:nowrap;transition:color .15s;letter-spacing:.02em;padding:.2rem 0}
.snav a:hover{color:var(--text)}
.snav-dot{width:3px;height:3px;background:var(--border2);border-radius:50%;flex-shrink:0}
.hero{background:linear-gradient(160deg,#0d1117 0%,#130a2a 45%,#0a1929 100%);border-bottom:1px solid var(--border);padding:2.5rem 0;margin-bottom:2rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 15% 60%,rgba(102,126,234,.18) 0%,transparent 55%),radial-gradient(ellipse at 85% 40%,rgba(88,166,255,.1) 0%,transparent 55%);pointer-events:none}
.hero-inner{max-width:1280px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;gap:2.5rem;flex-wrap:wrap;position:relative}
.gauge-svg{width:210px;height:120px;filter:drop-shadow(0 0 18px rgba(102,126,234,.35))}
.hero-grid{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:.75rem}
.hstat{text-align:center;padding:.7rem .5rem;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid var(--border);transition:all .2s}
.hstat:hover{background:rgba(255,255,255,.07);transform:translateY(-1px)}
.hstat-val{font-size:1.55rem;font-weight:700;line-height:1.1}
.hstat-lbl{font-size:.67rem;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-top:.2rem}
.card{background:var(--card);border-radius:12px;padding:1.4rem;margin-bottom:1.5rem;border:1px solid var(--border);transition:border-color .2s,box-shadow .2s}
.card:hover{border-color:var(--border2);box-shadow:0 4px 20px rgba(0,0,0,.35)}
.ctitle{font-size:.92rem;font-weight:600;margin-bottom:1.2rem;display:flex;align-items:center;gap:.5rem;color:var(--text)}
.ctitle svg{flex-shrink:0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}
@media(max-width:820px){.grid2{grid-template-columns:1fr}}
.qbar{margin-bottom:.85rem}
.qbar-lbl{display:flex;justify-content:space-between;margin-bottom:.28rem;font-size:.8rem}
.qbar-lbl b{font-weight:700}
.qbar-track{background:var(--accent);border-radius:5px;height:9px;overflow:hidden}
.qbar-fill{height:100%;border-radius:5px;width:0;transition:width 1.1s ease-out}
.lc-wrap{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}
.lc-canvas{width:190px;height:190px;flex-shrink:0}
.lc-legend{flex:1;min-width:140px}
.leg-item{display:flex;align-items:flex-start;gap:.5rem;margin-bottom:.5rem;font-size:.8rem}
.leg-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;margin-top:.25rem}
.badge{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 5px;border-radius:10px;font-size:.72rem;font-weight:700;line-height:1}
.be{background:rgba(248,81,73,.14);color:var(--red);border:1px solid rgba(248,81,73,.28)}
.bw{background:rgba(210,153,34,.14);color:var(--yellow);border:1px solid rgba(210,153,34,.28)}
.bi{background:rgba(88,166,255,.14);color:var(--blue);border:1px solid rgba(88,166,255,.28)}
.bp{background:rgba(188,140,255,.14);color:var(--purple);border:1px solid rgba(188,140,255,.28)}
.bg{background:rgba(63,185,80,.14);color:var(--green);border:1px solid rgba(63,185,80,.28)}
.by{background:rgba(210,153,34,.14);color:var(--yellow);border:1px solid rgba(210,153,34,.28)}
.shdr{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:1.2rem}
.shdr .ctitle{margin-bottom:0;flex:1}
.shdr-right{display:flex;gap:.35rem;align-items:center;margin-left:auto}
.sec-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:1.25rem}
.sstat{background:var(--bg2);border-radius:8px;padding:.65rem .9rem;border:1px solid var(--border);text-align:center}
.sstat-val{font-size:1.35rem;font-weight:700;line-height:1}
.sstat-lbl{font-size:.68rem;color:var(--dim);margin-top:.2rem;text-transform:uppercase;letter-spacing:.06em}
.pat-section{margin-bottom:1.25rem}
.pat-section-title{font-size:.75rem;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem}
.pat-row{display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem;font-size:.79rem}
.pat-name{width:185px;flex-shrink:0;color:var(--dim);font-family:monospace;font-size:.76rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pat-track{flex:1;background:var(--accent);border-radius:4px;height:7px;overflow:hidden}
.pat-fill{height:100%;border-radius:4px;width:0;transition:width 1s ease-out}
.pat-count{width:22px;text-align:right;flex-shrink:0;font-weight:600}
.fg{border:1px solid var(--border);border-radius:8px;margin-bottom:.55rem;overflow:hidden}
.fg-hdr{display:flex;align-items:center;gap:.55rem;padding:.6rem .9rem;cursor:pointer;background:var(--bg2);transition:background .15s;user-select:none}
.fg-hdr:hover{background:var(--accent)}
.fg-fname{font-family:monospace;font-size:.8rem;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fg-chev{transition:transform .2s;color:var(--dim);flex-shrink:0}
.fg.open .fg-chev{transform:rotate(90deg)}
.fg-body{display:none;border-top:1px solid var(--border)}
.fg.open .fg-body{display:block}
.fi{padding:.55rem .9rem;border-bottom:1px solid var(--border);transition:background .15s}
.fi:last-child{border-bottom:none}
.fi-clk{cursor:pointer}.fi-clk:hover{background:var(--accent)}
.fi-row1{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin-bottom:.15rem}
.fi-pat{font-family:monospace;font-size:.77rem;font-weight:600}
.fi-line{font-size:.73rem;color:var(--dim);margin-left:auto}
.fi-detail{font-size:.77rem;color:var(--dim)}
.fi-snip{display:none;margin-top:.35rem;font-family:monospace;font-size:.74rem;background:var(--bg);padding:.38rem .55rem;border-radius:6px;color:var(--dim);overflow-x:auto;white-space:pre;border-left:3px solid var(--border2)}
.fi.open .fi-snip{display:block;animation:slideIn .18s ease-out}
@keyframes slideIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
.stype-row{display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid var(--border);font-size:.81rem}
.stype-row:last-child{border-bottom:none}
.stype-nm{color:var(--dim);text-transform:capitalize}
.off-row{display:flex;align-items:center;gap:.65rem;padding:.5rem 0;border-bottom:1px solid var(--border);font-size:.8rem}
.off-row:last-child{border-bottom:none}
.off-rank{width:18px;color:var(--muted);font-weight:700;flex-shrink:0;text-align:right}
.off-file{flex:1;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.off-bdg{display:flex;gap:.3rem;flex-shrink:0}
.zero{display:flex;align-items:center;gap:.55rem;color:var(--green);font-weight:500;font-size:.85rem;padding:.25rem 0}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:.81rem}
th{text-align:left;padding:.5rem .7rem;border-bottom:2px solid var(--border);color:var(--dim);font-weight:600;cursor:pointer;user-select:none;white-space:nowrap}
th:hover{color:var(--text)}
td{padding:.42rem .7rem;border-bottom:1px solid var(--border)}
tr:last-child td{border-bottom:none}
tr.arow{animation:fadeRow .28s ease-out both}
@keyframes fadeRow{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
tr.rbe td:first-child{border-left:3px solid var(--red)}
tr.rbw td:first-child{border-left:3px solid var(--yellow)}
.ftbar{display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap}
#fsearch{flex:1;min-width:200px;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:.42rem .7rem;border-radius:8px;font-size:.82rem;transition:border-color .2s}
#fsearch:focus{outline:none;border-color:var(--blue)}
.pages{display:flex;gap:.3rem;align-items:center;justify-content:center;margin-top:.7rem;flex-wrap:wrap}
.pbtn{background:var(--accent);border:1px solid var(--border);color:var(--text);padding:.26rem .55rem;border-radius:5px;cursor:pointer;font-size:.76rem;transition:all .15s}
.pbtn:hover,.pbtn.on{background:var(--highlight);color:#fff;border-color:var(--highlight)}
#tbtn{position:fixed;top:1rem;right:1rem;z-index:100;background:var(--card);border:1px solid var(--border);color:var(--text);padding:.38rem .65rem;border-radius:8px;cursor:pointer;font-size:.93rem;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:all .2s}
#tbtn:hover{border-color:var(--border2)}
footer{text-align:center;padding:2rem 1rem;color:var(--muted);font-size:.76rem;border-top:1px solid var(--border);margin-top:.5rem}
@keyframes gp{0%,100%{opacity:1}50%{opacity:.65}}
#gg{animation:gp 2.5s ease-in-out infinite}
/* Collapsible cards */
.card-toggle{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--dim);padding:.1rem .3rem;border-radius:4px;transition:color .15s,background .15s;display:flex;align-items:center;flex-shrink:0}
.card-toggle:hover{color:var(--text);background:var(--accent)}
.card-toggle svg{transition:transform .2s}
.card.collapsed .card-toggle svg{transform:rotate(-90deg)}
.card.collapsed .card-body{display:none}
.card-body{margin-top:0}
/* Fix explanation */
.fix-explain{margin:.35rem 0 .6rem;padding:.55rem .7rem;background:var(--bg2);border-radius:6px;border-left:3px solid var(--border2);font-size:.78rem;line-height:1.55}
.fix-explain-row{margin-bottom:.25rem}
.fix-explain-row:last-child{margin-bottom:0}
.fix-explain-label{font-weight:600;color:var(--dim);font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;margin-right:.3rem}
.fix-explain-issue{color:var(--yellow)}
.fix-explain-risk{color:var(--red)}
.fix-explain-res{color:var(--green)}
/* Commit preview */
.commit-box{background:var(--bg);border:1px solid var(--border2);border-radius:8px;padding:1rem 1.1rem;font-family:monospace;font-size:.8rem;margin-bottom:1.25rem;overflow-x:auto}
.commit-msg{color:var(--green);font-weight:700;margin-bottom:.75rem;font-size:.86rem}
.commit-cat{display:flex;align-items:flex-start;gap:.5rem;margin-bottom:.35rem;line-height:1.4}
.commit-bullet{color:var(--muted);flex-shrink:0;margin-top:.05rem}
.commit-cat-name{color:var(--text)}
.commit-cat-count{color:var(--muted);font-size:.76rem}
.commit-cat-files{color:var(--dim);font-size:.73rem;margin-top:.1rem;padding-left:.8rem}
.commit-placeholder{color:var(--muted);font-style:italic;padding:.3rem 0}
/* Diff lines */
.diff-wrap{margin-top:.4rem}
.diff-line{font-family:monospace;font-size:.77rem;padding:.1rem .45rem;border-radius:3px;white-space:pre-wrap;word-break:break-all;display:block;margin:.07rem 0}
.diff-del{background:rgba(248,81,73,.08);color:var(--red);border-left:3px solid rgba(248,81,73,.5)}
.diff-add{background:rgba(63,185,80,.08);color:var(--green);border-left:3px solid rgba(63,185,80,.5)}
/* Fix plan sub-sections */
.fix-sub{margin-bottom:1.5rem}
.fix-sub:last-child{margin-bottom:0}
.fix-sub-title{font-size:.75rem;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
/* History */
.hist-chart-wrap{position:relative;height:180px;margin-bottom:1.2rem}
.hist-delta-pos{color:var(--green);font-weight:600}
.hist-delta-neg{color:var(--red);font-weight:600}
.hist-delta-neu{color:var(--muted)}
/* Feedback loops */
.loop-item{border:1px solid var(--border);border-radius:8px;margin-bottom:.55rem;overflow:hidden}
.loop-hdr{display:flex;align-items:center;gap:.5rem;padding:.6rem .9rem;cursor:pointer;background:var(--bg2);transition:background .15s;user-select:none}
.loop-hdr:hover{background:var(--accent)}
.loop-fn{font-family:monospace;font-size:.8rem;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.loop-body{display:none;border-top:1px solid var(--border);padding:.6rem .9rem}
.loop-item.open .loop-body{display:block}
.loop-item.open .fg-chev{transform:rotate(90deg)}
.loop-att{display:flex;align-items:center;gap:.6rem;padding:.28rem 0;border-bottom:1px solid var(--border);font-size:.79rem}
.loop-att:last-child{border-bottom:none}
.empty-state{color:var(--muted);font-size:.83rem;padding:.5rem 0;font-style:italic}
@media(max-width:768px){.hero-inner{flex-direction:column}.gauge-svg{width:180px;height:106px}.sec-stats{grid-template-columns:repeat(2,1fr)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
</style>
</head>
<body>
<button id="tbtn" title="Toggle theme">&#9728;</button>

<nav class="snav">
  <div class="snav-inner">
    <a href="#s-overview">Overview</a>
    <div class="snav-dot"></div>
    <a href="#s-quality">Quality</a>
    <div class="snav-dot"></div>
    <a href="#s-security">Security</a>
    <div class="snav-dot"></div>
    <a href="#s-fixplan">Fix Plan</a>
    <div class="snav-dot"></div>
    <a href="#s-history">History</a>
    <div class="snav-dot"></div>
    <a href="#s-explorer">Files</a>
  </div>
</nav>

<header id="s-overview" class="hero animate__animated animate__fadeIn">
  <div class="hero-inner">
    <svg class="gauge-svg" viewBox="0 0 200 115">
      <defs><linearGradient id="gg-grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs>
      <path d="M 20 100 A 80 80 0 0 0 180 100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="13" stroke-linecap="round"/>
      <path id="gf" d="M 20 100 A 80 80 0 0 0 180 100" fill="none" stroke="#667eea" stroke-width="13" stroke-linecap="round" stroke-dasharray="251.33 502.65" stroke-dashoffset="251.33"/>
      <text id="gg" x="100" y="88" text-anchor="middle" font-size="46" font-weight="800" fill="white" font-family="system-ui,sans-serif">-</text>
      <text id="gs" x="100" y="110" text-anchor="middle" font-size="11.5" fill="rgba(255,255,255,.45)" font-family="system-ui,sans-serif">Score: -</text>
    </svg>
    <div class="hero-grid" id="hgrid"></div>
  </div>
</header>

<div class="wrap">

  <div id="s-quality" class="grid2">
    <div class="card animate__animated animate__fadeInUp" style="animation-delay:.08s">
      <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="var(--purple)" stroke-width="1.3"/><path d="M8 4.5v3.5l2.5 2" stroke="var(--purple)" stroke-width="1.3" stroke-linecap="round"/></svg>Quality Breakdown<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      <div class="card-body"><div id="qbars"></div></div>
    </div>
    <div class="card animate__animated animate__fadeInUp" style="animation-delay:.12s">
      <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="var(--blue)" stroke-width="1.3"/><path d="M8 4v4l3 1.5" stroke="var(--blue)" stroke-width="1.3" stroke-linecap="round"/></svg>Language Distribution<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      <div class="card-body"><div class="lc-wrap"><div class="lc-canvas"><canvas id="lc"></canvas></div><div class="lc-legend" id="lleg"></div></div></div>
    </div>
  </div>

  <div class="grid2">
    <div class="card animate__animated animate__fadeInUp" style="animation-delay:.16s">
      <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.1 4.4 12l.7-4L2.2 5.2l4-.6L8 1z" stroke="var(--yellow)" stroke-width="1.2" stroke-linejoin="round"/></svg>Top Offenders<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      <div class="card-body"><div id="topoff"></div></div>
    </div>
    <div class="card animate__animated animate__fadeInUp" style="animation-delay:.2s">
      <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="var(--teal)" stroke-width="1.3"/><path d="M1.5 6.5h13M5 10h6" stroke="var(--teal)" stroke-width="1.3" stroke-linecap="round"/></svg>Code Smells<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
      <div class="card-body">
        <div id="stypes"></div>
        <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
          <div class="shdr" style="margin-bottom:.9rem"><span style="font-size:.8rem;font-weight:600;color:var(--dim)">ALL FINDINGS</span><div class="shdr-right"><span class="badge bw" id="sw">0</span><span class="badge be" id="se">0</span></div></div>
          <div id="smells-list"></div>
        </div>
      </div>
    </div>
  </div>

  <div id="s-security" class="card animate__animated animate__fadeInUp" style="animation-delay:.24s">
    <div class="shdr">
      <div class="ctitle" style="margin-bottom:0"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="var(--red)" stroke-width="1.3"/><path d="M8 5v4.5" stroke="var(--red)" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".9" fill="var(--red)"/></svg>Security Findings</div>
      <div class="shdr-right"><span class="badge be" id="sec-e">0</span><span class="badge bw" id="sec-w">0</span><button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    </div>
    <div class="card-body">
      <div id="sec-stats" class="sec-stats"></div>
      <div id="sec-pat-wrap" class="pat-section"><div class="pat-section-title">Pattern Distribution</div><div id="sec-pats"></div></div>
      <div style="font-size:.75rem;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.7rem">Findings by File</div>
      <div id="sec-list"></div>
    </div>
  </div>

  <div id="s-fixplan" class="card animate__animated animate__fadeInUp" style="animation-delay:.26s">
    <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 1011 0 5.5 5.5 0 00-11 0z" stroke="var(--green)" stroke-width="1.3"/><path d="M5.5 8l2 2 3-3" stroke="var(--green)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Security Fix Plan<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <div class="card-body">
      <div class="fix-sub">
        <div class="fix-sub-title"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="var(--dim)" stroke-width="1.4"/><path d="M4 8l3 3 5-5" stroke="var(--dim)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>Commit Preview</div>
        <div id="commit-box"></div>
      </div>
      <div class="fix-sub">
        <div class="fix-sub-title"><span class="badge bg" id="auto-fix-cnt">0</span>Auto-fixable Changes</div>
        <div id="auto-fix-list"></div>
      </div>
      <div class="fix-sub">
        <div class="fix-sub-title"><span class="badge by" id="review-fix-cnt">0</span>Needs Manual Review</div>
        <div id="review-fix-list"></div>
      </div>
    </div>
  </div>

  <div id="s-history" class="card animate__animated animate__fadeInUp" style="animation-delay:.28s">
    <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="var(--blue)" stroke-width="1.3"/><path d="M8 4.5V8l2.5 2" stroke="var(--blue)" stroke-width="1.3" stroke-linecap="round"/></svg>AI Feedback Loops (Path A)<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <div class="card-body">
      <div id="loops-section"></div>
    </div>
  </div>

  <div class="card animate__animated animate__fadeInUp" style="animation-delay:.30s">
    <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="var(--blue)" stroke-width="1.3"/><path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4" stroke="var(--blue)" stroke-width="1.3" stroke-linecap="round"/></svg>Metrics by Language<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <div class="card-body"><div class="tw"><table id="mtbl"><thead><tr><th data-c="lang">Language</th><th data-c="files">Files</th><th data-c="loc">LOC</th><th data-c="comments">Comments</th><th data-c="blanks">Blanks</th><th data-c="functions">Functions</th><th data-c="classes">Classes</th><th data-c="ratio">Comment %</th></tr></thead><tbody id="mbody"></tbody></table></div></div>
  </div>

  <div id="s-explorer" class="card animate__animated animate__fadeInUp" style="animation-delay:.32s">
    <div class="ctitle"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3h10M3 6h10M3 9h10M3 12h7" stroke="var(--dim)" stroke-width="1.3" stroke-linecap="round"/></svg>File Explorer<button class="card-toggle" onclick="_ctog(this)" title="Collapse"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    <div class="card-body">
      <div class="ftbar"><input type="search" id="fsearch" placeholder="Filter files\u2026"></div>
      <div class="tw"><table><thead><tr><th data-f="path">File</th><th data-f="language">Language</th><th data-f="loc">LOC</th><th data-f="comment_lines">Comments</th><th data-f="functions">Fns</th><th data-f="classes">Classes</th><th data-f="smells">Smells</th><th data-f="security_issues">Security</th></tr></thead><tbody id="fbody"></tbody></table></div>
      <div class="pages" id="pager"></div>
    </div>
  </div>

</div>
<footer><div id="ftxt">Generated by Code Scanner</div></footer>

<script>
const R=__REPORT_JSON__;
const FIXES=__FIXES_JSON__;
const LOOPS=__LOOPS_JSON__;
var COLORS=['#667eea','#3fb950','#f85149','#d29922','#bc8cff','#56d364','#f0883e','#58a6ff','#e94560','#39c5cf'];

(function(){var s=localStorage.getItem('cs-theme')||'dark';document.documentElement.dataset.theme=s;document.getElementById('tbtn').addEventListener('click',function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('cs-theme',t)})})();

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function cu(el,n,d){var s=Date.now();(function t(){var p=Math.min((Date.now()-s)/d,1);el.textContent=Math.round(p*n);if(p<1)requestAnimationFrame(t)})()}
function icon_ok(){return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="var(--green)" stroke-width="1.3" fill="none"/><path d="M5 8l2.2 2.2L11 5.5" stroke="var(--green)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function icon_file(){return '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="var(--dim)" stroke-width="1.3"/><path d="M10 2v4h4" stroke="var(--dim)" stroke-width="1.3"/></svg>'}
// Global toggles
function _tog(el){el.parentElement.classList.toggle('open');}
function _ctog(btn){btn.closest('.card').classList.toggle('collapsed');}
function icon_chev(){return '<svg class="fg-chev" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function uid(){return 'u'+Math.random().toString(36).slice(2)}

// Gauge
(function(){
  var sc=R.quality.score,gr=R.quality.grade,HC=251.33;
  var col=sc>=80?'var(--green)':sc>=60?'var(--yellow)':'var(--red)';
  var gf=document.getElementById('gf');gf.style.stroke=col;gf.style.transition='stroke-dashoffset 1.6s ease-out';
  document.getElementById('gg').textContent=gr;document.getElementById('gs').textContent='Score: '+sc+' / 100';
  setTimeout(function(){gf.style.strokeDashoffset=HC*(1-sc/100)},250);
})();

// Hero grid
(function(){
  var sm=R.summary,meta=R.scan_metadata;
  var totLines=sm.total_loc+sm.total_comment_lines+sm.total_blank_lines;
  var cpct=totLines>0?(sm.total_comment_lines/totLines*100).toFixed(1):0;
  var langs=Object.keys(sm.languages).length;
  var items=[['&#128196;',sm.total_files.toLocaleString(),'Files'],['&#128200;',sm.total_loc.toLocaleString(),'Lines of Code'],['&#9881;&#65039;',sm.total_functions.toLocaleString(),'Functions'],['&#128218;',sm.total_classes.toLocaleString(),'Classes'],['&#128172;',cpct+'%','Comment Ratio'],['&#127760;',langs,'Languages'],['&#9201;&#65039;',meta.scan_duration_ms+'ms','Scan Time'],['&#128683;',meta.skipped_files,'Skipped']];
  var c=document.getElementById('hgrid');
  items.forEach(function(it,i){c.innerHTML+='<div class="hstat animate__animated animate__fadeInUp" style="animation-delay:'+(0.04*(i+1))+'s"><div class="hstat-val">'+it[0]+' '+esc(it[1])+'</div><div class="hstat-lbl">'+it[2]+'</div></div>'});
})();

// Quality bars
(function(){
  var comps=R.quality.components;
  var items=[['Code Smell',comps.code_smell_score],['Security',comps.security_score],['Comments',comps.comment_score],['Maintainability',comps.maintainability_score]];
  var c=document.getElementById('qbars');
  items.forEach(function(it){var col=it[1]>=80?'var(--green)':it[1]>=60?'var(--yellow)':'var(--red)';c.innerHTML+='<div class="qbar"><div class="qbar-lbl"><span>'+it[0]+'</span><b style="color:'+col+'">'+it[1]+'/100</b></div><div class="qbar-track"><div class="qbar-fill" style="background:'+col+'" data-t="'+it[1]+'"></div></div></div>'});
  var fills=c.querySelectorAll('.qbar-fill');
  new IntersectionObserver(function(es,ob){es.forEach(function(e){if(e.isIntersecting){fills.forEach(function(b){b.style.width=b.dataset.t+'%'});ob.disconnect()}})},{threshold:.2}).observe(c);
})();

// Language chart
(function(){
  var langs=R.summary.languages,labels=Object.keys(langs),data=labels.map(function(l){return langs[l].loc});
  var total=data.reduce(function(a,b){return a+b},0);
  new Chart(document.getElementById('lc'),{type:'doughnut',data:{labels:labels,datasets:[{data:data,backgroundColor:COLORS.slice(0,labels.length),hoverOffset:12,borderWidth:0}]},options:{animation:{duration:1100},plugins:{legend:{display:false}},cutout:'65%'}});
  var leg=document.getElementById('lleg');
  labels.forEach(function(lang,i){var l=langs[lang],pct=total>0?(l.loc/total*100).toFixed(1):0;leg.innerHTML+='<div class="leg-item"><div class="leg-dot" style="background:'+COLORS[i%COLORS.length]+'"></div><div><div style="font-weight:600;font-size:.81rem">'+esc(lang)+'</div><div style="font-size:.73rem;color:var(--dim)">'+l.files+' file'+(l.files!==1?'s':'')+' &bull; '+l.loc.toLocaleString()+' LOC &bull; '+pct+'%</div><div style="font-size:.73rem;color:var(--muted)">'+l.functions+' fn'+(l.functions!==1?'s':'')+' &bull; '+l.classes+' class'+(l.classes!==1?'es':'')+'</div></div></div>'});
})();

// Top offenders
(function(){
  var files=[].concat(R.files).filter(function(f){return(f.smells||0)+(f.security_issues||0)>0});
  files.sort(function(a,b){return((b.smells||0)+(b.security_issues||0))-((a.smells||0)+(a.security_issues||0))});
  var top=files.slice(0,8),c=document.getElementById('topoff');
  if(!top.length){c.innerHTML='<div class="zero">'+icon_ok()+' No issues found in any file</div>';return}
  top.forEach(function(f,i){var nm=f.path.split('/').pop();c.innerHTML+='<div class="off-row"><div class="off-rank">'+(i+1)+'</div><div class="off-file" title="'+esc(f.path)+'">'+esc(nm)+'<span style="color:var(--muted);font-size:.72rem;font-family:sans-serif"> '+esc(f.path)+'</span></div><div class="off-bdg">'+(f.smells?'<span class="badge bw">'+f.smells+' smell'+(f.smells!==1?'s':'')+'</span>':'')+(f.security_issues?'<span class="badge be">'+f.security_issues+' sec</span>':'')+'</div></div>'});
})();

// Smells
(function(){
  var sm=R.code_smells;
  cu(document.getElementById('sw'),sm.total_warnings,700);cu(document.getElementById('se'),sm.total_errors,700);
  var types={};sm.findings.forEach(function(f){if(!types[f.type])types[f.type]={w:0,e:0};types[f.type][f.severity==='error'?'e':'w']++});
  var sc=document.getElementById('stypes');
  if(!Object.keys(types).length){sc.innerHTML='<div class="zero">'+icon_ok()+' No smells detected</div>'}
  else{Object.keys(types).forEach(function(t){var d=types[t];sc.innerHTML+='<div class="stype-row"><span class="stype-nm">'+esc(t.replace(/_/g,' '))+'</span><span style="display:flex;gap:.3rem">'+(d.e?'<span class="badge be">'+d.e+' err</span>':'')+(d.w?'<span class="badge bw">'+d.w+' warn</span>':'')+'</span></div>'})}
  var sl=document.getElementById('smells-list');
  if(!sm.findings.length){sl.innerHTML='<div class="zero" style="margin-top:.4rem">'+icon_ok()+' No findings</div>';return}
  sm.findings.forEach(function(f){var el=document.createElement('div');el.className='fi';el.innerHTML='<div class="fi-row1"><span class="badge '+(f.severity==='error'?'be':'bw')+'">'+esc(f.severity)+'</span><span class="fi-pat">'+esc(f.type.replace(/_/g,' '))+'</span><span style="font-size:.76rem;color:var(--dim)">in <code>'+esc(f.function_name||'?')+'</code></span><span class="fi-line">'+esc(f.file)+':'+f.line+'</span></div><div class="fi-detail">'+esc(f.detail)+'</div>';sl.appendChild(el)});
})();

// Security
(function(){
  var sec=R.security;
  var errs=sec.findings.filter(function(f){return f.severity==='error'}).length;
  var warns=sec.findings.filter(function(f){return f.severity==='warning'}).length;
  cu(document.getElementById('sec-e'),errs,700);cu(document.getElementById('sec-w'),warns,700);
  var filesAff=new Set(sec.findings.map(function(f){return f.file})).size;
  var patsFound=new Set(sec.findings.map(function(f){return f.pattern})).size;
  var ss=document.getElementById('sec-stats');
  var sv=function(val,col,lbl){return '<div class="sstat"><div class="sstat-val" style="color:'+col+'">'+val+'</div><div class="sstat-lbl">'+lbl+'</div></div>'};
  ss.innerHTML=sv(errs,'var(--red)','Errors')+sv(warns,'var(--yellow)','Warnings')+sv(filesAff,'var(--blue)','Files Affected')+sv(patsFound,'var(--purple)','Pattern Types');
  if(!sec.findings.length){document.getElementById('sec-pat-wrap').style.display='none';document.getElementById('sec-list').innerHTML='<div class="zero">'+icon_ok()+' No security issues detected</div>';return}
  var patCounts={};sec.findings.forEach(function(f){patCounts[f.pattern]=(patCounts[f.pattern]||0)+1});
  var patList=Object.entries(patCounts).sort(function(a,b){return b[1]-a[1]});
  var maxP=patList[0][1],pc=document.getElementById('sec-pats');
  patList.forEach(function(e){var pct=(e[1]/maxP*100).toFixed(0);var col=sec.findings.find(function(f){return f.pattern===e[0]}).severity==='error'?'var(--red)':'var(--yellow)';pc.innerHTML+='<div class="pat-row"><div class="pat-name" title="'+esc(e[0])+'">'+esc(e[0])+'</div><div class="pat-track"><div class="pat-fill" style="background:'+col+';width:0" data-t="'+pct+'"></div></div><div class="pat-count">'+e[1]+'</div></div>'});
  var pfills=pc.querySelectorAll('.pat-fill');
  new IntersectionObserver(function(es,ob){es.forEach(function(e){if(e.isIntersecting){pfills.forEach(function(b){b.style.width=b.dataset.t+'%'});ob.disconnect()}})},{threshold:.1}).observe(pc);
  var byFile={};sec.findings.forEach(function(f){if(!byFile[f.file])byFile[f.file]=[];byFile[f.file].push(f)});
  var secC=document.getElementById('sec-list');
  Object.keys(byFile).sort().forEach(function(fname){
    var flist=byFile[fname];var ec=flist.filter(function(f){return f.severity==='error'}).length;var wc=flist.filter(function(f){return f.severity==='warning'}).length;var nm=fname.split('/').pop();
    var grp=document.createElement('div');grp.className='fg';
    grp.innerHTML='<div class="fg-hdr">'+icon_file()+'<span class="fg-fname" title="'+esc(fname)+'">'+esc(nm)+'<span style="color:var(--muted);font-weight:400;font-family:sans-serif;font-size:.73rem"> '+esc(fname)+'</span></span>'+(ec?'<span class="badge be">'+ec+' err</span>':'')+(wc?'<span class="badge bw">'+wc+' warn</span>':'')+'<span style="font-size:.72rem;color:var(--muted)">'+flist.length+' finding'+(flist.length!==1?'s':'')+'</span>'+icon_chev()+'</div><div class="fg-body"></div>';
    var body=grp.querySelector('.fg-body');
    flist.forEach(function(f){var item=document.createElement('div');item.className='fi fi-clk';item.innerHTML='<div class="fi-row1"><span class="badge '+(f.severity==='error'?'be':'bw')+'">'+esc(f.severity)+'</span><span class="fi-pat">'+esc(f.pattern)+'</span><span class="fi-line">line '+f.line+'</span></div><div class="fi-detail">'+esc(f.detail)+'</div>'+(f.snippet?'<div class="fi-snip">'+esc(f.snippet)+'</div>':'');if(f.snippet)item.addEventListener('click',function(){item.classList.toggle('open')});body.appendChild(item)});
    grp.querySelector('.fg-hdr').addEventListener('click',function(){grp.classList.toggle('open')});
    secC.appendChild(grp);
  });
})();

// Security Fix Plan
(function(){
  var fx=FIXES||{};
  var af=fx.autoFixes||[];
  var rf=fx.reviewFixes||[];
  var cp=fx.commitPreview||null;

  document.getElementById('auto-fix-cnt').textContent=af.length;
  document.getElementById('review-fix-cnt').textContent=rf.length;

  // Commit preview
  var cb=document.getElementById('commit-box');
  if(!cp||(af.length+rf.length===0)){
    cb.innerHTML='<div class="commit-placeholder">No fix data available. Run: node src/index.js scan &lt;dir&gt; --no-open</div>';
  }else{
    var cats=(cp.categories||[]).map(function(cat){
      var filesList=cat.files&&cat.files.length?'<div class="commit-cat-files">'+cat.files.slice(0,4).map(function(f){return esc(f)}).join('<br>')+(cat.files.length>4?'<br>\u2026 +'+( cat.files.length-4)+' more':'')+'</div>':'';
      return '<div class="commit-cat"><span class="commit-bullet">&bull;</span><div><div class="commit-cat-name">'+esc(cat.name)+'<span class="commit-cat-count"> ('+cat.count+')</span></div>'+filesList+'</div></div>';
    }).join('');
    cb.innerHTML='<div class="commit-msg">$ git commit -m "'+esc(cp.message)+'"</div>'+cats;
  }

  // Build collapsible file groups for fix lists
  function buildGroups(list,showDiff){
    if(!list.length)return '<div class="empty-state">None in this category.</div>';
    var byFile={};list.forEach(function(f){if(!byFile[f.file])byFile[f.file]=[];byFile[f.file].push(f)});
    var html='';
    Object.keys(byFile).sort().forEach(function(fname){
      var items=byFile[fname],nm=fname.split('/').pop(),id=uid();
      html+='<div class="fg" id="'+id+'"><div class="fg-hdr" onclick="_tog(this)">'+icon_file()+'<span class="fg-fname" title="'+esc(fname)+'">'+esc(nm)+'<span style="color:var(--muted);font-weight:400;font-family:sans-serif;font-size:.73rem"> '+esc(fname)+'</span></span><span style="font-size:.72rem;color:var(--muted)">'+items.length+' fix'+(items.length!==1?'es':'')+'</span>'+icon_chev()+'</div><div class="fg-body">';
      items.forEach(function(fix){
        html+='<div class="fi"><div class="fi-row1"><span class="badge bi">L'+fix.line+'</span><span class="fi-pat">'+esc(fix.pattern)+'</span>'+(fix.commitCategory?'<span style="font-size:.72rem;color:var(--muted);margin-left:auto">'+esc(fix.commitCategory)+'</span>':'')+'</div>';
        // Security explanation
        if(fix.issue||fix.risk||fix.resolution){
          html+='<div class="fix-explain">';
          if(fix.issue)html+='<div class="fix-explain-row"><span class="fix-explain-label">Issue</span><span class="fix-explain-issue">'+esc(fix.issue)+'</span></div>';
          if(fix.risk)html+='<div class="fix-explain-row"><span class="fix-explain-label">Risk</span><span class="fix-explain-risk">'+esc(fix.risk)+'</span></div>';
          if(fix.resolution)html+='<div class="fix-explain-row"><span class="fix-explain-label">Fix</span><span class="fix-explain-res">'+esc(fix.resolution)+'</span></div>';
          html+='</div>';
        }
        if(showDiff&&fix.snippet!==undefined&&fix.fixedSnippet!==undefined){
          html+='<div class="diff-wrap"><span class="diff-line diff-del">- '+esc(fix.snippet)+'</span><span class="diff-line diff-add">+ '+esc(fix.fixedSnippet)+'</span></div>';
        }else if(fix.snippet){
          html+='<div class="diff-wrap"><span class="diff-line diff-del">  '+esc(fix.snippet)+'</span></div>';
        }
        html+='</div>';
      });
      html+='</div></div>';
    });
    return html;
  }

  document.getElementById('auto-fix-list').innerHTML=buildGroups(af,true);
  document.getElementById('review-fix-list').innerHTML=buildGroups(rf,false);

  // Projected score after applying all auto-fixes
  if(af.length>0){
    var fixedKeys=new Set(af.map(function(f){return f.file+'|'+f.line;}));
    var remaining=R.security.findings.filter(function(f){return !fixedKeys.has(f.file+'|'+f.line);});
    var remSecrets=remaining.filter(function(f){return f.type==='hardcoded_secret';}).length;
    var remDanger=remaining.filter(function(f){return f.type==='dangerous_call';}).length;
    var tf=R.summary.total_files;
    var sPen=Math.min(remSecrets*20,60);
    var den=remDanger/Math.max(tf,1);
    var dPen=Math.round((1-Math.exp(-den*0.8))*60);
    var newSec=Math.max(0,100-sPen-dPen);
    var comps=R.quality.components;
    var newQ=Math.round(comps.code_smell_score*0.30+newSec*0.25+comps.comment_score*0.20+comps.maintainability_score*0.25);
    var curSec=comps.security_score;
    var curQ=R.quality.score;
    var dSec=newSec-curSec,dQ=newQ-curQ;
    var col=function(d){return d>0?'var(--green)':d<0?'var(--red)':'var(--muted)';};
    var fmt=function(d){return (d>0?'+':'')+d;};
    var proj=document.createElement('div');
    proj.style.cssText='margin-top:1.1rem;padding:.85rem 1rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border2);display:flex;gap:2rem;flex-wrap:wrap;align-items:center';
    proj.innerHTML='<div style="font-size:.78rem;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-right:.5rem">Projected after auto-fixes</div>'
      +'<div style="display:flex;gap:1.5rem;flex-wrap:wrap">'
      +'<div style="text-align:center"><div style="font-size:1.25rem;font-weight:800;color:var(--text)">'+newSec+'<span style="font-size:.85rem;font-weight:600;color:'+col(dSec)+'"> ('+fmt(dSec)+')</span></div><div style="font-size:.68rem;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-top:.15rem">Security Score</div></div>'
      +'<div style="text-align:center"><div style="font-size:1.25rem;font-weight:800;color:var(--text)">'+newQ+'<span style="font-size:.85rem;font-weight:600;color:'+col(dQ)+'"> ('+fmt(dQ)+')</span></div><div style="font-size:.68rem;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-top:.15rem">Quality Score</div></div>'
      +'<div style="font-size:.76rem;color:var(--muted);align-self:center">'+af.length+' auto-fix'+(af.length!==1?'es':'')+' applied &bull; '+remDanger+' dangerous call'+(remDanger!==1?'s':'')+' remaining</div>'
      +'</div>';
    document.getElementById('s-fixplan').querySelector('.card-body').appendChild(proj);
  }
})();

// AI Feedback Loops
(function(){
  var loops=LOOPS||[];
  var loopsSec=document.getElementById('loops-section');
  if(!loops.length){
    loopsSec.innerHTML='<div class="empty-state">No AI refactoring sessions recorded for this codebase.<br>Run: <code style="font-size:.8rem;background:var(--accent);padding:.1rem .35rem;border-radius:3px">node src/index.js refactor &lt;dir&gt;</code> to analyse and refactor, then re-scan to see results here.</div>';
  }else{
    // Group by file
    var byFile={};
    loops.forEach(function(l){var f=l.file||'unknown';if(!byFile[f])byFile[f]=[];byFile[f].push(l);});

    Object.keys(byFile).sort().forEach(function(fname){
      var fns=byFile[fname];
      var nImproved=fns.filter(function(l){return l.finalOutcome==='improved';}).length;
      var nFailed=fns.filter(function(l){return l.finalOutcome==='failed';}).length;
      var nSkipped=fns.filter(function(l){return l.finalOutcome==='skipped'||l.finalOutcome==='dry_run';}).length;
      var totalLoops=fns.reduce(function(s,l){return s+(l.attempts||[]).length;},0);

      var fileItem=document.createElement('div');fileItem.className='loop-item';
      var badges=(nImproved?'<span class="badge bg" style="margin-right:.2rem">'+nImproved+' improved</span>':'')
                +(nFailed?'<span class="badge be" style="margin-right:.2rem">'+nFailed+' failed</span>':'')
                +(nSkipped?'<span class="badge bi" style="margin-right:.2rem">'+nSkipped+' skipped</span>':'');
      var nm=fname.split('/').pop();
      fileItem.innerHTML='<div class="loop-hdr" onclick="_tog(this)">'
        +icon_file()
        +'<span class="loop-fn" title="'+esc(fname)+'">'+esc(nm)
        +'<span style="color:var(--muted);font-weight:400;font-family:sans-serif;font-size:.72rem"> '+esc(fname)+'</span></span>'
        +badges
        +'<span style="font-size:.72rem;color:var(--muted);white-space:nowrap">'+fns.length+' fn'+(fns.length!==1?'s':'')+' &bull; '+totalLoops+' loop'+(totalLoops!==1?'s':'')+'</span>'
        +icon_chev()+'</div><div class="loop-body"></div>';

      var body=fileItem.querySelector('.loop-body');
      body.style.cssText='padding:.3rem 0';

      fns.forEach(function(loop){
        var atts=loop.attempts||[];
        var outcomeColor={'improved':'var(--green)','failed':'var(--red)','dry_run':'var(--blue)','skipped':'var(--muted)'}[loop.finalOutcome]||'var(--muted)';
        var outcomeIcon={'improved':'\u2713 improved','failed':'\u2717 failed','dry_run':'\u25b6 dry run','skipped':'\u2012 skipped'}[loop.finalOutcome]||loop.finalOutcome;

        var fnDiv=document.createElement('div');
        fnDiv.style.cssText='padding:.45rem .9rem;border-bottom:1px solid var(--border)';

        // Function header row
        var hdr=document.createElement('div');
        hdr.style.cssText='display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-size:.81rem;margin-bottom:'+(atts.length?'.35rem':'0');
        hdr.innerHTML='<span style="font-family:monospace;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(loop.functionName||'')+'">'+esc(loop.functionName||'?')+'</span>'
          +'<span class="badge bi">'+esc(loop.smellType||'')+'</span>'
          +'<span style="color:var(--muted);font-size:.74rem">'+atts.length+' loop'+(atts.length!==1?'s':'')+'</span>'
          +'<span style="font-weight:700;font-size:.78rem;color:'+outcomeColor+'">'+outcomeIcon+'</span>';
        fnDiv.appendChild(hdr);

        // Per-loop attempt rows
        atts.forEach(function(a){
          var delta=a.scoreAfter-a.scoreBefore;
          var dhtml=delta>0?'<span style="color:var(--green)">+'+delta+'</span>'
                   :delta<0?'<span style="color:var(--red)">'+delta+'</span>'
                   :'<span style="color:var(--muted)">0</span>';
          var row=document.createElement('div');
          row.style.cssText='display:flex;align-items:center;gap:.55rem;padding:.18rem 0 .18rem 1.2rem;font-size:.77rem;color:var(--dim)';
          row.innerHTML='<span style="color:var(--muted);width:52px;flex-shrink:0">Loop '+a.attempt+'</span>'
            +'<span>'+a.scoreBefore+' \u2192 '+a.scoreAfter+'</span>'
            +'<span>('+dhtml+')</span>'
            +(a.improved
              ?'<span style="color:var(--green)">\u2191 score improved</span>'
              :'<span style="color:var(--muted)">no improvement \u2014 retrying</span>');
          fnDiv.appendChild(row);
        });

        body.appendChild(fnDiv);
      });

      loopsSec.appendChild(fileItem);
    });
  }
})();

// Metrics table
(function(){
  var langs=R.summary.languages;
  var rows=Object.entries(langs).map(function(e){var l=e[1],tot=l.loc+l.comment_lines+l.blank_lines;return{lang:e[0],files:l.files,loc:l.loc,comments:l.comment_lines,blanks:l.blank_lines,functions:l.functions,classes:l.classes,ratio:tot>0?(l.comment_lines/tot*100).toFixed(1):0}});
  var sc='lang',sd=1;
  function render(){
    var s=[].concat(rows).sort(function(a,b){var va=a[sc],vb=b[sc];return typeof va==='string'?sd*va.localeCompare(vb):sd*(va-vb)});
    var tb=document.getElementById('mbody');tb.innerHTML='';
    s.forEach(function(r,i){var tr=document.createElement('tr');tr.className='arow';tr.style.animationDelay=(i*.04)+'s';tr.innerHTML='<td style="font-weight:600">'+esc(r.lang)+'</td><td>'+r.files+'</td><td>'+r.loc.toLocaleString()+'</td><td>'+r.comments.toLocaleString()+'</td><td>'+r.blanks.toLocaleString()+'</td><td>'+r.functions+'</td><td>'+r.classes+'</td><td>'+r.ratio+'%</td>';tb.appendChild(tr)});
  }
  render();
  document.querySelectorAll('#mtbl th').forEach(function(th){th.addEventListener('click',function(){var c=th.dataset.c;if(c===sc)sd*=-1;else{sc=c;sd=1}render()})});
})();

// File explorer
(function(){
  var PG=50,pg=0,q='',sc='path',sd=1,files=R.files;
  function filt(){return files.filter(function(f){return!q||f.path.toLowerCase().includes(q)})}
  function render(){
    var data=filt(),sorted=[].concat(data).sort(function(a,b){var va=a[sc],vb=b[sc];return typeof va==='string'?sd*va.localeCompare(vb):sd*(va-vb)}),st=pg*PG,pd=sorted.slice(st,st+PG),tb=document.getElementById('fbody');
    tb.innerHTML='';
    pd.forEach(function(f){var tr=document.createElement('tr');if(f.security_issues>0)tr.className='rbe';else if(f.smells>0)tr.className='rbw';tr.innerHTML='<td style="font-family:monospace;font-size:.76rem">'+esc(f.path)+'</td><td>'+esc(f.language)+'</td><td>'+f.loc.toLocaleString()+'</td><td>'+(f.comment_lines||0)+'</td><td>'+f.functions+'</td><td>'+f.classes+'</td><td>'+(f.smells?'<span class="badge bw">'+f.smells+'</span>':'-')+'</td><td>'+(f.security_issues?'<span class="badge be">'+f.security_issues+'</span>':'-')+'</td>';tb.appendChild(tr)});
    var tot=Math.ceil(sorted.length/PG),pag=document.getElementById('pager');pag.innerHTML='';
    if(tot>1)for(var i=0;i<tot;i++){(function(pi){var b=document.createElement('button');b.className='pbtn'+(pi===pg?' on':'');b.textContent=pi+1;b.addEventListener('click',function(){pg=pi;render()});pag.appendChild(b)})(i)}
  }
  render();
  document.getElementById('fsearch').addEventListener('input',function(e){q=e.target.value.toLowerCase();pg=0;render()});
  document.querySelectorAll('[data-f]').forEach(function(th){th.addEventListener('click',function(){var c=th.dataset.f;if(c===sc)sd*=-1;else{sc=c;sd=1}render()})});
})();

document.getElementById('ftxt').textContent='Code Scanner \u2022 '+R.scan_metadata.directory+' \u2022 '+R.scan_metadata.timestamp+' \u2022 '+R.scan_metadata.scan_duration_ms+'ms \u2022 '+R.scan_metadata.total_files_scanned+' files';
</script>
</body>
</html>`;

export function generate(report, { fixes = null, feedbackLoops = [] } = {}) {
  const safe = v => JSON.stringify(v).replace(/<\//g, '<\\/');
  return HTML_TEMPLATE
    .replace('__REPORT_JSON__', safe(report))
    .replace('__FIXES_JSON__',  safe(fixes || {}))
    .replace('__LOOPS_JSON__',  safe(feedbackLoops));
}
