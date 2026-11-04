/* PrintFly shared pricing + configurator markup. Used by the build (Node) and the browser (assets/app.js). */
(function (root) {
  const tier = q => q>=2500?.3:q>=1000?.36:q>=500?.42:q>=250?.48:q>=100?.56:q>=50?.64:q>=25?.74:q>=10?.84:q>=5?.92:1;
  function interp(c,x){ if(x<=c[0][0]) return c[0][1]; for(let k=1;k<c.length;k++){ if(x<=c[k][0]){ const [x0,y0]=c[k-1],[x1,y1]=c[k]; return y0+(y1-y0)*(x-x0)/(x1-x0); } } const [xl,yl]=c[c.length-1]; return yl/xl*x; }
  function unitBase(p,s,i){ if(p.curve) return interp(p.curve, s.w*s.h/144); if(p.flat) return p.flat[Math.min(i,p.flat.length-1)]; return Math.max(p.min, s.w*s.h/144*p.ppsf); }
  function quote(p,s,i,q,m=1,add=0){ const base=unitBase(p,s,i)*m+add; let f; if(p.qcurve){ f=p.qcurve[0][1]; for(const [qq,ff] of p.qcurve){ if(q>=qq) f=ff; } } else f= q>=p.qtys[0]? tier(q)/tier(p.qtys[0]) : 1; const unit=base*f; return {unit,total:unit*q,save:Math.round((1-f)*100)}; }
  const money = n => '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const modTag = v => !v?'': v[0]==='x' ? (v==='x1'?'':(+v.slice(1)>1?'+':'−')+Math.round(Math.abs(+v.slice(1)-1)*100)+'%') : ((+v.slice(1))<0?'−':'+')+money(Math.abs(+v.slice(1))).replace('.00','');
  const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  /* sel = {si, qi, pk, o:[index per option group], cw, ch, cq} */
  function mods(p,sel){ let m=sel.pk?0.45:1, a=0; (p.opts||[]).forEach(([,ch],gi)=>{ const v=ch[sel.o[gi]||0][1]; if(!v) return; if(v[0]==='x') m*=+v.slice(1); else a+=+v.slice(1); }); return [m,a]; }
  function curSize(p,sel){ const s=p.sizes[sel.si]; if(s.label!=='Custom size') return s;
    const r=p.range; const w=r?Math.min(r[1],Math.max(r[0],+sel.cw||r[0])):(+sel.cw||1); const h=r?Math.min(r[3],Math.max(r[2],+sel.ch||r[2])):(+sel.ch||1);
    return {w,h,label:`${w}″ × ${h}″`}; }
  function curQty(p,sel){ return sel.qi===-1 ? Math.max(1,parseInt(sel.cq)||0) : p.qtys[sel.qi]; }
  function price(p,sel){ const [m,a]=mods(p,sel); return quote(p,curSize(p,sel),sel.si,curQty(p,sel),m,a); }
  function defaultSel(p){ return {si:0,qi:0,pk:0,o:(p.opts||[]).map(()=>0),cw:p.sizes[0].w,ch:p.sizes[0].h,cq:''}; }
  function sizesHTML(p,sel){
    return `<select class="mselect" id="sizeSel" aria-label="Size">${p.sizes.map((s,i)=>`<option value="${i}"${i===sel.si?' selected':''}>${esc(s.label)}</option>`).join('')}</select>
      <div class="choices" id="sizes">${p.sizes.map((s,i)=>`<label class="choice${i===sel.si?' sel':''}" style="grid-template-columns:22px 1fr"><input type="radio" name="size" id="size-${i}" value="${i}"${i===sel.si?' checked':''}><span class="lbl">${esc(s.label)}</span></label>`).join('')}</div>`;
  }
  function customSizeHTML(p,sel){
    if(p.sizes[sel.si].label!=='Custom size') return '';
    return `<div class="custom-row"><label for="cw">W</label><input id="cw" type="number" min="1" value="${esc(sel.cw)}"> ″ ×<label for="ch">H</label><input id="ch" type="number" min="1" value="${esc(sel.ch)}"> ″${p.range?`<small style="color:var(--muted);width:100%">Width ${p.range[0]}–${p.range[1]}″ · Height ${p.range[2]}–${p.range[3]}″</small>`:''}</div>`;
  }
  function qtyHTML(p,sel){
    const s=curSize(p,sel); const [m,a]=mods(p,sel);
    const rows=p.qtys.map((q,i)=>[q,quote(p,s,sel.si,q,m,a)]);
    return `<select class="mselect" id="qtySel" aria-label="Quantity">${rows.map(([q,r],i)=>`<option value="${i}"${i===sel.qi?' selected':''}>${q.toLocaleString('en-US')} — ${money(r.total)}${r.save>0?' (Save '+r.save+'%)':''}</option>`).join('')}<option value="-1"${sel.qi===-1?' selected':''}>Custom quantity</option></select>
      <div class="choices" id="qtys">${rows.map(([q,r],i)=>`<label class="choice${i===sel.qi?' sel':''}"><input type="radio" name="qty" id="qty-${i}" value="${i}"${i===sel.qi?' checked':''}><span class="lbl">${q.toLocaleString('en-US')}</span><span class="p">${money(r.total)}</span><span class="save">${r.save>0?'Save '+r.save+'%':''}</span></label>`).join('')}<label class="choice${sel.qi===-1?' sel':''}"><input type="radio" name="qty" id="qty-custom" value="-1"${sel.qi===-1?' checked':''}><span class="lbl">Custom quantity</span><span></span><span></span></label></div>
      ${sel.qi===-1?`<div class="custom-row"><label for="cq">Quantity</label><input id="cq" type="number" min="1" value="${esc(sel.cq)}" placeholder="e.g. 75"></div>`:''}`;
  }
  function optsHTML(p){
    const pk = p.pkg ? `<details class="acc"><summary><span class="acc-name">Package</span><span class="acc-val" id="av-pk">Complete (graphic + hardware)</span></summary><div class="acc-body"><div class="choices" id="pks"><label class="choice sel" style="grid-template-columns:22px 1fr"><input type="radio" name="pk" id="pk-0" value="0" checked><span class="lbl">Complete (graphic + hardware)</span></label><label class="choice" style="grid-template-columns:22px 1fr"><input type="radio" name="pk" id="pk-1" value="1"><span class="lbl">Replacement graphic only</span></label></div></div></details>` : '';
    const groups = (p.opts||[]).map(([nm,ch],gi)=>`<details class="acc"><summary><span class="acc-name">${esc(nm)}</span><span class="acc-val" id="av-${gi}">${esc(ch[0][0])}${modTag(ch[0][1])?' · '+modTag(ch[0][1]):''}</span></summary><div class="acc-body"><div class="choices" data-og="${gi}">${ch.map(([l,v],i)=>`<label class="choice${i?'':' sel'}" style="grid-template-columns:22px 1fr auto"><input type="radio" name="o-${gi}" id="o-${gi}-${i}" value="${i}"${i?'':' checked'}><span class="lbl">${esc(l)}</span><span class="save" style="color:var(--muted)">${modTag(v)}</span></label>`).join('')}</div></div></details>`).join('');
    const notes = `<details class="acc"><summary><span class="acc-name">Notes for production</span><span class="acc-val" id="av-notes">None</span></summary><div class="acc-body"><textarea id="notes" rows="3" class="notes" placeholder="Colors to match, text to change, deadline, install address…"></textarea></div></details>`;
    return `<div class="opt accs"><div class="opt-head"><h2>Options</h2><button type="button" id="accAll">Expand all</button></div>${pk}${groups}${notes}</div>`;
  }
  const api={tier,interp,unitBase,quote,money,modTag,esc,mods,curSize,curQty,price,defaultSel,sizesHTML,customSizeHTML,qtyHTML,optsHTML};
  if (typeof module!=='undefined' && module.exports) module.exports=api; else root.PF=api;
})(this);

