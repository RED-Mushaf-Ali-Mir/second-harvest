(() => {
  const $ = id => document.getElementById(id);
  let busy = false;
  let snapshot = null;
  let retryStage = 'benefits';
  let timer;
  let disabledBefore = [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function text(tag,value,parent,className = '') {
    const node = document.createElement(tag);
    node.textContent = value; node.className = className;
    parent.append(node); return node;
  }
  function links(urls,parent) {
    if (!urls.length) return;
    const wrap = document.createElement('div'); wrap.className = 'source-links'; parent.append(wrap);
    for (const url of [...new Set(urls)]) {
      let parsed;
      try { parsed = new URL(url); } catch { continue; }
      if (parsed.protocol !== 'https:') continue;
      const link = text('a',parsed.hostname.replace('www.',''),wrap);
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    }
  }
  function showError(error) {
    $('error').textContent = error.message || 'Something went wrong. Please retry.';
    $('error').hidden = false;
  }
  function stage(index) {
    ['story-section','review-section','results-section'].forEach((id,i) => {
      $(id).hidden = i !== index;
      if (i === index) { $(id).classList.remove('fade-in'); void $(id).offsetWidth; $(id).classList.add('fade-in'); }
    });
    document.querySelectorAll('.step').forEach((node,i) => {
      node.classList.toggle('active',i === index); node.classList.toggle('done',i < index);
      if (i === index) node.setAttribute('aria-current','step'); else node.removeAttribute('aria-current');
    });
    $('error').hidden = true;
    document.querySelector('.journey').scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
  }
  function progress(message) {
    clearInterval(timer);
    const start = performance.now();
    $('progress').hidden = false;
    const update = () => $('progress-text').textContent = `${message} · ${Math.floor((performance.now()-start)/1000)}s`;
    update(); timer = setInterval(update,1000);
  }
  function begin(message) {
    busy = true; $('error').hidden = true;
    disabledBefore = [...document.querySelectorAll('button,input,textarea,select')].map(node => [node,node.disabled]);
    disabledBefore.forEach(([node]) => node.disabled = true);
    $('results-section').setAttribute('aria-busy','true');
    progress(message);
  }
  function end() {
    clearInterval(timer); $('progress').hidden = true; busy = false;
    disabledBefore.forEach(([node,disabled]) => { if (node.isConnected) node.disabled = disabled; });
    // Cards can be created while the request is in flight.
    document.querySelectorAll('.explore-button').forEach(node => node.disabled = false);
    $('results-section').setAttribute('aria-busy','false');
    FoodEditor.count();
  }
  async function api(url,payload) {
    const response = await fetch(url,payload ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)} : {});
    let data;
    try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response. Check the Uvicorn terminal.'); }
    if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please check your food names, descriptions and setup.');
    return data;
  }
  function foodSymbol(name) {
    const n = name.toLowerCase();
    if (/tomato/.test(n)) return '🍅';
    if (/mango/.test(n)) return '🥭';
    if (/banana/.test(n)) return '🍌';
    if (/carrot/.test(n)) return '🥕';
    if (/avocado/.test(n)) return '🥑';
    if (/lemon|lime/.test(n)) return '🍋';
    if (/onion|celery|lettuce|herb/.test(n)) return '🌿';
    return '✳';
  }
  function renderBenefits(data) {
    const root = $('benefit-cards'); root.replaceChildren();
    data.benefits.forEach((food,i) => {
      const card = document.createElement('article'); card.className = 'card benefit card-enter';
      card.style.setProperty('--delay',`${Math.min(i,5)*65}ms`); root.append(card);
      text('div',foodSymbol(food.name),card,'food-symbol').setAttribute('aria-hidden','true');
      text('span',food.basis,card,'badge'); text('h3',food.name,card);
      const chips = document.createElement('div'); chips.className = 'chips'; card.append(chips);
      food.nutrients.forEach(n => text('span',n,chips,'chip'));
      text('p',food.summary,card);
      text('p',food.note,card,'tip'); links(food.sources,card);
    });
  }
  function renderRanking(data) {
    $('ranking-section').hidden = false;
    $('ranking-note').textContent = data.ranking_note;
    $('season-note').textContent = data.season_note;
    const root = $('growing-cards'); root.replaceChildren();
    let rank = 0;
    data.options.forEach((option,i) => {
      const card = document.createElement('article'); card.className = `card growing card-enter ${option.status}`;
      card.style.setProperty('--delay',`${Math.min(i,5)*70}ms`); root.append(card);
      text('div',option.status === 'not_suitable' ? '—' : String(++rank).padStart(2,'0'),card,'rank');
      const body = document.createElement('div'); card.append(body);
      const labels = {candidate:'A promising starting point',check:'Check a few things first',not_suitable:'Not from these leftovers'};
      text('span',labels[option.status],body,'badge');
      const sameTitle = option.name.trim().toLowerCase() === option.title.trim().toLowerCase();
      text('h3',sameTitle ? option.name : `${option.name} · ${option.title}`,body);
      text('p',`You saved: ${option.leftovers}`,body,'tip');
      text('p',option.reason,body); text('p',option.outcome,body,'outcome');
      if (option.checks.length) {
        const list = document.createElement('ul'); list.className = 'checks'; body.append(list);
        option.checks.forEach(check => text('li',check,list));
      }
      if (option.reference_note) {
        const details = document.createElement('details'); body.append(details);
        text('summary','Reference note',details); text('p',option.reference_note,details);
      }
      text('p',option.basis,body,'tip'); links(option.sources,body);
      if (option.status !== 'not_suitable') {
        const button = text('button','Create my growing guide →',body,'ghost small explore-button');
        button.type = 'button'; button.disabled = busy;
        const output = document.createElement('div'); output.setAttribute('aria-live','polite'); body.append(output);
        button.addEventListener('click',async () => {
          if (busy) return;
          if (output.children.length) {
            output.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
            return;
          }
          begin(`Creating your ${option.name.toLowerCase()} growing guide`);
          try {
            const data = await api('/api/guide',{...snapshot,selected:option.item_id});
            renderGuide(data,output);
            button.textContent = 'View my growing guide ↓';
            output.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
          } catch(error) { showError(error); } finally { end(); }
        });
      }
    });
  }
  function renderGuide(data,output) {
    const guide = data.guide;
    output.replaceChildren(); output.className = 'guide-panel fade-in';
    const content = document.createElement('div'); content.className = 'guide-content'; output.append(content);
    text('div','Second Harvest · Your next small beginning',content,'eyebrow');
    text('h3',guide.title,content,'guide-title');
    text('p',`Saved material: ${guide.leftovers}`,content,'muted');
    const setup = guide.setup;
    const sun = {unknown:'not sure',low:'under 2 hours',medium:'2 to under 6 hours',high:'6 hours or more'};
    const materials = {unknown:'not sure',ready:'both available',missing:'one or both missing'};
    const vessel = {unknown:'not sure',yes:'available',no:'not available'};
    text('p',`${setup.space} · Direct sun: ${sun[setup.sunlight]} · Goal: ${setup.goal}`,content,'tip');
    text('p',`Growing medium + draining container: ${materials[setup.materials]} · Vessel + water: ${vessel[setup.vessel]}`,content,'tip');
    function section(title,items,ordered=false,className='') {
      if (!items.length) return;
      const block = document.createElement('section'); block.className = `guide-section ${className}`; content.append(block);
      text('h4',title,block);
      const list = document.createElement(ordered ? 'ol' : 'ul'); block.append(list);
      items.forEach(item => text('li',item,list));
    }
    if (!guide.suitable) text('p','This saved material needs a different growing approach. Review the notes before starting.',content,'guide-caution');
    section('What you’ll need',guide.materials);
    section('What you can do now',guide.do_now,false,'guide-now');
    section('Before planting: arrange or confirm',guide.before_start,false,'guide-before');
    if (guide.steps.length) {
      text('p','Follow the planting steps only after the checks above are satisfied.',content,'tip');
      section('Your planting steps',guide.steps,true);
    }
    section('Care & observation',guide.care);
    text('h4','What to expect',content);
    text('p',guide.expectations,content);
    if (guide.reference_note) text('p',guide.reference_note,content,'tip');
    text('p',`${guide.basis} · ${data.model} · ${data.seconds}s`,content,'tip');
    text('p','Season and weather are not checked. Growth and harvest are not guaranteed.',content,'tip');
    links(guide.sources,content);
    const actions = document.createElement('div'); actions.className = 'actions guide-actions'; output.append(actions);
    const print = text('button','Print / Save as PDF',actions,'ghost small'); print.type = 'button';
    print.addEventListener('click',() => {
      let area = $('print-guide');
      if (!area) { area = document.createElement('div'); area.id = 'print-guide'; document.body.append(area); }
      area.replaceChildren(content.cloneNode(true));
      const originalTitle = document.title;
      document.title = guide.title + ' — Second Harvest';
      try { window.print(); } finally { document.title = originalTitle; }
    });
    text('span','Choose “Save as PDF” in your browser’s print window.',actions,'tip');
  }
  async function discoveries(from) {
    if (busy || !snapshot) return;
    begin(from === 'benefits' ? 'Discovering what your foods contribute' : 'Comparing your growing possibilities');
    $('retry-results').hidden = true;
    try {
      if (from === 'benefits') {
        retryStage = 'benefits';
        const benefits = await api('/api/benefits',{items:snapshot.items});
        renderBenefits(benefits);
      }
      retryStage = 'ranking'; progress('Your benefits are ready. Comparing growing possibilities');
      const ranking = await api('/api/options',snapshot);
      renderRanking(ranking);
    } catch(error) {
      showError(error); $('retry-results').textContent = retryStage === 'benefits' ? 'Retry food benefits' : 'Retry growing comparison';
      $('retry-results').hidden = false;
    } finally { end(); }
  }
  $('story-form').addEventListener('submit',async event => {
    event.preventDefault(); if (busy || !$('story-form').reportValidity()) return;
    begin('Reading your meal and leftovers');
    try {
      const data = await api('/api/interpret',{description:$('meal-story').value.trim()});
      FoodEditor.set(data.interpretation.items); stage(1);
      if (!data.interpretation.items.length) FoodEditor.add();
    } catch(error) { showError(error); } finally { end(); }
  });
  $('manual-button').addEventListener('click',() => {
    if (busy) return;
    if (!$('food-rows').children.length) FoodEditor.add({},false);
    stage(1);
  });
  $('sample-button').addEventListener('click',() => {
    $('meal-story').value = 'I made a salad. I saved fresh uncooked spring onion white bases with roots attached, and seeds from a ripe raw tomato. I also ate a banana, but only its peel remains. I also ate a mango and saved its seed.';
    $('meal-story').focus();
  });
  $('back-story').addEventListener('click',() => { if (!busy) stage(0); });
  $('edit-foods').addEventListener('click',() => { if (!busy) stage(1); });
  $('review-form').addEventListener('submit',event => {
    event.preventDefault(); if (busy || !$('review-form').reportValidity()) return;
    try {
      const items = FoodEditor.read();
      snapshot = {items};
      ['space','sunlight','vessel','materials','location','goal'].forEach(key => snapshot[key] = $(key).value.trim());
      $('confirmed-summary').textContent = `${items.map(item => item.food).join(' · ')} — ${snapshot.goal}`;
      $('benefit-cards').replaceChildren(); $('growing-cards').replaceChildren();
      $('ranking-section').hidden = true; stage(2); discoveries('benefits');
    } catch(error) { showError(error); }
  });
  $('retry-results').addEventListener('click',() => discoveries(retryStage));
  api('/api/health').then(data => {
    $('connection').textContent = data.message;
    $('connection-dot').classList.toggle('ready',data.ready);
  }).catch(() => $('connection').textContent = 'Application server unavailable');
})();
