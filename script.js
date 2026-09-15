const cars=[
 {make:'Toyota',model:'Land Cruiser 300',year:2024,body:'SUV',price:72000000,img:'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85',tag:'FEATURED'},
 {make:'Mercedes',model:'AMG GLE 53',year:2023,body:'SUV',price:68000000,img:'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85',tag:'CERTIFIED'},
 {make:'BMW',model:'M4 Competition',year:2024,body:'Coupe',price:59000000,img:'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85',tag:'NEW ARRIVAL'},
 {make:'Lexus',model:'RX 350h',year:2023,body:'SUV',price:49000000,img:'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1200&q=85',tag:'HYBRID'},
 {make:'Toyota',model:'Camry XSE',year:2022,body:'Saloon',price:32000000,img:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=85',tag:'POPULAR'},
 {make:'Mercedes',model:'C300 AMG Line',year:2022,body:'Saloon',price:45000000,img:'https://images.unsplash.com/photo-1598843477410-7e3a8b8b8f5f?auto=format&fit=crop&w=1200&q=85',tag:'CERTIFIED'}
];
const money=n=>'₦'+n.toLocaleString('en-NG');
const grid=document.getElementById('inventoryGrid'), empty=document.getElementById('empty');
function render(list=cars){grid.innerHTML=list.map((c,i)=>`<article class="car"><div class="car-img" style="background-image:url('${c.img}')"><span class="tag">${c.tag}</span></div><div class="car-body"><h3>${c.make} ${c.model}</h3><p>${c.year} • ${c.body} • Automatic</p><div class="car-meta"><strong>${money(c.price)}</strong><span>View details →</span></div></div></article>`).join('');empty.style.display=list.length?'none':'block'}
function filter(){const m=document.getElementById('make').value,b=document.getElementById('body').value,p=+document.getElementById('price').value;render(cars.filter(c=>(m==='all'||c.make===m)&&(b==='all'||c.body===b)&&c.price<=p));document.getElementById('inventory').scrollIntoView({behavior:'smooth'})}
document.getElementById('searchBtn').onclick=filter;
document.getElementById('clearFilters').onclick=e=>{e.preventDefault();document.getElementById('make').value='all';document.getElementById('body').value='all';document.getElementById('price').value='999999';render();document.getElementById('inventory').scrollIntoView({behavior:'smooth'})};
render();
const carPrice=document.getElementById('carPrice'),deposit=document.getElementById('deposit'),term=document.getElementById('term');
function calc(){let p=+carPrice.value,d=Math.min(+deposit.value,p-500000),months=+term.value;document.getElementById('priceOut').textContent=money(p);document.getElementById('depositOut').textContent=money(d);document.getElementById('termOut').textContent=months+' months';const principal=p-d,rate=.015,monthly=principal*(rate*Math.pow(1+rate,months))/(Math.pow(1+rate,months)-1);document.getElementById('monthly').textContent=money(Math.round(monthly))} [carPrice,deposit,term].forEach(x=>x.addEventListener('input',calc));calc();
const vehicle=document.getElementById('vehicle');cars.forEach(c=>{const o=document.createElement('option');o.value=`${c.make} ${c.model}`;o.textContent=`${c.make} ${c.model} — ${money(c.price)}`;vehicle.appendChild(o)});
document.getElementById('testForm').addEventListener('submit',e=>{e.preventDefault();document.getElementById('formMessage').textContent=`Thanks ${document.getElementById('name').value.split(' ')[0]} — your test-drive request has been received. We'll contact you on ${document.getElementById('phone').value} to confirm.`;e.target.reset()});
document.getElementById('menuBtn').onclick=()=>document.getElementById('navLinks').classList.toggle('open');document.querySelectorAll('.nav-links a').forEach(a=>a.onclick=()=>document.getElementById('navLinks').classList.remove('open'));