/* ===== PrintFly storefront behaviour ===== */
(function(){
const {money,esc,modTag}=PF;
const DISCOUNT_CODES = { /* 'CODE': 0.10  — add real codes here (fraction off) */ };
const $ = id => document.getElementById(id);

/* ---------- cart storage ---------- */
let cart=[]; try{ cart=JSON.parse(localStorage.getItem('pf-cart')||'[]'); }catch(e){ cart=[]; }
function saveCart(){ try{ localStorage.setItem('pf-cart',JSON.stringify(cart)); }catch(e){} updateCount(); }
function updateCount(){ const el=$('cartCount'); if(!el) return; el.textContent=cart.length; el.hidden=!cart.length; }
function toast(msg){ const t=$('toast'); if(!t) return; t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2600); }
updateCount();

/* ---------- header ---------- */
const msgs=[...document.querySelectorAll('#stripMsgs span')];
if(msgs.length>1){ let i=0; setInterval(()=>{ msgs[i].classList.remove('on'); i=(i+1)%msgs.length; msgs[i].classList.add('on'); },3500); }
const mega=$('mega'), pb=$('productsBtn');
if(mega&&pb){ pb.addEventListener('click',()=>{ const o=mega.hidden; mega.hidden=!o; pb.setAttribute('aria-expanded',String(o)); });
  document.addEventListener('click',e=>{ if(!mega.hidden && !mega.contains(e.target) && e.target!==pb){ mega.hidden=true; pb.setAttribute('aria-expanded','false'); } }); }
const drawer=$('drawer'); if(drawer){ $('burger').addEventListener('click',()=>drawer.hidden=false); drawer.addEventListener('click',e=>{ if(e.target===drawer||e.target.closest('a')||e.target.closest('.drawer-close')) drawer.hidden=true; }); }

/* ---------- product page ---------- */
const pdEl=$('pdata');
if(pdEl){
  const p=JSON.parse(pdEl.textContent); const sel=PF.defaultSel(p);
  const renderSizes=()=>{ $('sizeWrap').innerHTML=PF.sizesHTML(p,sel); $('customSize').innerHTML=PF.customSizeHTML(p,sel);
    ['cw','ch'].forEach(k=>{ const el=$(k); if(el) el.addEventListener('input',()=>{ sel[k]=el.value; renderQ(); }); }); };
  const renderQ=()=>{ $('qtyWrap').innerHTML=PF.qtyHTML(p,sel); const cq=$('cq'); if(cq) cq.addEventListener('input',()=>{ sel.cq=cq.value; renderTotal(); }); renderTotal(); };
  const renderTotal=()=>{ const r=PF.price(p,sel); const q=PF.curQty(p,sel); $('total').textContent=money(r.total); $('per').textContent=`${money(r.unit)} / ${p.unit} · ${q.toLocaleString('en-US')} ${p.unit}${q>1?'s':''}`; };
  document.querySelector('.config').addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='sizeSel'||t.name==='size'){ sel.si=+t.value; const s=p.sizes[sel.si]; sel.cw=s.w; sel.ch=s.h; renderSizes(); renderQ(); }
    else if(t.id==='qtySel'||t.name==='qty'){ sel.qi=+t.value; renderQ(); if(sel.qi===-1) $('cq')?.focus(); }
    else if(t.name==='pk'){ sel.pk=+t.value; document.querySelectorAll('#pks .choice').forEach((l,i)=>l.classList.toggle('sel',i===sel.pk)); $('av-pk').textContent=sel.pk?'Replacement graphic only':'Complete (graphic + hardware)'; renderQ(); }
    else if(t.name&&t.name.startsWith('o-')){ const gi=+t.name.slice(2); sel.o[gi]=+t.value; document.querySelectorAll(`[data-og="${gi}"] .choice`).forEach((l,i)=>l.classList.toggle('sel',i===sel.o[gi])); const [l,v]=p.opts[gi][1][sel.o[gi]]; $('av-'+gi).textContent=l+(modTag(v)?' · '+modTag(v):''); renderQ(); }
  });
  const nt=$('notes'); nt.addEventListener('input',()=>{ const t=nt.value.trim(); $('av-notes').textContent=t?(t.length>28?t.slice(0,28)+'…':t):'None'; });
  const ab=$('accAll'); ab.addEventListener('click',()=>{ const accs=[...document.querySelectorAll('.accs details')]; const open=accs.some(d=>!d.open); accs.forEach(d=>d.open=open); ab.textContent=open?'Collapse all':'Expand all'; });
  const thumbs=document.querySelector('.thumbs');
  if(thumbs) thumbs.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; thumbs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); const img=$('mainImg').querySelector('img'); img.src=b.dataset.src; img.alt=b.querySelector('img').alt; });
  $('sizeHelp')?.addEventListener('click',()=>{ const f=$('faqs'); if(!f) return; f.querySelector('details')?.setAttribute('open',''); f.scrollIntoView({behavior:'smooth'}); });
  $('addBtn').addEventListener('click',()=>{
    const s=PF.curSize(p,sel), q=PF.curQty(p,sel), r=PF.price(p,sel);
    const opts=(p.opts||[]).map(([nm,ch],gi)=>`${nm}: ${ch[sel.o[gi]][0]}`);
    if(p.pkg) opts.unshift('Package: '+(sel.pk?'Replacement graphic only':'Complete (graphic + hardware)'));
    cart.push({id:p.id,name:p.name,url:p.url,img:p.thumb,size:s.label,opts,notes:nt.value.trim(),qty:q,total:Math.round(r.total*100)/100});
    saveCart(); location.href='/cart/';
  });
  renderSizes(); renderQ();
}

