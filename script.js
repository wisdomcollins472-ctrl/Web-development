const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const navWrap=$('.nav-wrap'),menuBtn=$('#menuBtn'),navLinks=$('#navLinks');
window.addEventListener('scroll',()=>navWrap.classList.toggle('scrolled',scrollY>30),{passive:true});
menuBtn.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuBtn.setAttribute('aria-expanded',open)});
$$('.nav-links a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));

const modal=$('#enquiryModal'), form=$('#enquiryForm'), destination=$('#formDestination'), status=$('#formStatus');
function openEnquiry(prefill=''){modal.classList.add('open');modal.setAttribute('aria-hidden','false');if(prefill)destination.value=prefill;setTimeout(()=>form.querySelector('input')?.focus(),250)}
function closeEnquiry(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
$$('.js-plan').forEach(btn=>btn.addEventListener('click',()=>openEnquiry(btn.dataset.prefill||'')));
$('#closeModal').addEventListener('click',closeEnquiry);modal.addEventListener('click',e=>{if(e.target===modal)closeEnquiry()});

enquiryForm.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);localStorage.setItem('aureliaEnquiry',JSON.stringify(Object.fromEntries(data)));status.textContent='Thank you. Your travel request has been saved. We will contact you with the next steps.';status.style.color='#75613d';setTimeout(()=>{closeEnquiry();status.textContent=''},1800)});

const concierge=$('#concierge'),trigger=$('#conciergeTrigger'),closeConcierge=$('#closeConcierge'),chat=$('#chat'),quick=$('#quickReplies'),chatForm=$('#chatForm'),chatInput=$('#chatInput'),toast=$('#conciergeToast'),wave=$('#wave');
let state=JSON.parse(localStorage.getItem('aureliaChat')||'null')||{step:0,answers:{},messages:[]};
const steps=[
 {q:'Where are you dreaming of going?',opts:['Maldives','Switzerland','Dubai','Santorini','South Africa','Bali']},
 {q:'Wonderful choice. ✨ What kind of journey are you imagining?',opts:['Romantic','Family','Relaxation','Adventure']},
 {q:'When are you thinking of travelling?',opts:['Next 3 months','3–6 months','6–12 months','Not sure yet']},
 {q:'How many people will be travelling?',opts:['1','2','3–4','5+']},
 {q:'What level of experience are you looking for?',opts:['Boutique & beautiful','Luxury','Ultra-luxury & private']},
 {q:'What is your approximate travel budget?',opts:['Under $3,000','$3,000–$7,000','$7,000–$12,000','$12,000+']}
];
function addMsg(text,user=false){const d=document.createElement('div');d.className=user?'user-message':'bot-message';d.innerHTML=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;state.messages.push({text,user});localStorage.setItem('aureliaChat',JSON.stringify(state))}
function renderSaved(){state.messages.slice(-30).forEach(m=>{const d=document.createElement('div');d.className=m.user?'user-message':'bot-message';d.innerHTML=m.text;chat.appendChild(d)})}
function renderOptions(){quick.innerHTML='';if(state.step>=steps.length){quick.innerHTML='<button class="quick-reply" data-action="enquiry">Share my details →</button><button class="quick-reply" data-action="restart">Start again</button>';return}steps[state.step].opts.forEach(o=>{const b=document.createElement('button');b.className='quick-reply';b.textContent=o;b.dataset.option=o;quick.appendChild(b)})}
function botQuestion(){setTimeout(()=>{addMsg(steps[state.step].q);renderOptions()},350)}
function choose(value){addMsg(value,true);state.answers[steps[state.step].q]=value;state.step++;localStorage.setItem('aureliaChat',JSON.stringify(state));if(state.step<steps.length)botQuestion();else setTimeout(()=>{addMsg('Perfect. I have a clearer picture now. 🌍<br><br>Let’s turn it into a real itinerary. Where can our travel team reach you?');renderOptions()},350)}
quick.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action==='enquiry'){openEnquiry(state.answers[steps[0].q]||'');return}if(b.dataset.action==='restart'){state={step:0,answers:{},messages:[]};localStorage.setItem('aureliaChat',JSON.stringify(state));chat.innerHTML='<div class="bot-message">Fresh start. 👋 Where would you love to go?</div>';renderOptions();return}if(b.dataset.option)choose(b.dataset.option)});
function openChat(){concierge.classList.add('open');concierge.setAttribute('aria-hidden','false');trigger.style.display='none';toast.classList.remove('show');if(!chat.dataset.loaded){chat.dataset.loaded='1';if(state.messages.length)renderSaved();renderOptions()};chatInput.focus()}
function closeChat(){concierge.classList.remove('open');concierge.setAttribute('aria-hidden','true');trigger.style.display='grid'}
trigger.addEventListener('click',openChat);closeConcierge.addEventListener('click',closeChat);
chatForm.addEventListener('submit',e=>{e.preventDefault();const v=chatInput.value.trim();if(!v)return;addMsg(v,true);chatInput.value='';setTimeout(()=>{addMsg('Thanks — I’ve noted that. Use the quick options above to continue, or I can open the enquiry form when you’re ready.');},300)});
function waveNow(){if(concierge.classList.contains('open'))return;wave.classList.remove('waving');void wave.offsetWidth;wave.classList.add('waving');setTimeout(()=>toast.classList.add('show'),250);setTimeout(()=>toast.classList.remove('show'),4500)}
setTimeout(waveNow,3000);setInterval(waveNow,20000);
$$('.destination,.experience,.journey-card,.journal article,.standard,.stats div,.testimonial').forEach(el=>el.classList.add('reveal'));
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});$$('.reveal').forEach(el=>io.observe(el));
$$('.destination').forEach(card=>card.addEventListener('click',()=>openEnquiry(card.dataset.destination)));
$$('.experience').forEach(card=>card.addEventListener('click',()=>openEnquiry(card.dataset.destination)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeEnquiry();closeChat()}});
