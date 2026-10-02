/* ===== CONFIG : à modifier ===== */
const CONFIG={
  brand:"TOPS NUTRITION",                 // [PLACEHOLDER] nom de la boutique
  whatsapp:"212600000000",        // [PLACEHOLDER] numéro international sans + ni espaces
  city:"Maroc",              // [PLACEHOLDER] ville de livraison
  address:"[Adresse à compléter]",
  email:"contact@exemple.ma",
  delivery:20,                    // frais de livraison en DH (0 = gratuit)
  formEndpoint:"https://formspree.io/f/xvkgjeyq"                 // ex: "https://formspree.io/f/xxxx" ou Web3Forms
};
/* Les produits sont dans js/products.js (géré par manage_products.py) */
const CATS=["Protéines","Créatine","Gainers","Vitamines","Oméga-3","Pré-workout","Autres"];
const $=(s,r=document)=>r.querySelector(s),get=k=>new URLSearchParams(location.search).get(k);
const find=id=>PRODUCTS.find(p=>p.id===id);
const wa=(p,q=1,txt)=>`https://wa.me/${CONFIG.whatsapp}?text=`+encodeURIComponent(txt||`Bonjour, je souhaite commander :\nProduit : ${p.name}\nQuantité : ${q}\nPrix : ${p.price} DH`);
const waGen=`https://wa.me/${CONFIG.whatsapp}?text=`+encodeURIComponent("Bonjour, j'ai une question sur vos produits.");
const visual=p=>`<div class="ph">${p.image?`<img src="${p.image}" alt="${p.name}" loading="lazy">`:`<div class="tub">${p.cat}<br>${p.size}</div>`}</div>`;
const cardHTML=p=>`<article class="card">${visual(p)}<div class="b"><span class="cat">${p.cat}${p.stock?"":" · Bientôt de retour"}</span><h3>${p.name}</h3><p class="mute">${p.short}</p><span class="price">${p.price} DH</span><a class="btn" href="produit.html?id=${p.id}">Voir le produit</a><a class="btn wa" href="${wa(p)}" target="_blank" rel="noopener">WhatsApp</a></div></article>`;

/* En-tête, pied de page, bouton WhatsApp flottant (partagés par toutes les pages) */
document.body.insertAdjacentHTML("afterbegin",`<header><div class="wrap"><a class="logo" href="index.html">${CONFIG.brand}<b>.</b></a><nav><a href="catalogue.html">Produits</a><a href="faq.html">FAQ</a><a href="a-propos.html">À propos</a><a href="contact.html">Contact</a></nav></div></header>`);
document.body.insertAdjacentHTML("beforeend",`<footer><div class="wrap"><div><b>${CONFIG.brand}</b><br>Nutrition sportive · Livraison à ${CONFIG.city}<br>Paiement à la livraison</div><div><a href="catalogue.html">Catalogue</a><a href="faq.html">FAQ</a><a href="contact.html">Contact</a></div><div><a href="faq.html#livraison">Livraison</a><a href="faq.html#cgv">Conditions de vente</a><a href="faq.html#confidentialite">Confidentialité</a></div></div></footer><a class="fab" href="${waGen}" target="_blank" rel="noopener" aria-label="WhatsApp">WhatsApp</a>`);
document.querySelectorAll("[data-city]").forEach(e=>e.textContent=CONFIG.city);
document.querySelectorAll("[data-brand]").forEach(e=>e.textContent=CONFIG.brand);
document.querySelectorAll("[data-wa]").forEach(e=>e.href=waGen);

/* Accueil */
if($("#popular"))$("#popular").innerHTML=PRODUCTS.slice(0,4).map(cardHTML).join("");

/* Catalogue : filtres + recherche */
if($("#catalog")){let cat="Tous",q="";
 $("#filters").innerHTML=["Tous",...CATS].map(c=>`<button class="chip${c==="Tous"?" on":""}">${c}</button>`).join("");
 const draw=()=>{const l=PRODUCTS.filter(p=>(cat==="Tous"||p.cat===cat)&&(p.name+p.cat).toLowerCase().includes(q));$("#catalog").innerHTML=l.length?l.map(cardHTML).join(""):"<p class='mute'>Aucun produit trouvé. Essayez un autre mot.</p>"};
 $("#filters").onclick=e=>{if(e.target.matches(".chip")){cat=e.target.textContent;document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===e.target));draw()}};
 $("#search").oninput=e=>{q=e.target.value.toLowerCase();draw()};draw()}

/* Page produit */
if($("#product")){const p=find(get("id"))||PRODUCTS[0];let n=1;document.title=p.name+" – "+CONFIG.brand;
 const render=()=>{$("#product").innerHTML=`<div class="two">${visual(p)}<div><span class="cat">${p.cat}</span><h1 style="font-size:2.6rem">${p.name}</h1><p class="price" style="font-size:2.2rem">${p.price} DH</p><p style="margin:12px 0">${p.desc}</p><ul style="padding-left:18px;margin-bottom:12px">${p.benefits.map(b=>`<li>${b}</li>`).join("")}</ul><p class="mute">Format : ${p.size} · ${p.stock?"✓ En stock":"Indisponible pour le moment"}</p><p class="mute" style="font-size:.85rem">Ce complément alimentaire ne remplace pas une alimentation variée et équilibrée. Respectez la dose conseillée.</p><div style="margin:16px 0"><div class="qty"><button id="m" aria-label="Moins">−</button><span>${n}</span><button id="pl" aria-label="Plus">+</button></div></div><div class="row"><a class="btn" id="ord" href="commande.html?id=${p.id}&qty=${n}">Commander</a><a class="btn wa" target="_blank" rel="noopener" href="${wa(p,n)}">Commander sur WhatsApp</a></div></div></div>`;
  $("#m").onclick=()=>{n=Math.max(1,n-1);render()};$("#pl").onclick=()=>{n=Math.min(10,n+1);render()}};render();
 $("#similar").innerHTML=PRODUCTS.filter(x=>x.id!==p.id).slice(0,4).map(cardHTML).join("")}

/* Page de commande */
if($("#orderForm")){const sel=$("#psel"),qty=$("#qty"),p0=find(get("id"));
 sel.innerHTML=PRODUCTS.filter(p=>p.stock).map(p=>`<option value="${p.id}">${p.name} – ${p.price} DH</option>`).join("");
 if(p0&&p0.stock)sel.value=p0.id;qty.value=Math.min(10,Math.max(1,+get("qty")||1));
 const upd=()=>{const p=find(sel.value),q=+qty.value||1,sub=p.price*q,tot=sub+CONFIG.delivery;
  $("#recap").innerHTML=`<p><span>${p.name} × ${q}</span><span>${sub} DH</span></p><p><span>Livraison</span><span>${CONFIG.delivery?CONFIG.delivery+" DH":"Gratuite"}</span></p><p class="tot"><span>Total à payer</span><span>${tot} DH</span></p>`;return tot};
 sel.onchange=qty.oninput=upd;upd();
 $("#orderForm").onsubmit=async e=>{e.preventDefault();const f=e.target,btn=$("button",f),tot=upd();btn.disabled=true;btn.textContent="Envoi…";
  const d=Object.fromEntries(new FormData(f));d.produit=find(d.produit).name;d.total=tot+" DH";
  try{if(CONFIG.formEndpoint)await fetch(CONFIG.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(d)});
   else console.warn("formEndpoint vide : commande non envoyée (mode test)",d);
   location.href="merci.html"}catch(err){btn.disabled=false;btn.textContent="Confirmer ma commande";alert("L'envoi a échoué. Réessayez ou commandez sur WhatsApp.")}}}