/* ---------- cart page ---------- */
const cartEl=$('cartApp');
function renderCart(){
  if(!cart.length){ cartEl.innerHTML=`<div class="empty"><h1 style="font-size:2.4rem;font-weight:900">Your cart is empty</h1><p style="color:var(--muted)">Pick a product, choose a size and quantity, then check out.</p><a class="btn btn-green" href="/products/">Shop products</a></div>`; return; }
  const sub=cart.reduce((a,l)=>a+l.total,0), ship=sub>=75?0:9.95;
  cartEl.innerHTML=`<div class="page-head"><h1>Cart</h1></div><div class="cart"><div style="display:grid;gap:1rem">${cart.map((l,i)=>`<div class="line"><a class="art" href="${esc(l.url)}"><img src="${esc(l.img)}" alt="${esc(l.name)}" loading="lazy"></a><div style="min-width:0"><h3><a href="${esc(l.url)}" style="text-decoration:none">Custom ${esc(l.name.toLowerCase())}</a></h3><small>${esc(l.size)} · Qty ${l.qty.toLocaleString('en-US')}</small>${l.opts.length?`<ul class="optlist">${l.opts.map(o=>`<li>${esc(o)}</li>`).join('')}</ul>`:''}${l.notes?`<small>Notes: ${esc(l.notes)}</small>`:''}<button class="rm" data-rm="${i}">Remove</button></div><b class="mono">${money(l.total)}</b></div>`).join('')}
    <p class="notice">You'll upload artwork for each item at checkout. We send a free proof before anything prints.</p></div>
    <aside class="summary"><h2 style="font-size:1.3rem;font-weight:900">Order summary</h2><div class="r"><span>Subtotal</span><span>${money(sub)}</span></div><div class="r"><span>Shipping</span><span>${ship?money(ship):'Free'}</span></div><div class="r"><span>Proof</span><span>Free</span></div><div class="r t"><span>Total</span><span class="mono">${money(sub+ship)}</span></div><a class="btn btn-primary btn-block" href="/checkout/">Checkout</a></aside></div>`;
  cartEl.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{ cart.splice(+b.dataset.rm,1); saveCart(); renderCart(); }));
}
if(cartEl) renderCart();

