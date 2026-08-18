/* ===========================================================
   GreenByte-Bio — Application Logic
   All footprint/score figures are ILLUSTRATIVE ESTIMATES based
   on configurable assumptions. No real emissions are measured.
   =========================================================== */
(function(){
  "use strict";

  /* ---------- NAV ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open'); navToggle.setAttribute('aria-expanded','false');
  }));

  /* ---------- USE CASE GRID ---------- */
  const useCases = [
    {icon:'fa-dna', title:'Bioinformatics & Genomic Analysis', desc:'Alignment, variant calling and annotation pipelines.', driver:'CPU compute hours, repeated pipeline reruns', action:'Cache intermediate results; avoid redundant reruns.'},
    {icon:'fa-vial', title:'DNA/RNA Sequencing Data Processing', desc:'Raw read processing from sequencers into usable data.', driver:'Large raw file transfer & storage', action:'Compress and archive raw reads after QC.'},
    {icon:'fa-diagram-project', title:'Computational Biology', desc:'Simulation and modelling of biological systems.', driver:'Sustained CPU/GPU cluster time', action:'Right-size cluster allocation to workload.'},
    {icon:'fa-atom', title:'Molecular Modelling', desc:'Structural and dynamics simulations of molecules.', driver:'High-performance computing hours', action:'Use checkpointing to avoid full reruns after failures.'},
    {icon:'fa-shapes', title:'Protein Structure Prediction', desc:'AI-based structure prediction workloads.', driver:'GPU-heavy inference cycles', action:'Batch predictions instead of one-off runs.'},
    {icon:'fa-robot', title:'AI/ML Drug Discovery', desc:'Model training for target and candidate discovery.', driver:'GPU training hours, hyperparameter search', action:'Use early stopping and efficient search strategies.'},
    {icon:'fa-database', title:'Large Biological Datasets', desc:'Genomic, imaging and multi-omics datasets.', driver:'Storage volume & duplication', action:'Deduplicate and tier storage by access frequency.'},
    {icon:'fa-cloud', title:'Cloud Research Data', desc:'Cloud-hosted data and compute for research teams.', driver:'Standing cloud storage & compute instances', action:'Shut down idle instances; use lifecycle policies.'},
    {icon:'fa-people-arrows', title:'Online Laboratory Collaboration', desc:'Multi-site teams sharing data and results.', driver:'Repeated data transfer across sites', action:'Use shared central storage instead of copies.'},
    {icon:'fa-server', title:'High-Performance Computing', desc:'Shared clusters for demanding workloads.', driver:'Cluster occupancy & queue time', action:'Schedule jobs efficiently; avoid over-provisioning.'},
    {icon:'fa-microscope', title:'Digital Microscopy & Image Analysis', desc:'High-resolution imaging and downstream analysis.', driver:'Image resolution & retention volume', action:'Review resolution and retention needs per study.'},
    {icon:'fa-box-archive', title:'Long-Term Research Data Storage', desc:'Archival of datasets for reproducibility & compliance.', driver:'Cold storage volume over time', action:'Move to cold-tier storage for rarely accessed data.'},
    {icon:'fa-network-wired', title:'Data Transfer & Network Usage', desc:'Movement of data between systems and collaborators.', driver:'Transfer frequency & payload size', action:'Favour local processing over repeated transfers.'}
  ];
  const grid = document.getElementById('usecaseGrid');
  grid.innerHTML = useCases.map((u,i) => `
    <button class="usecase-card" data-i="${i}" aria-expanded="false">
      <i class="fa-solid ${u.icon}" aria-hidden="true"></i>
      <h4>${u.title}</h4>
      <p>${u.desc}</p>
      <div class="usecase-detail">
        <p><strong>Digital driver:</strong> ${u.driver}</p>
        <p><strong>Sustainability action:</strong> ${u.action}</p>
      </div>
    </button>`).join('');
  grid.querySelectorAll('.usecase-card').forEach(card => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.toggle('open');
      card.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  /* ---------- SCENARIOS ---------- */
  const scenarios = {
    genomics:  {researchers:6, frequency:8,  datasetSize:150, computeHours:40, gpuHours:10, storage:8,  transfer:60,  imaging:0},
    ai:        {researchers:4, frequency:15, datasetSize:80,  computeHours:20, gpuHours:60, storage:5,  transfer:30,  imaging:0},
    microscopy:{researchers:5, frequency:12, datasetSize:200, computeHours:12, gpuHours:5,  storage:20, transfer:40,  imaging:350},
    cloud:     {researchers:10,frequency:20, datasetSize:100, computeHours:15, gpuHours:8,  storage:35, transfer:200, imaging:0}
  };
  const scenarioButtons = document.getElementById('scenarioButtons');
  let currentScenario = 'genomics';
  scenarioButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('.scenario-btn');
    if(!btn) return;
    scenarioButtons.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentScenario = btn.dataset.scenario;
    applyScenario(currentScenario);
    runAssessment();
  });
  function applyScenario(key){
    const s = scenarios[key];
    document.getElementById('researchers').value = s.researchers;
    document.getElementById('frequency').value = s.frequency;
    document.getElementById('datasetSize').value = s.datasetSize;
    document.getElementById('computeHours').value = s.computeHours;
    document.getElementById('gpuHours').value = s.gpuHours;
    document.getElementById('storage').value = s.storage;
    document.getElementById('transfer').value = s.transfer;
    document.getElementById('imaging').value = s.imaging;
  }

  /* ---------- FOOTPRINT MATH (illustrative coefficients) ---------- */
  const COEF = { cpuKwhPerHr:0.05, gpuKwhPerHr:0.30, storageKwhPerTbMonth:2.0, transferKwhPerGb:0.005, imagingKwhPerGb:0.004, gridKgCo2PerKwh:0.71 };

  function readInputs(){
    return {
      researchers: +document.getElementById('researchers').value || 1,
      frequency: +document.getElementById('frequency').value || 1,
      datasetSize: +document.getElementById('datasetSize').value || 0,
      computeHours: +document.getElementById('computeHours').value || 0,
      gpuHours: +document.getElementById('gpuHours').value || 0,
      storage: +document.getElementById('storage').value || 0,
      transfer: +document.getElementById('transfer').value || 0,
      imaging: +document.getElementById('imaging').value || 0
    };
  }

  function computeFootprint(inp, opt){
    opt = opt || {gpu:0, storage:0, transfer:0, imaging:0};
    const gpuHours = inp.gpuHours * (1 - opt.gpu/100);
    const computeHours = inp.computeHours * (1 - opt.gpu/100); // shared compute optimisation
    const storage = inp.storage * (1 - opt.storage/100);
    const transfer = inp.transfer * (1 - opt.transfer/100);
    const imaging = inp.imaging * (1 - opt.imaging/100);

    const computeKwh = computeHours * COEF.cpuKwhPerHr * inp.frequency;
    const gpuKwh = gpuHours * COEF.gpuKwhPerHr * inp.frequency;
    const storageKwh = storage * COEF.storageKwhPerTbMonth;
    const transferKwh = transfer * COEF.transferKwhPerGb * inp.frequency;
    const imagingKwh = imaging * COEF.imagingKwhPerGb * inp.frequency;

    const totalKwh = computeKwh + gpuKwh + storageKwh + transferKwh + imagingKwh;
    const totalCo2 = totalKwh * COEF.gridKgCo2PerKwh;
    return {computeKwh, gpuKwh, storageKwh, transferKwh, imagingKwh, totalKwh, totalCo2};
  }

  function computeDimensions(inp, fp){
    const perResearcher = fp.totalKwh / Math.max(inp.researchers,1);
    function scoreFrom(value, benchmark){
      const ratio = value / benchmark;
      return Math.max(15, Math.min(98, Math.round(100 - ratio*55)));
    }
    const dims = {
      'Energy Efficiency': scoreFrom(perResearcher, 60),
      'Digital Sustainability': scoreFrom(fp.totalKwh, 300),
      'Data Efficiency': scoreFrom(inp.datasetSize, 250),
      'Compute Efficiency': scoreFrom(inp.computeHours, 60),
      'Storage Efficiency': scoreFrom(inp.storage, 25),
      'Network Efficiency': scoreFrom(inp.transfer, 150),
      'Resource Efficiency': scoreFrom(inp.gpuHours, 40),
      'Waste / Redundancy': scoreFrom(inp.frequency * inp.datasetSize, 1500)
    };
    return dims;
  }

  /* ---------- CHARTS ---------- */
  let breakdownChart, whatifChart;
  function renderBreakdownChart(fp){
    const ctx = document.getElementById('breakdownChart');
    const data = {
      labels:['Compute','GPU','Storage','Transfer','Imaging'],
      datasets:[{
        data:[fp.computeKwh, fp.gpuKwh, fp.storageKwh, fp.transferKwh, fp.imagingKwh].map(v=>Math.round(v*10)/10),
        backgroundColor:['#3B7FC4','#1F9D66','#0E7C82','#E4572E','#F2C230'],
        borderWidth:0
      }]
    };
    if(breakdownChart){ breakdownChart.data = data; breakdownChart.update(); return; }
    breakdownChart = new Chart(ctx, {
      type:'doughnut',
      data,
      options:{ plugins:{legend:{position:'bottom', labels:{boxWidth:12, font:{family:'Inter', size:11}}}}, cutout:'62%' }
    });
  }

  function renderWhatifChart(current, greener){
    const ctx = document.getElementById('whatifChart');
    const data = {
      labels:['Compute','GPU','Storage','Transfer','Imaging'],
      datasets:[
        {label:'Current', data:[current.computeKwh,current.gpuKwh,current.storageKwh,current.transferKwh,current.imagingKwh].map(v=>Math.round(v*10)/10), backgroundColor:'#DCEAE3'},
        {label:'Greener', data:[greener.computeKwh,greener.gpuKwh,greener.storageKwh,greener.transferKwh,greener.imagingKwh].map(v=>Math.round(v*10)/10), backgroundColor:'#1F9D66'}
      ]
    };
    if(whatifChart){ whatifChart.data = data; whatifChart.update(); return; }
    whatifChart = new Chart(ctx, {
      type:'bar',
      data,
      options:{ responsive:true, plugins:{legend:{position:'bottom', labels:{font:{family:'Inter', size:11}}}}, scales:{y:{title:{display:true,text:'kWh / month (illustrative)'}}} }
    });
  }

  /* ---------- AI GREEN COACH ---------- */
  function buildCoachRecommendations(inp){
    const recs = [];
    if(inp.computeHours * inp.frequency > 250) recs.push({icon:'fa-microchip', title:'High Compute Usage', text:'Consider optimising computational workflows or reducing unnecessary repeated runs.'});
    if(inp.datasetSize * inp.frequency > 1200) recs.push({icon:'fa-database', title:'Large Dataset', text:'Review dataset duplication, compression and archival strategies.'});
    if(inp.storage > 15) recs.push({icon:'fa-box-archive', title:'High Storage', text:'Identify redundant and obsolete research files for archival or deletion.'});
    if(inp.transfer * inp.frequency > 800) recs.push({icon:'fa-network-wired', title:'High Data Transfer', text:'Consider local processing, efficient transfer strategies or data locality.'});
    if(inp.gpuHours * inp.frequency > 300) recs.push({icon:'fa-server', title:'High GPU Usage', text:'Evaluate whether every workflow requires GPU acceleration.'});
    if(inp.frequency > 15) recs.push({icon:'fa-cloud', title:'High Cloud Usage', text:'Compare alternative compute/storage configurations for resource efficiency.'});
    if(inp.imaging > 100) recs.push({icon:'fa-microscope', title:'High Microscopy Workload', text:'Review image resolution, retention and processing pipelines where scientifically appropriate.'});
    if(recs.length === 0) recs.push({icon:'fa-circle-check', title:'Balanced Workflow', text:'Current inputs suggest a relatively efficient digital workflow. Keep monitoring as usage grows.'});
    return recs;
  }

  /* ---------- MAIN RUN ---------- */
  function runAssessment(){
    const inp = readInputs();
    const fp = computeFootprint(inp);
    const dims = computeDimensions(inp, fp);
    const overall = Math.round(Object.values(dims).reduce((a,b)=>a+b,0) / Object.values(dims).length);

    // Score gauge
    const arc = document.getElementById('scoreArc');
    const circumference = 267;
    const offset = circumference - (overall/100)*circumference;
    arc.style.strokeDashoffset = offset;
    document.getElementById('greenScoreValue').textContent = overall;
    const verdictEl = document.getElementById('greenScoreVerdict');
    verdictEl.textContent = overall >= 75 ? 'Strong digital sustainability' : overall >= 55 ? 'Moderate — room to improve' : 'High digital footprint — act now';

    // Dimension bars
    const dimsEl = document.getElementById('scoreDims');
    dimsEl.innerHTML = Object.entries(dims).map(([name,val]) => `
      <div class="score-dim">
        <span class="dim-name">${name}</span>
        <span class="dim-bar"><span class="dim-fill" style="width:${val}%"></span></span>
        <span class="dim-val">${val}</span>
      </div>`).join('');

    // kWh / CO2 stats
    document.getElementById('kwhValue').textContent = Math.round(fp.totalKwh);
    document.getElementById('co2Value').textContent = Math.round(fp.totalCo2);

    renderBreakdownChart(fp);

    // AI Coach
    const coachList = document.getElementById('coachList');
    coachList.innerHTML = buildCoachRecommendations(inp).map(r => `
      <li class="coach-item"><i class="fa-solid ${r.icon}"></i><div><h5>${r.title}</h5><p>${r.text}</p></div></li>`).join('');

    updateWhatif();
  }

  /* ---------- WHAT-IF SIMULATOR ---------- */
  const optGpu = document.getElementById('optGpu'), optStorage = document.getElementById('optStorage'),
        optTransfer = document.getElementById('optTransfer'), optImaging = document.getElementById('optImaging');
  [optGpu, optStorage, optTransfer, optImaging].forEach(sl => sl.addEventListener('input', updateWhatif));

  function updateWhatif(){
    document.getElementById('optGpuVal').textContent = optGpu.value + '%';
    document.getElementById('optStorageVal').textContent = optStorage.value + '%';
    document.getElementById('optTransferVal').textContent = optTransfer.value + '%';
    document.getElementById('optImagingVal').textContent = optImaging.value + '%';

    const inp = readInputs();
    const current = computeFootprint(inp);
    const greener = computeFootprint(inp, {gpu:+optGpu.value, storage:+optStorage.value, transfer:+optTransfer.value, imaging:+optImaging.value});
    const reduction = current.totalKwh > 0 ? Math.round((1 - greener.totalKwh/current.totalKwh)*100) : 0;
    const savedMonthly = Math.max(0, Math.round(current.totalKwh - greener.totalKwh));
    document.getElementById('whatifReduction').textContent = reduction + '%';
    document.getElementById('whatifSavedMonthly').textContent = savedMonthly + ' kWh';
    document.getElementById('whatifSavedAnnual').textContent = (savedMonthly*12) + ' kWh';
    renderWhatifChart(current, greener);

    updateCollective(savedMonthly, current.totalCo2 - greener.totalCo2);
  }

  /* ---------- COLLECTIVE IMPACT ---------- */
  const labCountSlider = document.getElementById('labCountSlider');
  const labSteps = [10, 100, 1000];
  let lastSavedKwh = 0, lastSavedCo2 = 0;
  labCountSlider.addEventListener('input', () => updateCollective(lastSavedKwh, lastSavedCo2));

  function updateCollective(savedKwh, savedCo2){
    lastSavedKwh = savedKwh; lastSavedCo2 = Math.max(0, savedCo2);
    const labs = labSteps[+labCountSlider.value];
    document.getElementById('labCountLabel').textContent = labs.toLocaleString();
    const totalKwh = Math.round(savedKwh * labs);
    const totalCo2 = Math.round(lastSavedCo2 * labs);
    const trees = Math.round(totalCo2*12 / 21); // illustrative: ~21kg CO2 absorbed per seedling per year
    document.getElementById('collectiveKwh').textContent = totalKwh.toLocaleString();
    document.getElementById('collectiveCo2').textContent = totalCo2.toLocaleString();
    document.getElementById('collectiveTrees').textContent = trees.toLocaleString();
  }

  /* ---------- ASSESSMENT BUTTONS ---------- */
  document.getElementById('runAssessmentBtn').addEventListener('click', runAssessment);
  document.getElementById('demoDataBtn').addEventListener('click', () => { applyScenario(currentScenario); runAssessment(); });
  document.getElementById('resetAssessBtn').addEventListener('click', () => { applyScenario('genomics'); scenarioButtons.querySelector('[data-scenario="genomics"]').click(); });
  document.getElementById('printReportBtn').addEventListener('click', () => window.print());
  ['researchers','frequency','datasetSize','computeHours','gpuHours','storage','transfer','imaging'].forEach(id => {
    document.getElementById(id).addEventListener('change', runAssessment);
  });

  /* ---------- INDUSTRY VIEW ---------- */
  const industryOverlay = document.getElementById('industryOverlay');
  function openIndustry(){ industryOverlay.classList.add('open'); }
  function closeIndustry(){ industryOverlay.classList.remove('open'); }
  document.getElementById('industryViewBtn').addEventListener('click', openIndustry);
  document.getElementById('forIndustryLink').addEventListener('click', openIndustry);
  document.getElementById('closingPartnerBtn').addEventListener('click', openIndustry);
  document.getElementById('industryCloseBtn').addEventListener('click', closeIndustry);
  industryOverlay.addEventListener('click', (e) => { if(e.target === industryOverlay) closeIndustry(); });
  document.getElementById('requestDemoBtn').addEventListener('click', () => {
    const subject = encodeURIComponent('GreenByte-Bio — Demo Request');
    const body = encodeURIComponent('Hello,\n\nI would like to learn more about GreenByte-Bio and explore a demonstration for our organisation.\n\nName:\nOrganisation:\nRole:\nArea of interest:\n\nThank you.');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  /* ---------- JUDGE MODE ---------- */
  const judgeSlidesData = [
    {tag:'01 · Problem', title:'The Hidden Digital Footprint', body:'Modern bio-research runs on genomics, AI/ML, cloud and HPC — all of which consume energy that is rarely tracked alongside physical lab sustainability.'},
    {tag:'02 · Solution', title:'GreenByte-Bio', body:'An AI-driven sustainability intelligence platform that measures, understands, reduces and predicts the digital footprint of biotechnology research.', list:['Measure','Understand','Reduce','Predict']},
    {tag:'03 · Live Demo', title:'Interactive Bio-Lab Assessment', body:'Select a workflow (genomics, AI drug discovery, microscopy, cloud research), enter a few parameters, and get results in under a minute.'},
    {tag:'04 · Output', title:'Bio-Lab Green Score', body:'A 0–100 indicative score across 8 sustainability dimensions — energy, data, compute, storage, network, resource and waste efficiency.'},
    {tag:'05 · Output', title:'Digital Footprint Breakdown', body:'A visual breakdown of estimated energy use across compute, GPU, storage, transfer and imaging.'},
    {tag:'06 · Intelligence', title:'AI Green Coach', body:'Dynamic, rule-based recommendations that respond to each lab\'s specific usage pattern.'},
    {tag:'07 · Planning', title:'What-If Simulator', body:'Compare current vs. optimised greener workflows, with estimated percentage reduction and annualised savings.'},
    {tag:'08 · Scale', title:'Collective Impact', body:'Illustrates how small per-lab improvements compound across 10, 100 or 1,000 labs.'},
    {tag:'09 · Commercial', title:'Startup Potential', body:'A clear path from hackathon MVP to SaaS, institutional licensing, API and enterprise ESG products — targeting biotech, pharma, CROs, universities and cloud/HPC providers.'},
    {tag:'10 · Vision', title:'Future Roadmap', body:'Lab → Institution → Enterprise → Global Research Ecosystem, with modules like GreenByte-Bio AI, Cloud, HPC, ESG and API.'}
  ];
  const judgeOverlay = document.getElementById('judgeOverlay');
  const judgeSlidesEl = document.getElementById('judgeSlides');
  const judgeProgress = document.getElementById('judgeProgress');
  const judgeStepLabel = document.getElementById('judgeStepLabel');
  let judgeIndex = 0;

  judgeSlidesEl.innerHTML = judgeSlidesData.map((s,i) => `
    <div class="judge-slide ${i===0?'active':''}" data-i="${i}">
      <p class="jstag">${s.tag}</p>
      <h3>${s.title}</h3>
      <p>${s.body}</p>
      ${s.list ? `<ul class="judge-mini-list">${s.list.map(l=>`<li><i class="fa-solid fa-circle-check"></i> ${l}</li>`).join('')}</ul>` : ''}
    </div>`).join('');

  function renderJudge(){
    judgeSlidesEl.querySelectorAll('.judge-slide').forEach((el,i) => el.classList.toggle('active', i===judgeIndex));
    judgeProgress.style.width = `${((judgeIndex+1)/judgeSlidesData.length)*100}%`;
    judgeStepLabel.textContent = `${judgeIndex+1} / ${judgeSlidesData.length}`;
  }
  function openJudge(){ judgeIndex = 0; renderJudge(); judgeOverlay.classList.add('open'); }
  function closeJudge(){ judgeOverlay.classList.remove('open'); }
  document.getElementById('judgeModeBtn').addEventListener('click', openJudge);
  document.getElementById('judgeCloseBtn').addEventListener('click', closeJudge);
  judgeOverlay.addEventListener('click', (e) => { if(e.target === judgeOverlay) closeJudge(); });
  document.getElementById('judgeNextBtn').addEventListener('click', () => { if(judgeIndex < judgeSlidesData.length-1){ judgeIndex++; renderJudge(); } else { closeJudge(); } });
  document.getElementById('judgePrevBtn').addEventListener('click', () => { if(judgeIndex > 0){ judgeIndex--; renderJudge(); } });
  document.addEventListener('keydown', (e) => {
    if(judgeOverlay.classList.contains('open')){
      if(e.key === 'Escape') closeJudge();
      if(e.key === 'ArrowRight') document.getElementById('judgeNextBtn').click();
      if(e.key === 'ArrowLeft') document.getElementById('judgePrevBtn').click();
    }
    if(e.key === 'Escape' && industryOverlay.classList.contains('open')) closeIndustry();
  });

  /* ---------- INIT ---------- */
  applyScenario('genomics');
  runAssessment();
})();