/* ---------- checkout page ---------- */
const form=$('coForm');
if(form){
  if(!cart.length){ location.replace('/cart/'); return; }
  const co={method:'ship',speed:'std',disc:0,code:''};
  const totals=()=>{ const sub=cart.reduce((a,l)=>a+l.total,0); const d=Math.round(sub*co.disc*100)/100; const base=sub-d; const ship=co.method==='pickup'?0:(base>=75?0:9.95); const r=co.speed==='rush'?Math.round(base*0.25*100)/100:0; return {sub,d,ship,r,total:base+ship+r}; };
  const summary=()=>{ const t=totals(); return `<div class="co-lines">${cart.map(l=>`<div class="co-line"><div class="co-thumb"><img src="${esc(l.img)}" alt=""><span class="co-badge">${l.qty>999?Math.round(l.qty/1000)+'k':l.qty}</span></div><div style="min-width:0"><b>Custom ${esc(l.name.toLowerCase())}</b><small>${esc(l.size)}</small>${l.opts.map(o=>`<small>${esc(o)}</small>`).join('')}</div><span class="mono">${money(l.total)}</span></div>`).join('')}</div>
    <div class="co-disc"><label class="fl" for="dcode"><input id="dcode" placeholder=" " value="${esc(co.code)}" autocomplete="off"><span>Discount code</span></label><button type="button" class="co-apply" data-apply>Apply</button></div>
    ${co.code?`<p class="co-dmsg">${co.disc?'Code '+esc(co.code.toUpperCase())+' applied':'Enter a valid discount code'}</p>`:''}
    <div class="co-rows"><div><span>Subtotal · ${cart.length} item${cart.length>1?'s':''}</span><span class="mono">${money(t.sub)}</span></div>${t.d?`<div><span>Discount</span><span class="mono">−${money(t.d)}</span></div>`:''}<div><span>${co.method==='pickup'?'Pickup':'Shipping'}</span><span class="mono">${t.ship?money(t.ship):'FREE'}</span></div>${t.r?`<div><span>Rush production</span><span class="mono">${money(t.r)}</span></div>`:''}<div class="co-total"><span>Total</span><span><small>USD</small> <b class="mono">${money(t.total)}</b></span></div></div>`; };
  const refresh=()=>{ $('sumDesk').innerHTML=summary(); if(!$('sumMobile').hidden) $('sumMobile').innerHTML=summary(); $('sumbarTotal').textContent=money(totals().total); };
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-apply]'); if(!b) return; const v=(b.parentElement.querySelector('input').value||'').trim(); co.code=v; co.disc=DISCOUNT_CODES[v.toUpperCase()]||0; refresh(); });
  const sb=$('sumbar'), sm=$('sumMobile'); sb.onclick=()=>{ const o=sm.hidden; sm.hidden=!o; sb.setAttribute('aria-expanded',String(o)); $('sumchev').textContent=o?'▴':'▾'; if(o) sm.innerHTML=summary(); };
  /* artwork uploads, one per cart line (Netlify Forms fields artwork_1…artwork_8) */
  $('artList').innerHTML=cart.slice(0,8).map((l,i)=>`<label class="co-art" for="artwork_${i+1}"><span class="co-thumb"><img src="${esc(l.img)}" alt=""></span><span style="min-width:0"><b>${esc(l.name)}</b><small>${esc(l.size)} · Qty ${l.qty}</small><small class="fn" id="fn_${i+1}">No file chosen</small></span><span class="co-apply" style="padding:.55rem .9rem">Choose file</span></label>`).join('');
  for(let i=1;i<=8;i++){ const inp=$('artwork_'+i); if(!inp) continue; inp.addEventListener('change',()=>{ const f=inp.files[0]; const fn=$('fn_'+i); if(fn) fn.textContent=f?f.name:'No file chosen'; }); }
  document.querySelectorAll('label.co-art').forEach(l=>l.addEventListener('click',e=>{ e.preventDefault(); $(l.htmlFor).click(); }));
  const syncSel=name=>form.querySelectorAll(`input[name=${name}]`).forEach(x=>x.closest('.co-boxrow,.co-opt')?.classList.toggle('sel',x.checked));
  form.querySelectorAll('input[name=method]').forEach(r=>r.addEventListener('change',()=>{ co.method=r.value; syncSel('method'); $('shipFields').hidden=co.method!=='ship'; $('pickupBox').hidden=co.method!=='pickup'; refresh(); }));
  form.querySelectorAll('input[name=speed]').forEach(r=>r.addEventListener('change',()=>{ co.speed=r.value; syncSel('speed'); refresh(); }));
  form.querySelectorAll('input[name=payment]').forEach(r=>r.addEventListener('change',()=>{ syncSel('payment'); $('cardPanel').hidden=!$('pay-card').checked; }));
  form.querySelectorAll('input[name=billing]').forEach(r=>r.addEventListener('change',()=>{ syncSel('billing'); $('billFields').hidden=!$('bill-diff').checked; }));
  refresh();
  form.addEventListener('submit',async e=>{
    e.preventDefault(); let ok=true;
    form.querySelectorAll('input[required]').forEach(el=>{ if(el.closest('[hidden]')){ el.closest('.fl')?.classList.remove('bad'); return; } const bad=!el.value.trim()||(el.type==='email'&&!/^\S+@\S+\.\S+$/.test(el.value)); el.closest('.fl')?.classList.toggle('bad',bad); if(bad) ok=false; });
    $('coErr').hidden=ok; $('coErr').textContent='Enter the highlighted fields to continue.'; if(!ok){ form.querySelector('.fl.bad input')?.focus(); return; }
    const t=totals(); const no='PF-'+Date.now().toString(36).toUpperCase().slice(-6);
    form.elements.namedItem('order_number').value=no; form.elements.namedItem('order_total').value=money(t.total); form.elements.namedItem('discount_code').value=co.disc?co.code:'';
    form.elements.namedItem('order_items').value=cart.map((l,i)=>`${i+1}. ${l.name} — ${l.size} — Qty ${l.qty} — ${money(l.total)}\n   ${l.opts.join('\n   ')}${l.notes?'\n   Notes: '+l.notes:''}`).join('\n\n')+`\n\nSubtotal ${money(t.sub)} | Discount ${money(t.d)} | ${co.method==='pickup'?'Pickup':'Shipping'} ${money(t.ship)} | Rush ${money(t.r)} | TOTAL ${money(t.total)}`;
    const btn=form.querySelector('.co-pay'); btn.disabled=true; btn.textContent='Placing order…';
    try{
      const res=await fetch('/',{method:'POST',body:new FormData(form)});
      if(!res.ok) throw new Error(res.status);
      try{ sessionStorage.setItem('pf-last-order',JSON.stringify({no,email:form.elements.namedItem('email').value,total:t.total,rush:co.speed==='rush'})); }catch(err){}
      cart=[]; saveCart(); location.href='/order-confirmed/';
    }catch(err){
      btn.disabled=false; btn.textContent='Place order';
      $('coErr').hidden=false; $('coErr').textContent="We couldn't send your order. Check your connection and try again, or call us to order.";
    }
  });
}

/* ---------- confirmation ---------- */
const conf=$('confirmApp');
if(conf){ let o=null; try{ o=JSON.parse(sessionStorage.getItem('pf-last-order')||'null'); }catch(e){}
  if(o){ $('confNo').textContent=`Order ${o.no} · ${money(o.total)}`; $('confMsg').textContent=`We'll email a proof to ${o.email} within one business day. Production starts after you approve it${o.rush?', and rush orders ship the next business day after approval':''}.`; } }
})();
