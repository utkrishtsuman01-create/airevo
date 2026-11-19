(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const app=$('#app'), page=document.body.dataset.page||'home', db=()=>window.airevoSupabase;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN'), phone='+91 98361 47993', email='info@airevo.com';
const S={categories:[],products:[],collections:[],blogs:[],cart:(()=>{try{const value=JSON.parse(localStorage.getItem('airevo-cart-v2')||'[]');return Array.isArray(value)?value:[]}catch(e){console.warn('Airevo cart storage could not be read',e);return[]}})(),dataLoaded:false,dataLoading:null};
const IMG={
 chimney:'https://faberindia.com/cdn/shop/products/P5A7112_compact.jpg?v=1680244428',
 microwave:'https://nandilathgmart.com/wp-content/uploads/2022/02/25sc4_25l_convection_microwave_rv_5-c1b.png',
 hob:'https://mahajanelectronics.com/cdn/shop/files/1800x1800_built_in_hob_78-gci3b-3d-ffd_top.webp?v=1766804254&width=1800',
 oven:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
 dishwasher:'https://cdn.rona.ca/images/30855105_L.jpg',
 air:'https://cosori.co.uk/cdn/shop/files/cp158black.jpg?v=1738999039&width=800'
};
const HERO={
 chimney:'https://www.electrolux.co.id/globalassets/appliances/cooker-hoods/ecc9312k/id-ecc9312k-feat-1500x1500.jpg?width=1920',
 microwave:'https://static.wixstatic.com/media/74b241_a88927c445a64c869d34085357b68f51~mv2.png/v1/fit/w_1200%2Ch_1200%2Cq_90/file.png',
 hob:'https://7fd2cf869625f0b37b1c-c07cbfcd218cb3fec64e336386273571.ssl.cf3.rackcdn.com/images/product-images/444411637_BEL%20GTG603-Xtxfa18v_1500_1500.jpg',
 oven:'https://www.kitchenbrandstore.com/cdn/shop/files/1_713d3724-c8fe-442c-8181-043854e596f9.jpg?v=1754123572',
 dishwasher:'https://image.coolblue.nl/max/1400xauto/products/1824738',
 air:'https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTAxL3Jhd3BpeGVsb2ZmaWNlNl9waG90b19vZl9hX2JsYWNrX21pbmltYWxfYWlyX2ZyeWVyX2Nvb2t3YXJlX29mZl9iMWMxOWY0My02YmNkLTQ2ZTgtYTllNC1jNjA2YmRiYTQ2OTBfMS5qcGc.jpg'
};
const slides=[
 ['A fresher way to cook','Make air the quietest luxury.','A beautiful kitchen starts with a space that feels as good as it looks. Discover chimney designs made for modern cooking.',HERO.chimney,'Modern premium kitchen interior','Explore Chimneys','/catalogue.html?category=chimneys','Book a Consultation','/contact.html?intent=chimney-consultation'],
 ['Everyday, made easier','Good things happen in minutes.','From compact solo models to grill, convection and built-in formats, find the microwave that fits your cooking routine.',HERO.microwave,'Modern kitchen appliance setting','Shop Microwaves','/catalogue.html?category=microwave-ovens','Compare Capacities','/category.html?slug=microwave-ovens'],
 ['Designed around the flame','Bring precision to every flame.','Explore gas hobs, glass cooktops and induction surfaces that bring a refined finish to your kitchen.',HERO.hob,'Contemporary kitchen with premium cooktop','Explore Hobs','/catalogue.html?category=hobs-cooktops','Choose Your Cooktop','/contact.html?intent=cooktop-advice'],
 ['A little more room to create','More room for your best recipes.','Built-in oven concepts for baking, roasting and the little experiments that become family favourites.',HERO.oven,'Bright modern kitchen interior','Discover Ovens','/catalogue.html?category=built-in-ovens','Plan My Kitchen','/contact.html?intent=oven-consultation'],
 ['Let the kitchen reset itself','Give clean-up a smarter ending.','Explore dishwasher formats designed to bring a little more time back to your day.',HERO.dishwasher,'Modern kitchen with integrated appliances','Explore Dishwashers','/catalogue.html?category=dishwashers','Ask About Installation','/contact.html?intent=dishwasher-installation'],
 ['Small details. Big difference.','Everyday cooking, reimagined.','Discover countertop companions such as digital air fryers and small appliances built around the way you live.',HERO.air,'Elegant contemporary kitchen interior','Shop Small Appliances','/catalogue.html?category=small-appliances','Explore All Collections','/collection.html']
];
function toast(t){let e=$('#site-toast');if(!e){e=document.createElement('div');e.id='site-toast';e.className='toast';document.body.appendChild(e)}e.textContent=t;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),2600)}
async function load(){
 if(!db()&&window.airevoSupabaseReady)await window.airevoSupabaseReady;
 const s=db();if(!s)return;
 if(S.dataLoaded)return true;
 if(!S.dataLoading){
  S.dataLoading=Promise.all([
   s.from('categories').select('*').eq('is_active',true).order('sort_order'),
   s.from('products').select('*,categories(name,slug),product_variants(*)').eq('is_active',true).order('created_at',{ascending:false}),
   s.from('blog_posts').select('*').eq('status','published').order('published_at',{ascending:false}).limit(6),
   s.from('collections').select('*,collection_products(collection_id,product_id,sort_order)').eq('is_active',true).order('sort_order')
  ]).then(([c,p,b,co])=>{
   if(!c.error)S.categories=c.data||[];
   if(!p.error)S.products=p.data||[];
   if(!b.error)S.blogs=b.data||[];
   if(!co.error)S.collections=co.data||[];
   applyDemoWorkspaceToStorefront();
   S.dataLoaded=true;
   return true;
  }).catch(error=>{
   S.dataLoading=null;
   throw error;
  });
 }
 return S.dataLoading;
}
const catSlug=p=>p.categories&&p.categories.slug||'';
const image=p=>(p.image_urls&&p.image_urls[0])||IMG.microwave;
const gallery=p=>(p.image_urls||[]).slice(0,5);
function qty(){return S.cart.reduce((n,x)=>n+x.qty,0)}
function total(){return S.cart.reduce((n,x)=>n+x.price*x.qty,0)}
function saveCart(){localStorage.setItem('airevo-cart-v2',JSON.stringify(S.cart))}
function applyDemoWorkspaceToStorefront(){
 let demo;try{demo=JSON.parse(localStorage.getItem('airevo_demo_admin_workspace_v1')||'null')}catch(_){demo=null}
 if(!demo)return;
 const slugify=v=>String(v||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const categoryMap=new Map((demo.categories||[]).map(x=>[x.id,x]));
 (demo.categories||[]).forEach(c=>{if(!S.categories.some(x=>x.name===c.name))S.categories.push({id:c.id,name:c.name,slug:slugify(c.name),description:c.description||'',is_active:true})});
 const trending=demo.collections?.find(x=>x.kind==='trending'||x.slug==='trending'),popular=demo.collections?.find(x=>x.kind==='popular'||x.slug==='popular');
 const trendingIds=trending?.productIds||[],popularIds=popular?.productIds||[],demoProductIdMap=new Map();
 (demo.products||[]).forEach(p=>{
  const cat=categoryMap.get(p.categoryId),safeVariants=(p.variants||[]).map(v=>({id:v.id,name:v.name,sku:v.sku,mrp:v.price,sale_price:v.price,stock_qty:v.stock,is_active:true}));
  const item={id:p.id,slug:slugify(p.name),name:p.name,sku:p.sku,brand:'Airevo',mrp:Number(p.mrp||0),sale_price:Number(p.price||0),stock_qty:Number(p.stock||0),short_description:p.description||'',description:p.description||'',image_urls:(p.imageUrls||[]).slice(0,5),video_url:p.videoUrl||'',specifications:{video_url:p.videoUrl||''},product_variants:safeVariants,categories:cat?{name:cat.name,slug:slugify(cat.name)}:null,is_active:p.active!==false,is_trending:trendingIds.includes(p.id),is_popular:popularIds.includes(p.id),is_featured:false};
  const index=S.products.findIndex(x=>(p.sku&&x.sku===p.sku)||x.name===p.name);
  if(index>=0){if(p.active===false)S.products.splice(index,1);else{const existingId=S.products[index].id;S.products[index]={...S.products[index],...item,id:existingId,category_id:S.products[index].category_id||p.categoryId};demoProductIdMap.set(p.id,existingId)}}
  else if(p.active!==false){S.products.push(item);demoProductIdMap.set(p.id,p.id)}
 });
 (demo.collections||[]).forEach(co=>{
  const item={id:co.id,name:co.name,slug:co.slug||slugify(co.name),description:co.description||'',image_url:null,is_active:co.active!==false,sort_order:0,collection_products:(co.productIds||[]).map((product_id,i)=>({collection_id:co.id,product_id:demoProductIdMap.get(product_id)||product_id,sort_order:i}))};
  const ix=S.collections.findIndex(x=>x.slug===item.slug);
  if(ix>=0)S.collections[ix]=item;else S.collections.push(item);
 });
 (demo.blogs||[]).filter(b=>b.status==='Published').forEach(b=>{
  const item={id:b.id,title:b.title,slug:b.slug,excerpt:b.excerpt||'',content:b.body||'',cover_image_url:(b.images||[])[0]||null,image_urls:(b.images||[]).slice(0,5),status:'published',published_at:new Date().toISOString()};
  const ix=S.blogs.findIndex(x=>x.slug===item.slug);if(ix>=0)S.blogs[ix]=item;else S.blogs.unshift(item);
 });
}
function header(){
 const cats=S.categories.length?S.categories.map(c=>'<a href="/category.html?slug='+encodeURIComponent(c.slug)+'">'+esc(c.name)+'</a>').join(''):['Kitchen Chimneys','Microwave Ovens','Hobs & Cooktops','Built-in Ovens','Dishwashers','Air Fryers & Small Appliances'].map((n,i)=>'<a href="/category.html">'+n+'</a>').join('');
 return '<div class="topline"><div class="container topline-inner"><div class="contact-mini"><a href="tel:+919836147993"><span aria-hidden="true">☎</span> '+phone+'</a><a href="mailto:'+email+'"><span aria-hidden="true">✉</span> '+email+'</a></div><div class="topline-right"><div class="topline-socials"><a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.7" r="1.1" fill="currentColor"/></svg></a><a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.6V13h2.7v8z"/></svg></a></div><div class="topline-note">Thoughtfully selected. Beautifully made.</div></div></div></div>'+
 '<header class="site-header"><div class="container nav-wrap"><a class="brand" href="/" aria-label="Airevo home"><img class="brand-logo" src="/airevo-shield.png" alt="Airevo logo"><span class="brand-copy"><span class="brand-name"><span class="brand-a">A</span>ir<span class="brand-e">e</span>vo</span><span class="brand-tag">PREMIUM KITCHEN LIVING</span></span></a>'+
 '<button class="menu-toggle" id="menu-toggle" aria-label="Toggle navigation">☰</button><nav class="nav-main" id="main-nav">'+
 '<div class="nav-item"><a class="nav-link" href="/">Home</a></div>'+
 '<div class="nav-item"><a class="nav-link" href="/category.html">Categories <span class="chevron">⌄</span></a><div class="mega-menu"><div class="mega-title">Explore appliances</div>'+cats+'<a href="/category.html">All categories ↗</a></div></div>'+
 '<div class="nav-item"><a class="nav-link" href="/collection.html">Collection <span class="chevron">⌄</span></a><div class="mega-menu"><div class="mega-title">Curated for your kitchen</div><a href="/collection.html?type=trending">Trending now</a><a href="/collection.html?type=popular">Popular choices</a><a href="/collection.html?type=new">New arrivals</a><a href="/catalogue.html">All products ↗</a></div></div>'+
 '<div class="nav-item"><a class="nav-link" href="/approach.html">Our Approach <span class="chevron">⌄</span></a><div class="mega-menu"><div class="mega-title">Discover Airevo</div><a href="/approach.html#why-airevo">Why choose Airevo</a><a href="/approach.html#how-we-help">How we help</a><a href="/blog.html">Ideas & buying guides</a><a href="/contact.html?intent=consultation">Book a consultation ↗</a></div></div>'+
 '<div class="nav-item"><a class="nav-link" href="/reviews.html">Reviews</a></div><div class="nav-item"><button class="nav-link contact-trigger" id="contact-open" type="button">Contact us</button></div></nav>'+
 '<div class="nav-actions"><div class="nav-socials"><a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.7" r="1.1" fill="currentColor"/></svg></a><a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.6V13h2.7v8z"/></svg></a></div><a class="login-link" href="/login.html">Sign in</a><button class="nav-cta" id="cart-open">Cart <span id="cart-count">'+qty()+'</span></button></div></div></header>';
}
function footer(){
 return '<footer class="footer"><div class="container"><div class="footer-grid">'+
 '<div class="footer-brand"><a class="brand" href="/"><img class="brand-logo" src="/airevo-shield.png" alt="Airevo logo"><span class="brand-copy"><span class="brand-name"><span class="brand-a">A</span>ir<span class="brand-e">e</span>vo</span><span class="brand-tag">PREMIUM KITCHEN LIVING</span></span></a><p>Thoughtfully selected kitchen appliances for modern homes. A more considered way to bring function, design and everyday comfort together.</p>'+
 '<div class="social-icons"><a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.7" r="1.1" fill="currentColor"/></svg></a><a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.6V13h2.7v8z"/></svg></a><a href="https://wa.me/919836147993" aria-label="WhatsApp" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.9 11.9 0 0 0 1.8 17.8L.2 23.7l6-1.6A11.9 11.9 0 0 0 20.5 3.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9 9 0 1 1 12 21Zm5-6.7c-.3-.2-1.7-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-.9-2c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.2-1.3 0-.1-.2-.2-.5-.4Z"/></svg></a></div></div>'+
 '<div><h4>Explore</h4><div class="footer-links"><a href="/category.html">All categories</a><a href="/catalogue.html">Shop appliances</a><a href="/collection.html">Collections</a><a href="/reviews.html">Customer reviews</a></div></div>'+
 '<div><h4>Discover</h4><div class="footer-links"><a href="/approach.html">Our approach</a><a href="/blog.html">Ideas & guides</a><a href="/contact.html">Book a consultation</a><a href="/login.html">Customer account</a></div></div>'+
 '<div><h4>Policies</h4><div class="footer-links"><a href="/privacy-policy.html">Privacy Policy</a><a href="/cookie-policy.html">Cookie Policy</a><a href="/shipping-returns.html">Shipping & Returns</a><a href="/terms-and-conditions.html">Terms & Conditions</a></div></div><div><h4>Talk to us</h4><div class="footer-links"><a href="tel:+919836147993">'+phone+'</a><a href="mailto:'+email+'">'+email+'</a><a href="/contact.html?intent=product-enquiry">Product enquiry</a><a href="/contact.html?intent=installation">Installation enquiry</a></div></div>'+
 '</div><div class="footer-bottom"><span>© '+new Date().getFullYear()+' Airevo. All rights reserved.</span><span>Demo storefront · Sample catalogue content and imagery</span></div></div></footer>';
}
function head(k,t,d){return '<div class="section-heading"><div><span class="eyebrow">'+esc(k)+'</span><h2>'+t+'</h2></div>'+(d?'<p>'+d+'</p>':'')+'</div>'}
function heroHead(k,t,d){return '<section class="page-hero"><div class="container"><div class="breadcrumb"><a href="/">Home</a> / '+esc(k)+'</div><span class="hero-kicker">'+esc(k)+'</span><h1>'+t+'</h1><p>'+d+'</p></div></section>'}
function cards(list){
 if(!list.length)return '<div class="empty-state"><h3>No products found yet</h3><p>Try a different category or contact our team.</p><a class="btn" href="/contact.html">Ask our team</a></div>';
 return '<div class="product-grid">'+list.map(p=>{
  const imgs=gallery(p),variants=p.product_variants||[],stock=variants.reduce((n,v)=>n+Number(v.stock_qty||0),Number(p.stock_qty||0));
  const options=variants.length?'<select class="variant-select" aria-label="Choose variant" data-variant-select="'+p.id+'">'+variants.map(v=>'<option value="'+v.id+'">'+esc(v.name)+' · '+money(v.sale_price)+'</option>').join('')+'</select>':'';
  return '<article class="product-card" data-product-card="'+p.id+'"><a class="product-photo" href="/product.html?slug='+encodeURIComponent(p.slug)+'"><img src="'+esc(image(p))+'" alt="'+esc(p.name)+'" loading="lazy"><span class="product-chip">'+(p.is_trending?'Trending':p.is_popular?'Popular':p.is_featured?'Featured':'Airevo selection')+'</span></a><div class="product-body"><div class="product-category">'+esc(p.categories?.name||'Kitchen appliances')+'</div><h3><a href="/product.html?slug='+encodeURIComponent(p.slug)+'">'+esc(p.name)+'</a></h3><p>'+esc(p.short_description||'')+'</p><div class="product-price" data-product-price>'+money(p.sale_price)+' <span class="price-muted"><s>'+money(p.mrp)+'</s></span></div>'+options+'<div class="product-actions"><button class="btn" data-add-product="'+p.id+'">Buy now</button><a class="btn-mini" href="/product.html?slug='+encodeURIComponent(p.slug)+'">Details ↗</a></div></div><div class="product-hover"><strong>'+esc(p.name)+'</strong><p>'+esc(p.description||'')+'</p><div class="mini-gallery">'+imgs.map(src=>'<img src="'+esc(src)+'" alt="'+esc(p.name)+' view" loading="lazy">').join('')+'</div><div class="spec-mini"><span>MRP '+money(p.mrp)+'</span><span>Now '+money(p.sale_price)+'</span><span>'+stock+' demo units</span><span>Net '+(p.weight_kg??'—')+' kg</span><span>Pack '+(p.package_weight_kg??'—')+' kg</span><span>'+(p.height_cm??'—')+' × '+(p.width_cm??'—')+' × '+(p.depth_cm??'—')+' cm</span></div><a class="textlink" href="/product.html?slug='+encodeURIComponent(p.slug)+'">View complete product details ↗</a></div></article>';
 }).join('')+'</div>';
}
function categoryCards(){
 return '<div class="category-grid">'+S.categories.map((c,i)=>'<a class="category-card" href="/category.html?slug='+encodeURIComponent(c.slug)+'"><img src="'+esc(c.image_url||IMG.chimney)+'" alt="'+esc(c.name)+'" loading="lazy"><span class="category-card-copy"><small>0'+(i+1)+' / Category</small><b>'+esc(c.name)+'</b><span>'+esc(c.description||'Explore the collection')+'</span></span></a>').join('')+'</div>';
}
function articleCards(items){
 if(!items.length)return '<div class="empty-state"><h3>New ideas are on the way</h3><p>Buying guides will appear here soon.</p></div>';
 return '<div class="article-grid">'+items.map(b=>'<a class="article-card" href="/blog-post.html?slug='+encodeURIComponent(b.slug)+'"><img src="'+esc(b.cover_image_url||IMG.oven)+'" alt="'+esc(b.title)+'" loading="lazy"><div><small>Airevo journal · Buying guide</small><h3>'+esc(b.title)+'</h3><p>'+esc(b.excerpt||'')+'</p><span class="textlink">Read article ↗</span></div></a>').join('')+'</div>';
}
async function home(){
 const trending=S.products.filter(p=>p.is_trending).slice(0,5);
 const popular=S.products.filter(p=>p.is_popular).slice(0,5);
 let approvedReviews=[];
 try{
  const sr=db();
  if(sr){
   const rr=await sr.from('reviews').select('*').eq('is_approved',true).order('created_at',{ascending:false}).limit(6);
   if(!rr.error)approvedReviews=rr.data||[];
  }
 }catch(e){console.warn('Home reviews unavailable',e)}
 const demoSamples=[
  ['Preview reviewer 01','The controls are simple and it fits neatly into our kitchen.'],
  ['Preview reviewer 02','A useful upgrade for everyday cooking. The finish looks great.'],
  ['Preview reviewer 03','The product information made it easier to compare options.'],
  ['Preview reviewer 04','Quick to understand and straightforward to use.'],
  ['Preview reviewer 05','A clean design that works well with our kitchen setup.'],
  ['Preview reviewer 06','The size is practical and the overall experience is good.'],
  ['Preview reviewer 07','Helpful guidance and a product that suits our daily routine.'],
  ['Preview reviewer 08','Thoughtful details and an easy customer experience.'],
  ['Preview reviewer 09','A nice addition to the kitchen and simple to maintain.'],
  ['Preview reviewer 10','Good everyday performance and a neat, modern look.']
 ].map((x,i)=>({id:'demo-review-'+i,customer_name:x[0],customer_place:'Demo location',body:x[1],rating:5,is_demo_preview:true}));
 let localReviews=[];try{localReviews=JSON.parse(localStorage.getItem('airevo_demo_customer_reviews_v1')||'[]')}catch(_){}
 const realFiveStar=approvedReviews.filter(r=>Number(r.rating)===5).map(r=>({...r,is_demo_preview:false}));
 const locallyApproved=localReviews.filter(r=>r.status==='Published'&&Number(r.rating)===5).map(r=>({id:r.id,customer_name:r.customer_name||r.customer,customer_place:r.customer_place||r.place,body:r.body||r.text,rating:r.rating,image_url:r.image_url||r.imageUrl,is_demo_preview:false}));
 const selected=[...realFiveStar,...locallyApproved],reviewItems=selected.slice(0,20);
 let sampleIndex=0;while(reviewItems.length<10){reviewItems.push(demoSamples[sampleIndex%demoSamples.length]);sampleIndex++}
 const reviewCard=r=>'<article class="testimonial review-brick">'+(r.image_url||r.imageUrl?'<a class="review-photo" href="'+esc(r.image_url||r.imageUrl)+'" target="_blank" rel="noopener"><img src="'+esc(r.image_url||r.imageUrl)+'" alt="Photo shared with customer review" loading="lazy"></a>':'')+'<div class="stars">★★★★★</div><blockquote>'+esc(r.body||'')+'</blockquote><small><strong>'+esc(r.customer_name||'Customer')+'</strong>'+(r.customer_place?' · '+esc(r.customer_place):'')+'</small><small class="review-note">'+(r.is_demo_preview?'DEMO PREVIEW · Sample review':(r.is_verified_purchase?'Verified purchase':'Customer review'))+'</small></article>';
 const row=(items,reverse)=>'<div class="review-marquee-row '+(reverse?'reverse':'')+'"><div class="review-marquee-track">'+items.concat(items).map(reviewCard).join('')+'</div></div>';
 const reviewMarkup='<div class="review-marquee">'+row(reviewItems.slice(0,5),false)+row(reviewItems.slice(5,10),true)+'</div><p class="demo-note">Demo review preview is clearly labelled. Only genuine customer reviews that pass moderation should be used after launch.</p>';
 return '<section class="hero" aria-label="Featured Airevo appliances">'+slides.map((s,i)=>'<article class="hero-slide '+(i===0?'active':'')+'" data-slide="'+i+'" aria-hidden="'+(i===0?'false':'true')+'"><div class="hero-copy"><span class="hero-kicker">'+esc(s[0])+'</span><h1>'+esc(s[1])+'</h1><p>'+esc(s[2])+'</p><div class="hero-buttons"><a class="btn" href="'+s[6]+'">'+esc(s[5])+' ↗</a><a class="btn outline" href="'+s[8]+'">'+esc(s[7])+'</a></div></div><div class="hero-photo"><img src="'+esc(s[3])+'" alt="'+esc(s[4])+'" '+(i===0?'fetchpriority="high"':'loading="lazy"')+' onerror="this.onerror=null;this.src=\'https://www.crompton.co.in/cdn/shop/files/Main_Category_Banner_Kitchen_1920x.jpg?v=1778241379\';this.classList.add(\'hero-image-fallback\')"></div><span class="hero-index">0'+(i+1)+' / 06</span></article>').join('')+'<div class="hero-controls"><div class="hero-dots">'+slides.map((s,i)=>'<button class="hero-dot '+(i===0?'active':'')+'" data-slide-dot="'+i+'" aria-label="Show slide '+(i+1)+'"></button>').join('')+'</div><button class="hero-arrow" data-slide-prev aria-label="Previous slide">‹</button><button class="hero-arrow" data-slide-next aria-label="Next slide">›</button></div><div class="hero-progress"><span id="hero-progress"></span></div></section>'+
 '<section class="section"><div class="container">'+head('Explore by appliance','A place for every kitchen essential.','Browse the appliance types your kitchen needs, with separate details and comparison options for every product.')+categoryCards()+'<div class="section-action"><a class="btn dark" href="/category.html">Explore all categories ↗</a></div></div></section>'+
 '<section class="section price-range-section"><div class="container">'+head('Shop by budget','Find a fit for your budget.','Explore useful price ranges across Airevo’s kitchen appliance categories.')+'<div class="price-rail"><a href="/catalogue.html?price=under-10000"><small>STARTING RANGE</small><b>Under ₹10,000</b><span>Everyday essentials ↗</span></a><a href="/catalogue.html?price=10000-25000"><small>MID RANGE</small><b>₹10,000 – ₹25,000</b><span>Smart kitchen upgrades ↗</span></a><a href="/catalogue.html?price=25000-50000"><small>PREMIUM RANGE</small><b>₹25,000 – ₹50,000</b><span>Built-in and premium picks ↗</span></a><a href="/catalogue.html?price=over-50000"><small>TOP RANGE</small><b>Above ₹50,000</b><span>Premium kitchen living ↗</span></a></div></div></section>'+
 '<section class="section soft"><div class="container">'+head('Trending now','Making their way into more kitchens.','A rotating edit of products marked as trending in the Airevo demo catalogue.')+cards(trending)+'<div class="section-action"><a class="btn" href="/collection.html?type=trending">Explore trending products ↗</a></div></div></section>'+
 '<section class="section"><div class="container">'+head('Popular choices','Popular picks for every kitchen.','Browse popular picks across every appliance category. These are demo merchandising tags, not verified sales data.')+cards(popular)+'<div class="section-action"><a class="btn dark" href="/collection.html?type=popular">See popular choices ↗</a></div></div></section>'+
 '<section class="section"><div class="container"><div class="feature-band"><div class="feature-band-copy"><span class="hero-kicker">The Airevo approach</span><h2>Thoughtful choices. Better everyday living.</h2><p>We help you understand the details that matter: appliance type, available space, model variations, installation and ongoing care.</p><div class="hero-buttons"><a class="btn" href="/approach.html">Our approach ↗</a><a class="btn outline" href="/contact.html?intent=consultation">Book a consultation</a></div></div><div class="feature-band-image"><img src="'+IMG.hob+'" alt="Black glass cooktop" loading="lazy"></div></div></div></section>'+
 '<section class="section soft"><div class="container">'+head('Customer stories','The experience matters as much as the appliance.','A dedicated place for customer feedback and verified product experiences.')+reviewMarkup+'<div class="section-action"><a class="btn dark" href="/reviews.html">Read customer reviews ↗</a></div></div></section>'+
 '<section class="section"><div class="container">'+head('Ideas & buying guides','A little knowledge goes a long way.','Helpful guides to make comparing appliances and planning your kitchen feel simpler.')+articleCards(S.blogs.slice(0,3))+'<div class="section-action"><a href="/blog.html" class="btn dark">Visit the Airevo journal ↗</a></div></div></section>'+
 '<section class="section-cta"><div class="container section-cta-inner"><div><h2>Not sure what fits your kitchen?</h2><p>Tell us about your space and we will help you explore the right options.</p></div><a class="btn white" href="/contact.html?intent=book-consultant">Book a consultation ↗</a></div></section>';
}
function catalogue(){
 const url=new URL(location.href),category=url.searchParams.get('category')||'',q=url.searchParams.get('q')||'',price=url.searchParams.get('price')||'',cat=S.categories.find(c=>c.slug===category);
 const priceMatch=p=>{const n=Number(p.sale_price||0);return !price||(price==='under-10000'&&n<10000)||(price==='10000-25000'&&n>=10000&&n<25000)||(price==='25000-50000'&&n>=25000&&n<=50000)||(price==='over-50000'&&n>50000)};
 const items=S.products.filter(p=>(!category||catSlug(p)===category)&&priceMatch(p)&&(p.name+' '+(p.short_description||'')+' '+(p.categories?.name||'')).toLowerCase().includes(q.toLowerCase()));
 return heroHead('Shop appliances',cat?esc(cat.name):'Explore the Airevo catalogue','Compare appliance types, sizes, variants, galleries, specifications and indicative pricing in one place.')+'<section class="section"><div class="container"><div class="catalog-toolbar"><input id="catalog-search" value="'+esc(q)+'" placeholder="Search appliances, sizes or models"><select id="catalog-sort"><option value="featured">Sort: Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name: A to Z</option></select><select id="catalog-category"><option value="">All categories</option>'+S.categories.map(c=>'<option value="'+esc(c.slug)+'" '+(category===c.slug?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select><select id="catalog-price"><option value="" '+(!price?'selected':'')+'>All price ranges</option><option value="under-10000" '+(price==='under-10000'?'selected':'')+'>Under ₹10,000</option><option value="10000-25000" '+(price==='10000-25000'?'selected':'')+'>₹10,000 – ₹25,000</option><option value="25000-50000" '+(price==='25000-50000'?'selected':'')+'>₹25,000 – ₹50,000</option><option value="over-50000" '+(price==='over-50000'?'selected':'')+'>Above ₹50,000</option></select></div><p class="demo-note">Demo catalogue: product names, photographs, prices, stock and dimensions are illustrative. Confirm actual models, warranties, availability and image rights before accepting real orders.</p><div id="catalog-products">'+cards(items)+'</div></div></section>';
}
function categoryPage(){
 const slug=new URL(location.href).searchParams.get('slug')||'',cat=S.categories.find(c=>c.slug===slug);
 return heroHead('Appliance categories',cat?esc(cat.name):'Explore by category','Select a product type to compare formats, models and options. Each category has a dedicated product page.')+'<section class="section"><div class="container">'+(cat?head('Explore category',esc(cat.name),esc(cat.description||''))+cards(S.products.filter(p=>catSlug(p)===slug)):head('All categories','Find the right place to start.','Choose a category to see the matching products and variants.')+categoryCards())+'</div></section>';
}
function collectionPage(){
 const url=new URL(location.href),type=url.searchParams.get('type')||'trending',slug=url.searchParams.get('slug')||'';
 if(slug){
  const collection=S.collections.find(x=>x.slug===slug);
  if(!collection)return heroHead('Airevo collection','Collection not found','This collection may have been moved or is no longer available.')+'<section class="section"><div class="container"><a class="btn" href="/collection.html">Browse collections</a></div></section>';
  const ordered=(collection.collection_products||[]).slice().sort((a,b)=>a.sort_order-b.sort_order);
  const productById=new Map(S.products.map(p=>[p.id,p]));
  const items=ordered.map(x=>productById.get(x.product_id)).filter(Boolean);
  return heroHead('Curated collection',esc(collection.name),esc(collection.description||'Explore the products in this Airevo collection.'))+
   '<section class="section"><div class="container">'+cards(items)+'<div class="section-action"><a class="btn dark" href="/collection.html">All collections ↗</a></div></div></section>';
 }
 const title=type==='popular'?'Popular choices':type==='new'?'New arrivals':'Trending now';
 const items=type==='popular'?S.products.filter(p=>p.is_popular):type==='new'?S.products.slice(0,6):S.products.filter(p=>p.is_trending);
 const curated=S.collections.length?'<section class="section soft"><div class="container">'+head('Shop by collection','Curated for your kitchen.','Explore product groups created by the Airevo team.')+'<div class="category-grid">'+S.collections.map((c,i)=>'<a class="category-card" href="/collection.html?slug='+encodeURIComponent(c.slug)+'"><img src="'+esc(c.image_url||IMG.hob)+'" alt="'+esc(c.name)+'" loading="lazy"><span class="category-card-copy"><small>0'+(i+1)+' / Collection</small><b>'+esc(c.name)+'</b><span>'+esc(c.description||'Explore this collection')+'</span></span></a>').join('')+'</div></div></section>':'';
 return heroHead('Curated collections',title,'A curated way to discover kitchen appliances by what is new, popular or trending.')+
  '<section class="section"><div class="container"><div class="collection-tabs"><a class="'+(type==='trending'?'active':'')+'" href="/collection.html?type=trending">Trending now</a><a class="'+(type==='popular'?'active':'')+'" href="/collection.html?type=popular">Popular choices</a><a class="'+(type==='new'?'active':'')+'" href="/collection.html?type=new">New arrivals</a></div>'+cards(items)+'<div class="section-action"><a href="/catalogue.html" class="btn dark">Browse all products ↗</a></div></div></section>'+curated;
}
function approachPage(){
 return heroHead('Our approach','The right appliance begins with the right questions.','A more considered way to explore kitchen appliances, compare what matters and plan for your space.')+'<section class="section" id="why-airevo"><div class="container content-grid"><div class="content-copy"><span class="eyebrow">Why Airevo</span><h2>Not just an appliance. A better everyday.</h2><p>Your kitchen is personal. The right appliance should suit your cooking habits, space, style and the people who use it every day.</p><p>We bring clarity to product format, capacity, finish, dimensions, installation and support so that your choice feels confident.</p><a class="btn" href="/contact.html?intent=consultation">Talk to our team ↗</a></div><div class="content-image"><img src="'+IMG.hob+'" alt="Modern kitchen hob" loading="lazy"></div></div></section><section class="section soft" id="how-we-help"><div class="container">'+head('How we help','A simple, useful process.','From first enquiry to the final choice, get clear guidance at each stage.')+[['01','Understand your kitchen','Share your layout, cooking needs and available space.'],['02','Compare the options','Explore appliance types, sizes, key features and finishes.'],['03','Check the details','Confirm measurements, installation, stock and warranty.'],['04','Choose with confidence','Get the product information you need before making a decision.']].map(x=>'<div class="process-row"><strong>'+x[0]+'</strong><div><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div></div>').join('')+'</div></section><section class="section"><div class="container">'+head('Airevo journal','Learn before you choose.','Explore practical buying guides and ideas.')+articleCards(S.blogs)+'<div class="section-action"><a class="btn dark" href="/blog.html">More buying guides ↗</a></div></div></section>';
}
async function reviewsPage(){
 let data=[];const s=db();
 if(s){const r=await s.from('reviews').select('*').eq('is_approved',true).order('created_at',{ascending:false});if(!r.error)data=r.data||[]}
 let local=[];try{local=JSON.parse(localStorage.getItem('airevo_demo_customer_reviews_v1')||'[]').filter(r=>r.status==='Published').map(r=>({id:r.id,customer_name:r.customer_name,customer_place:r.customer_place,rating:r.rating,title:'Customer review',body:r.body,image_url:r.image_url,is_verified_purchase:true,created_at:r.created_at}))}catch(_){}
 const reviews=[...local,...data.filter(x=>!local.some(y=>y.id===x.id))];
 return heroHead('Customer stories','Feedback from Airevo customers.','Customer feedback is shown after moderation. Demo preview content is labelled clearly.')+'<section class="section"><div class="container"><div class="review-list">'+(reviews.length?reviews.map(r=>'<article class="review-card">'+(r.image_url?'<img src="'+esc(r.image_url)+'" alt="Photo shared with review" style="width:100%;max-height:190px;object-fit:cover;border-radius:9px;margin-bottom:12px" loading="lazy">':'')+'<div class="stars">'+('★'.repeat(Number(r.rating||0)))+('☆'.repeat(5-Number(r.rating||0)))+'</div><h3>'+esc(r.title||'Customer feedback')+'</h3><p>'+esc(r.body)+'</p><footer>'+esc(r.customer_name)+(r.customer_place?' · '+esc(r.customer_place):'')+'<br>'+new Date(r.created_at).toLocaleDateString('en-IN')+'<span class="review-note">'+(r.is_verified_purchase?'Verified purchase':'Demo preview')+'</span></footer></article>').join(''):'<div class="empty-state"><h3>Customer reviews will appear here.</h3><p>After placing an order, customers can share their feedback from the order confirmation screen.</p></div>')+'</div><div class="form-panel review-submit"><h2>Placed an order?</h2><p>Customers can submit a star rating, optional name and place, a written description and one optional photo immediately after an order is placed. Reviews are sent for moderation before appearing publicly.</p><a class="btn" href="/account.html">View your orders ↗</a></div></div></section>';
}
function contactPage(){
 const intent=new URL(location.href).searchParams.get('intent')||'',subjects={'consultation':'Book a consultation','book-consultant':'Book a consultation','chimney-consultation':'Kitchen chimney consultation','cooktop-advice':'Hob and cooktop advice','oven-consultation':'Built-in oven consultation','dishwasher-installation':'Dishwasher installation','product-enquiry':'Product enquiry','installation':'Installation enquiry'},subject=subjects[intent]||'General enquiry';
 return heroHead('Contact Airevo','Let’s talk about your kitchen.','Share a little about what you are looking for. The Airevo team can help you explore product types, sizes and next steps.')+'<section class="section"><div class="container contact-layout"><aside class="contact-panel"><span class="hero-kicker">We are here to help</span><h2>Start with a conversation.</h2><p>Ask about chimneys, microwave formats, hobs, built-in ovens, dishwashers and small appliances.</p><p><strong>Phone</strong><br><a href="tel:+919836147993">'+phone+'</a></p><p><strong>Email</strong><br><a href="mailto:'+email+'">'+email+'</a></p></aside><div class="form-panel"><h2>Send an enquiry</h2><div id="contact-status" class="status-message"></div><form id="contact-form"><div class="form-grid"><div class="field"><label>Full name</label><input id="contact-name" required maxlength="120"></div><div class="field"><label>Email address</label><input id="contact-email" type="email" required></div><div class="field"><label>Phone number</label><input id="contact-phone" required></div><div class="field"><label>Enquiry type</label><select id="contact-subject"><option>'+esc(subject)+'</option><option>Book a consultation</option><option>Product enquiry</option><option>Installation enquiry</option><option>General enquiry</option></select></div><div class="field full"><label>How can we help?</label><textarea id="contact-message" required maxlength="4000" placeholder="Tell us what you are looking for..."></textarea></div></div><p class="form-help">Email notifications need a mail delivery provider before live launch.</p><button class="btn" type="submit">Send enquiry ↗</button></form></div></div></section>';
}
function demoBlogEntries(){
 let demo=[];try{const v=JSON.parse(localStorage.getItem('airevo_demo_admin_workspace_v1')||'{}');demo=(v.blogs||[]).filter(x=>x.status==='Published').map(x=>({...x,content:x.body||'',image_urls:x.images||[],cover_image_url:(x.images||[])[0]||null,status:'published'}))}catch(_){}
 const merged=[...S.blogs];demo.forEach(b=>{const i=merged.findIndex(x=>x.slug===b.slug);if(i>=0)merged[i]=b;else merged.push(b)});return merged;
}
function blogPage(){const posts=demoBlogEntries();return heroHead('Airevo journal','Ideas for a better kitchen.','Practical appliance guides and thoughtful ideas to help you plan your space and compare your options.')+'<section class="section"><div class="container">'+(posts.length?articleCards(posts):'<div class="empty-state">New ideas are coming soon.</div>')+'</div></section>'}
function blogPostPage(){
 const slug=new URL(location.href).searchParams.get('slug')||'',b=demoBlogEntries().find(x=>x.slug===slug);
 if(!b)return heroHead('Airevo journal','Article not found','Browse the latest kitchen appliance guides.')+'<section class="section"><div class="container"><a class="btn" href="/blog.html">Back to journal</a></div></section>';
 const gallery=(b.image_urls||b.images||[]).filter(Boolean).slice(0,5);
 const allImages=[b.cover_image_url,...gallery].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,5);
 return heroHead('Airevo journal',esc(b.title),esc(b.excerpt||''))+'<section class="section"><div class="container article-body">'+(allImages.length?'<div class="article-image-gallery">'+allImages.map((src,i)=>'<img src="'+esc(src)+'" alt="'+esc(b.title)+' image '+(i+1)+'" loading="lazy">').join('')+'</div>':'<img class="article-cover" src="'+esc(b.cover_image_url||IMG.oven)+'" alt="'+esc(b.title)+'">')+'<div class="article-text">'+esc(b.content).split('\n').map(x=>x?'<p>'+x+'</p>':'').join('')+'</div><p class="demo-note">Airevo article gallery · up to five images.</p><a class="btn dark" href="/blog.html">Back to all guides ↗</a></div></section>';
}
function productPage(){
 const slug=new URL(location.href).searchParams.get('slug')||'',p=S.products.find(x=>x.slug===slug);
 if(!p)return heroHead('Product details','Product not found','Browse the Airevo catalogue.')+'<section class="section"><div class="container"><a class="btn" href="/catalogue.html">Back to catalogue</a></div></section>';
 let demoProduct=null;try{const d=JSON.parse(localStorage.getItem('airevo_demo_admin_workspace_v1')||'{}');demoProduct=(d.products||[]).find(x=>x.name===p.name||x.sku===p.sku)||null}catch(_){} const variants=p.product_variants||[],v=variants[0]||null,imgs=(demoProduct?.imageUrls?.length?demoProduct.imageUrls:(v?.image_urls?.length?v.image_urls:gallery(p))).slice(0,5),videoUrl=demoProduct?.videoUrl||p.video_url||p.specifications?.video_url||'';
 const val=(key)=>v?.[key]??p[key]??'—';
 return heroHead(p.categories?.name||'Product details',esc(p.name),esc(p.short_description||''))+
 '<section class="section"><div class="container product-detail-page"><div class="product-gallery"><div class="main-product-image"><img id="product-main-image" src="'+esc(imgs[0]||image(p))+'" alt="'+esc(p.name)+'"></div><div class="product-thumbnails" id="product-thumbnails">'+imgs.map((src,i)=>'<button data-product-image="'+esc(src)+'" class="'+(i===0?'active':'')+'"><img src="'+esc(src)+'" alt="'+esc(p.name)+' view '+(i+1)+'"></button>').join('')+'</div></div>'+
 '<div class="product-information"><span class="eyebrow">'+esc(p.categories?.name||'Airevo collection')+'</span><h2>'+esc(p.name)+'</h2><div class="detail-price" id="detail-price">'+money(v?.sale_price??p.sale_price)+' <s>'+money(v?.mrp??p.mrp)+'</s></div><p>'+esc(p.description||'')+'</p>'+
 (variants.length?'<label class="variant-label">Choose a variant<select id="detail-variant">'+variants.map((x,i)=>'<option value="'+x.id+'" '+(i===0?'selected':'')+'>'+esc(x.name)+' · '+money(x.sale_price)+'</option>').join('')+'</select></label>':'')+
 '<div class="detail-spec-table"><div><span>SKU / Model</span><b data-detail-field="sku">'+esc(val('sku')||p.model_number||'Demo model')+'</b></div><div><span>Product weight</span><b data-detail-field="weight_kg">'+esc(val('weight_kg'))+' kg</b></div><div><span>Shipping weight</span><b data-detail-field="package_weight_kg">'+esc(val('package_weight_kg'))+' kg</b></div><div><span>Dimensions (H × W × D)</span><b data-detail-field="dimensions">'+esc(val('height_cm'))+' × '+esc(val('width_cm'))+' × '+esc(val('depth_cm'))+' cm</b></div><div><span>Package dimensions</span><b data-detail-field="package_dimensions">'+esc(val('package_height_cm'))+' × '+esc(val('package_width_cm'))+' × '+esc(val('package_depth_cm'))+' cm</b></div></div>'+
 '<div class="detail-stock" id="detail-stock">Demo inventory: '+Number(v?.stock_qty??p.stock_qty??0)+' units · final availability to confirm</div>'+
 (videoUrl?'<div class="product-detail-video"><h3>Product video</h3><video controls playsinline preload="metadata" src="'+esc(videoUrl)+'"></video></div>':'')+'<div class="hero-buttons"><button class="btn" data-add-product="'+p.id+'">Buy now</button><a class="btn dark" href="/contact.html?intent=product-enquiry">Enquire about this product</a></div><p class="demo-note">Product gallery supports up to five images and one video.</p></div></div></section>';
}
function loginPage(){return heroHead('Customer account','Welcome back to Airevo.','Sign in to manage your details, follow orders and save your favourite kitchen appliances.')+'<section class="auth-shell"><div class="auth-card"><span class="eyebrow">Customer account</span><h1 id="auth-heading">Sign in to your account</h1><p>Create an account or sign in using your email address and password. Email verification and password recovery are handled by Supabase Auth.</p><div class="auth-tabs"><button class="active" data-auth-mode="login">Sign in</button><button data-auth-mode="signup">Create account</button></div><div id="customer-auth-status" class="status-message"></div><form id="customer-auth-form" class="auth-form"><div class="field" id="auth-name-field" hidden><label>Full name</label><input id="auth-fullname" autocomplete="name"></div><div class="field"><label>Email address</label><input id="auth-email" type="email" autocomplete="email" required></div><div class="field"><label>Password</label><input id="auth-password" type="password" minlength="8" autocomplete="current-password" required></div><div id="auth-confirm-password-field" class="field" hidden><label>Confirm password</label><input id="auth-confirm-password" type="password" minlength="8"></div><div class="auth-links"><a href="#" id="forgot-password">Forgot password?</a><a href="/account.html">My account</a></div><button class="btn" id="customer-auth-submit">Sign in</button></form><form id="password-recovery-email-form" class="auth-form" hidden><div class="field"><label>Email address</label><input id="recovery-email" type="email" autocomplete="email" required></div><button class="btn" id="recovery-send-code">Send verification code</button><button class="btn dark" type="button" id="recovery-back-login">Back to sign in</button></form><form id="password-recovery-code-form" class="auth-form" hidden><p class="form-help">Enter the verification code sent to your email address.</p><div class="field"><label>Verification code</label><input id="recovery-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required></div><button class="btn" id="recovery-verify-code">Verify code</button><div class="auth-links"><a href="#" id="recovery-resend-code">Resend code</a><a href="#" id="recovery-back-email">Change email</a></div></form><form id="password-recovery-new-form" class="auth-form" hidden><div class="field"><label>New password</label><input id="recovery-new-password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Confirm new password</label><input id="recovery-confirm-password" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn" id="recovery-update-password">Update password</button></form></div></section>'}
function adminLoginPage(){return heroHead('Private administration','Airevo management portal.','A separate sign-in area for authorised Airevo administrators. Customer accounts cannot access this dashboard.')+'<section class="auth-shell"><div class="auth-card"><span class="eyebrow">Private area · /admin</span><h1>Admin sign in</h1><p>Sign in with an administrator account. Email verification is required. New admin account requests remain pending until approved by the owner.</p><div id="admin-auth-status" class="status-message"></div><div class="auth-tabs"><button class="active" data-admin-mode="login">Admin sign in</button><button data-admin-mode="signup">Create admin account</button></div><form id="admin-auth-form" class="auth-form"><div class="field" id="admin-name-field" hidden><label>Full name</label><input id="admin-fullname"></div><div class="field"><label>Admin email</label><input id="admin-email" type="email" required></div><div class="field"><label>Password</label><input id="admin-password" type="password" minlength="8" required></div><div id="admin-confirm-field" class="field" hidden><label>Confirm password</label><input id="admin-confirm" type="password" minlength="8"></div><div class="auth-links"><a href="#" id="admin-forgot-password">Forgot password?</a><a href="/">Back to website</a></div><button class="btn" id="admin-auth-submit">Sign in to admin</button></form><p class="form-help"><strong>Security:</strong> creating an account does not automatically grant admin rights. A verified owner/admin must approve the request. The first owner account needs to be assigned once by the project owner.</p></div></section>'}
function shell(content){
 app.innerHTML=header()+'<main>'+content+'</main>'+footer()+'<a class="whatsapp-float" href="https://wa.me/919836147993" aria-label="Chat with Airevo on WhatsApp" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.9 11.9 0 0 0 1.8 17.8L.2 23.7l6-1.6A11.9 11.9 0 0 0 20.5 3.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9 9 0 1 1 12 21Zm5-6.7c-.3-.2-1.7-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-.9-2c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.2-1.3 0-.1-.2-.2-.5-.4Z"/></svg></a>'+
 '<div class="drawer" id="cart-drawer"><div class="drawer-head"><h3>Your basket <span id="drawer-count">('+qty()+')</span></h3><button class="drawer-close" id="cart-close">×</button></div><div class="drawer-items" id="drawer-items"></div><div class="drawer-foot" id="drawer-foot"><div class="drawer-total"><span>Subtotal</span><b id="drawer-total">'+money(total())+'</b></div><p class="demo-note">Shipping and final availability are confirmed at checkout.</p><button class="btn" id="checkout-start">Proceed to checkout ↗</button></div></div>'+
 '<div class="modal-backdrop" id="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title"><div class="modal contact-modal"><div class="modal-head"><button class="modal-close" data-modal-close="contact-modal" aria-label="Close contact form">×</button><span class="eyebrow">Talk to Airevo</span><h2 id="contact-modal-title">How can we help?</h2><p>Send us a message and our team will get back to you.</p></div><div class="modal-body"><div id="contact-modal-status" class="status-message"></div><form id="contact-modal-form"><div class="form-grid"><div class="field"><label for="contact-modal-name">Full name</label><input id="contact-modal-name" required maxlength="120"></div><div class="field"><label for="contact-modal-email">Email</label><input id="contact-modal-email" type="email" required maxlength="200"></div><div class="field"><label for="contact-modal-phone">Phone</label><input id="contact-modal-phone" type="tel" maxlength="30"></div><div class="field"><label for="contact-modal-subject">Enquiry type</label><select id="contact-modal-subject"><option>Product enquiry</option><option>Price and availability</option><option>Installation enquiry</option><option>Kitchen consultation</option><option>Other</option></select></div><div class="field full"><label for="contact-modal-message">Your message</label><textarea id="contact-modal-message" required maxlength="4000" rows="4"></textarea></div></div><button class="btn" type="submit">Send enquiry ↗</button></form></div></div></div><div class="modal-backdrop" id="checkout-modal"><div class="modal"><div class="modal-head"><button class="modal-close" data-modal-close="checkout-modal">×</button><span class="eyebrow">Almost yours</span><h2>Delivery details</h2><p>Orders require a verified customer account.</p></div><div class="modal-body"><div id="checkout-status" class="status-message"></div><form id="checkout-form"><div class="form-grid"><div class="field"><label>Full name</label><input id="checkout-name" required></div><div class="field"><label>Mobile number</label><input id="checkout-phone" type="tel" required></div><div class="field full"><label>Floor / flat / house no.</label><input id="checkout-floor" required></div><div class="field full"><label>Street / road name</label><input id="checkout-address" required></div><div class="field full"><label>Nearby landmark</label><input id="checkout-landmark"></div><div class="field"><label>City</label><input id="checkout-city" required></div><div class="field"><label>State</label><input id="checkout-state" required></div><div class="field"><label>PIN code</label><input id="checkout-pin" inputmode="numeric" pattern="[0-9]{6}" required></div></div><p class="demo-note">Demo store orders are saved in Airevo and reduce demo stock. No payment gateway is connected yet.</p><button class="btn">Place demo order ↗</button></form></div></div></div>';
 $('#menu-toggle')?.addEventListener('click',()=>$('#main-nav').classList.toggle('open'));
 $('#contact-open')?.addEventListener('click',()=>{const modal=$('#contact-modal');modal?.classList.add('open');setTimeout(()=>$('#contact-modal-name')?.focus(),80)});
 $$('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop)backdrop.classList.remove('open')}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal-backdrop.open').forEach(m=>m.classList.remove('open'))});
 $$('.nav-item').forEach(it=>{const l=$(':scope > .nav-link',it);if($(':scope > .mega-menu',it))l.addEventListener('click',e=>{if(innerWidth<=850){e.preventDefault();it.classList.toggle('open')}})});
 $('#cart-open')?.addEventListener('click',()=>$('#cart-drawer').classList.add('open'));$('#cart-close')?.addEventListener('click',()=>$('#cart-drawer').classList.remove('open'));
 $('#drawer-items')?.addEventListener('click',e=>{
  const q=e.target.closest('[data-cart-qty]');if(q){const x=S.cart.find(z=>String(z.key)===q.dataset.cartQty);if(x){x.qty+=Number(q.dataset.step);if(x.qty<1)S.cart=S.cart.filter(z=>z!==x);saveCart();renderCart()}return}
  const rm=e.target.closest('[data-cart-remove]');if(rm){S.cart=S.cart.filter(z=>String(z.key)!==rm.dataset.cartRemove);saveCart();renderCart()}
 });
 const startCheckout=async()=>{if(!S.cart.length){toast('Your basket is empty');return}const s=db(),session=await s.auth.getSession();if(!session.data.session){location.href='/login.html?next=%2Fcatalogue.html%3Fcheckout%3D1';return}$('#cart-drawer').classList.remove('open');$('#checkout-modal').classList.add('open');$('#checkout-name').value=session.data.session.user.user_metadata?.full_name||'';await prefillCheckout(s,session.data.session.user)};$('#checkout-start')?.addEventListener('click',startCheckout);
 $$('[data-modal-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.modalClose).classList.remove('open'));
 $('#checkout-form')?.addEventListener('submit',placeOrder);
 $('#year')&&($('#year').textContent=new Date().getFullYear());
 document.addEventListener('change',e=>{
  const select=e.target.closest('[data-variant-select]');if(!select)return;
  const p=S.products.find(x=>x.id===select.dataset.variantSelect);if(!p)return;
  const v=(p.product_variants||[]).find(x=>x.id===select.value);if(!v)return;
  const card=select.closest('[data-product-card]'),price=card? $('[data-product-price]',card):null;
  if(price)price.innerHTML=money(v.sale_price)+' <span class="price-muted"><s>'+money(v.mrp)+'</s></span>';
  const img=card?$('.product-photo img',card):null,variantImage=v.image_urls?.[0];
  if(img&&variantImage&&/^https?:\/\//i.test(variantImage))img.src=variantImage;
 });
 document.addEventListener('click',e=>{const b=e.target.closest('[data-add-product]');if(b){const p=S.products.find(x=>x.id===b.dataset.addProduct);if(!p)return;const card=b.closest('[data-product-card]');const sel=card?$('.variant-select',card):$('#detail-variant');const v=sel&&p.product_variants?.find(x=>x.id===sel.value);const key=v?.id||p.id;const old=S.cart.find(x=>x.key===key);if(old)old.qty++;else S.cart.push({key,product_id:p.id,variant_id:v?.id||null,name:p.name+(v?' · '+v.name:''),price:Number(v?.sale_price??p.sale_price),image:v?.image_urls?.[0]||image(p),qty:1});saveCart();renderCart();toast('Added to your basket')}});
 renderCart();
if(new URL(location.href).searchParams.get('checkout')==='1'){db()?.auth.getSession().then(({data})=>{if(data.session&&S.cart.length){$('#cart-drawer')?.classList.add('open');$('#checkout-modal')?.classList.add('open');$('#checkout-name').value=data.session.user.user_metadata?.full_name||'';prefillCheckout(db(),data.session.user)}})}
}
function renderCart(){const rows=$('#drawer-items');if(!rows)return;$('#cart-count').textContent=qty();$('#drawer-count').textContent='('+qty()+')';$('#drawer-total').textContent=money(total());$('#drawer-foot').style.display=S.cart.length?'block':'none';rows.innerHTML=S.cart.length?S.cart.map(x=>'<div class="drawer-row"><img src="'+esc(x.image)+'" alt=""><div><strong>'+esc(x.name)+'</strong><small>'+money(x.price)+' each</small><div class="cart-qty"><button data-cart-qty="'+esc(x.key)+'" data-step="-1">−</button><span>'+x.qty+'</span><button data-cart-qty="'+esc(x.key)+'" data-step="1">+</button></div></div><div><b>'+money(x.price*x.qty)+'</b><button class="remove-cart" data-cart-remove="'+esc(x.key)+'">Remove</button></div></div>').join(''):'<div class="empty-state"><h3>Your basket is empty.</h3><p>Explore the Airevo catalogue and add an appliance.</p></div>'}
async function prefillCheckout(s,user){const {data}=await s.from('profiles').select('phone,address,full_name').eq('id',user.id).maybeSingle();const a=data?.address||{};if($('#checkout-name')&&!$('#checkout-name').value)$('#checkout-name').value=data?.full_name||user.user_metadata?.full_name||'';$('#checkout-phone').value=data?.phone||'';$('#checkout-floor').value=a.floor||'';$('#checkout-address').value=a.street||'';$('#checkout-landmark').value=a.landmark||'';$('#checkout-city').value=a.city||'';$('#checkout-state').value=a.state||'';$('#checkout-pin').value=a.pincode||''}
async function placeOrder(e){
 e.preventDefault();const s=db(),status=$('#checkout-status'),btn=$('#checkout-form button');const session=await s.auth.getSession(),user=session.data.session?.user;if(!user){location.href='/login.html?next=%2Faccount.html';return}
 status.textContent='';status.className='status-message';btn.disabled=true;btn.textContent='Placing order…';
 const body={customer_name:$('#checkout-name').value.trim(),customer_phone:$('#checkout-phone').value.trim(),shipping_address:{floor:$('#checkout-floor').value.trim(),address:$('#checkout-address').value.trim(),landmark:$('#checkout-landmark').value.trim(),city:$('#checkout-city').value.trim(),state:$('#checkout-state').value.trim(),pincode:$('#checkout-pin').value.trim()},items:S.cart.map(x=>({product_id:x.product_id,variant_id:x.variant_id,quantity:x.qty}))};
 const {data,error}=await s.functions.invoke('place-order',{body});btn.disabled=false;btn.textContent='Place demo order ↗';
 if(error||data?.error){status.textContent=data?.error||error.message;status.className='status-message show error';return}
 S.cart=[];saveCart();renderCart();$('#checkout-modal').classList.remove('open');
 const d=data.order,m=document.createElement('div');m.className='modal-backdrop open';
 m.innerHTML='<div class="modal"><div class="modal-head"><span class="hero-kicker">Order received</span><h2>Thank you for your order.</h2><p>Your demo order has been saved to the Airevo database.</p></div><div class="modal-body"><h3>'+esc(d.order_number)+'</h3><p>Order total: <strong>'+money(d.grand_total)+'</strong></p><p>Payment remains pending. Payment gateway is not active in this demo.</p><div class="post-order-review"><h3>Share your experience</h3><p>Leave a review now, or skip it and come back later. In this demo, reviews are saved locally for moderation preview.</p><div id="post-order-review-status" class="status-message"></div><form id="post-order-review-form"><div class="form-grid"><div class="field"><label>Your name (optional)</label><input name="customer_name" maxlength="120" value="'+esc(user.user_metadata?.full_name||'')+'"></div><div class="field"><label>Your place (optional)</label><input name="customer_place" maxlength="120" placeholder="City / area"></div><div class="field"><label>Star rating</label><select name="rating"><option value="5">★★★★★ · 5 stars</option><option value="4">★★★★ · 4 stars</option><option value="3">★★★ · 3 stars</option><option value="2">★★ · 2 stars</option><option value="1">★ · 1 star</option></select></div><div class="field"><label>One customer photo (optional)</label><input name="review_image" type="file" accept="image/*"></div><div class="field full"><label>Your review</label><textarea name="body" maxlength="4000" required placeholder="Tell us about your product and experience"></textarea></div></div><button class="btn" type="submit">Submit review ↗</button></form></div><a class="btn" href="/account.html">View my account ↗</a><button class="btn dark" id="confirmation-close">Continue shopping</button></div></div>';
 document.body.appendChild(m);
 $('#confirmation-close',m).onclick=()=>m.remove();
 $('#post-order-review-form').onsubmit=async ev=>{
  ev.preventDefault();const form=ev.currentTarget,status=$('#post-order-review-status'),fd=new FormData(form),file=fd.get('review_image');let imageUrl='';
  try{
   if(file&&file.size){if(!file.type.startsWith('image/'))throw new Error('Choose an image file.');if(file.size>350000)throw new Error('For this demo, the review image must be below 350 KB.')}
   if(file&&file.size)imageUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(file)});
   const reviews=JSON.parse(localStorage.getItem('airevo_demo_customer_reviews_v1')||'[]');
   reviews.unshift({id:'customer-review-'+Date.now(),order_id:d.id||d.order_number,order_number:d.order_number,customer_name:String(fd.get('customer_name')||user.user_metadata?.full_name||'Customer').trim(),customer_place:String(fd.get('customer_place')||'').trim(),rating:Number(fd.get('rating')),body:String(fd.get('body')||'').trim(),image_url:imageUrl,status:'Pending',fromCustomer:true,created_at:new Date().toISOString()});
   localStorage.setItem('airevo_demo_customer_reviews_v1',JSON.stringify(reviews));
   status.textContent='Review saved for the owner to moderate in this browser demo.';status.className='status-message show';
   form.reset();form.querySelector('button[type=submit]').disabled=true;
  }catch(err){status.textContent=err.message||'Unable to save review.';status.className='status-message show error'}
 };
}
function slider(){
 const els=$$('.hero-slide');if(!els.length)return;let i=0,timer;const pr=$('#hero-progress');
 function show(n){i=(n+els.length)%els.length;els.forEach((el,k)=>{el.classList.toggle('active',i===k);el.setAttribute('aria-hidden',i===k?'false':'true')});$$('[data-slide-dot]').forEach((b,k)=>b.classList.toggle('active',k===i));if(pr){pr.style.transition='none';pr.style.width='0';void pr.offsetWidth;pr.style.transition='width 6200ms linear';pr.style.width='100%'}}
 function restart(){clearInterval(timer);timer=setInterval(()=>show(i+1),6200)}
 $$('[data-slide-dot]').forEach(b=>b.onclick=()=>{show(Number(b.dataset.slideDot));restart()});$('[data-slide-prev]')?.addEventListener('click',()=>{show(i-1);restart()});$('[data-slide-next]')?.addEventListener('click',()=>{show(i+1);restart()});show(0);restart();
}
function bindCatalogue(){
 const search=$('#catalog-search'),sort=$('#catalog-sort'),cat=$('#catalog-category'),price=$('#catalog-price'),grid=$('#catalog-products');if(!grid)return;
 function priceMatch(p){const n=Number(p.sale_price||0),v=price?.value||'';return !v||(v==='under-10000'&&n<10000)||(v==='10000-25000'&&n>=10000&&n<25000)||(v==='25000-50000'&&n>=25000&&n<=50000)||(v==='over-50000'&&n>50000)}
 function run(){let items=S.products.filter(p=>(!cat?.value||catSlug(p)===cat.value)&&priceMatch(p)&&(p.name+' '+(p.short_description||'')+' '+(p.categories?.name||'')).toLowerCase().includes((search?.value||'').toLowerCase()));if(sort?.value==='price-low')items.sort((a,b)=>a.sale_price-b.sale_price);if(sort?.value==='price-high')items.sort((a,b)=>b.sale_price-a.sale_price);if(sort?.value==='name')items.sort((a,b)=>a.name.localeCompare(b.name));if(!sort?.value||sort.value==='featured')items.sort((a,b)=>Number(b.is_trending)-Number(a.is_trending)||Number(b.is_popular)-Number(a.is_popular)||Number(b.is_featured)-Number(a.is_featured));grid.innerHTML=cards(items)}
 search?.addEventListener('input',run);sort?.addEventListener('change',run);cat?.addEventListener('change',()=>{const u=new URL(location.href);if(cat.value)u.searchParams.set('category',cat.value);else u.searchParams.delete('category');history.replaceState({},'',u);run()});price?.addEventListener('change',()=>{const u=new URL(location.href);if(price.value)u.searchParams.set('price',price.value);else u.searchParams.delete('price');history.replaceState({},'',u);run()});run();
}
async function bindReviews(){
 const s=db(),form=$('#review-form');if(!s||!form)return;
 const status=$('#review-status');
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const {data:{session}}=await s.auth.getSession(),user=session?.user;
  if(!user){location.href='/login.html?next=%2Freviews.html';return}
  if(!user.email_confirmed_at){status.textContent='Please verify your email address before submitting a review.';status.className='status-message show error';return}
  const payload={user_id:user.id,customer_name:$('#review-name').value.trim()||user.user_metadata?.full_name||user.email,rating:Number($('#review-rating').value),title:$('#review-title').value.trim(),body:$('#review-body').value.trim(),is_approved:false,is_verified_purchase:false};
  const {error}=await s.from('reviews').insert(payload);
  status.textContent=error?'Unable to submit review: '+error.message:'Thank you. Your review has been submitted for moderation. Only approved five-star reviews appear publicly.';
  status.className='status-message show'+(error?' error':'');if(!error)form.reset();
 });
}
function productImages(){ $$('[data-product-image]').forEach(b=>b.onclick=()=>{$('#product-main-image').src=b.dataset.productImage;$$('[data-product-image]').forEach(x=>x.classList.toggle('active',x===b))})}
function bindContact(){
 const s=db();
 const bind=(formId,prefix,statusId)=>{
  const f=$('#'+formId);if(!f)return;
  f.addEventListener('submit',async e=>{
   e.preventDefault();const status=$('#'+statusId),submit=f.querySelector('button[type="submit"],button:not([type])');
   if(!s){status.textContent='The enquiry service is temporarily unavailable. Please contact us on WhatsApp.';status.className='status-message show error';return}
   if(submit){submit.disabled=true;submit.textContent='Sending…'}
   status.textContent='Sending…';status.className='status-message show';
   const val=id=>$('#'+prefix+id)?.value?.trim()||'';
   const {error}=await s.from('contact_inquiries').insert({name:val('name'),email:val('email'),phone:val('phone'),subject:val('subject')||'General enquiry',message:val('message')});
   status.textContent=error?'Unable to send enquiry: '+error.message:'Thank you. Your enquiry has been saved.';
   status.className='status-message show'+(error?' error':'');
   if(!error){f.reset();if(formId==='contact-modal-form')setTimeout(()=>$('#contact-modal')?.classList.remove('open'),1200)}
   if(submit){submit.disabled=false;submit.textContent=formId==='contact-modal-form'?'Send enquiry ↗':'Send enquiry ↗'}
  });
 };
 bind('contact-form','contact-','contact-status');
 bind('contact-modal-form','contact-modal-','contact-modal-status');
}
async function reviewsPage(){
 let data=[];const client=db();
 if(client){const result=await client.from('reviews').select('*').eq('is_approved',true).order('created_at',{ascending:false});if(!result.error)data=result.data||[]}
 return heroHead('Customer stories','Feedback and demo testimonials.','Sample testimonials are clearly labelled for this demo. Verified customer reviews will appear after they are submitted and approved.')+
 '<section class="section"><div class="container"><div class="review-list">'+
 (data.length?data.map(r=>'<article class="review-card"><div class="stars">'+('★'.repeat(Number(r.rating||0)))+('☆'.repeat(5-Number(r.rating||0)))+'</div><h3>'+esc(r.title||'Customer feedback')+'</h3><p>'+esc(r.body)+'</p><footer>'+esc(r.customer_name)+' · '+new Date(r.created_at).toLocaleDateString('en-IN')+'<span class="review-note">'+(r.is_verified_purchase?'Verified purchase':'Sample demo testimonial · not a verified purchase')+'</span></footer></article>').join(''):'<div class="empty-state"><h3>Customer reviews will appear here.</h3><p>Approved customer feedback will appear here after moderation.</p></div>')+
 '</div><div class="form-panel review-submit"><h2>Share your experience</h2><p>Sign in with your customer account to submit a review. Reviews are moderated before appearing publicly.</p><div id="review-status" class="status-message"></div><form id="review-form"><div class="form-grid"><div class="field"><label>Your name</label><input id="review-name" maxlength="120" placeholder="Name shown with your review"></div><div class="field"><label>Rating</label><select id="review-rating"><option value="5">★★★★★ · 5 stars</option><option value="4">★★★★ · 4 stars</option><option value="3">★★★ · 3 stars</option><option value="2">★★ · 2 stars</option><option value="1">★ · 1 star</option></select></div><div class="field full"><label>Review title</label><input id="review-title" maxlength="120"></div><div class="field full"><label>Your experience</label><textarea id="review-body" maxlength="4000" required></textarea></div></div><button class="btn" type="submit">Submit review ↗</button></form></div></div></section>';
}
async function accountPage(){
 const s=db();let user=null,profile=null,orders=[];
 if(s){const sess=await s.auth.getSession();user=sess.data.session?.user||null;if(user){
  const [pr,or,rr]=await Promise.all([
   s.from('profiles').select('*').eq('id',user.id).maybeSingle(),
   s.from('orders').select('*,order_items(*)').eq('user_id',user.id).order('created_at',{ascending:false}),
   s.from('reviews').select('order_id').eq('user_id',user.id)
  ]);profile=pr.data;orders=or.data||[];const reviewed=new Set((rr.data||[]).map(x=>x.order_id));orders.forEach(o=>o.customer_reviewed=reviewed.has(o.id));window.AirevoAccountOrders=orders;
 }}
 if(!user)return heroHead('My account','Your Airevo account.','Sign in to see your order history and manage your contact details.')+'<section class="section"><div class="container empty-state"><a class="btn" href="/login.html?next=%2Faccount.html">Sign in to continue ↗</a></div></section>';
 const addr=profile?.address||{};
 const orderRows=orders.length?orders.map(o=>{
  const hasReview=!!o.customer_reviewed;
  return '<tr><td><strong>'+esc(o.order_number)+'</strong><br><small>'+new Date(o.created_at).toLocaleDateString('en-IN')+'</small></td><td>'+money(o.grand_total)+'</td><td>'+esc(o.status)+'</td><td><div class="account-order-actions"><button class="btn-mini" data-download-bill="'+o.id+'">Download / print bill</button>'+(hasReview?'<span class="review-note">Review submitted</span>':'<button class="btn-mini" data-order-review="'+o.id+'">Write a review</button>')+'</div></td></tr>';
 }).join(''):'<tr><td colspan="4">No orders yet. Confirmed orders will appear here.</td></tr>';
 return heroHead('My account','Hello, '+esc(profile?.full_name||user.email)+'.','Manage your account, saved delivery address and order history.')+
 '<section class="section"><div class="container account-overview">'+
 '<div class="admin-panel account-details-panel"><div class="admin-panel-head"><div><h3>Account details</h3><p>Keep your details up to date for faster checkout.</p></div><button class="btn-mini" id="account-edit-toggle">Edit details</button></div>'+
 '<p><strong>Name:</strong> '+esc(profile?.full_name||user.user_metadata?.full_name||'Not added')+'</p><p><strong>Email:</strong> '+esc(user.email)+'</p><p><strong>Phone:</strong> '+esc(profile?.phone||'Not added yet')+'</p>'+
 '<p><strong>Saved address:</strong> '+esc([addr.floor,addr.street,addr.landmark,addr.city,addr.pincode,addr.state].filter(Boolean).join(', ')||'No address saved')+'</p>'+
 '</div>'+
 '<div class="admin-panel" id="account-edit-panel" hidden><h3>Edit account details</h3><div id="account-edit-status" class="status-message"></div>'+
 '<form id="account-profile-form"><div class="admin-form-grid">'+
 '<div class="field"><label>Full name</label><input name="full_name" maxlength="120" required value="'+esc(profile?.full_name||user.user_metadata?.full_name||'')+'"></div>'+
 '<div class="field"><label>Phone number</label><input name="phone" type="tel" maxlength="20" value="'+esc(profile?.phone||'')+'" placeholder="+91…"></div>'+
 '<div class="field full"><label>Floor / flat / house no.</label><input name="floor" maxlength="160" value="'+esc(addr.floor||'')+'" placeholder="Flat 4B, 2nd Floor"></div>'+
 '<div class="field full"><label>Street / road name</label><input name="street" maxlength="200" value="'+esc(addr.street||'')+'" required></div>'+
 '<div class="field full"><label>Nearby landmark</label><input name="landmark" maxlength="160" value="'+esc(addr.landmark||'')+'"></div>'+
 '<div class="field"><label>City</label><input name="city" maxlength="100" value="'+esc(addr.city||'')+'" required></div>'+
 '<div class="field"><label>PIN code</label><input name="pincode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="'+esc(addr.pincode||'')+'" required></div>'+
 '<div class="field"><label>State</label><input name="state" maxlength="100" value="'+esc(addr.state||'West Bengal')+'" required></div>'+
 '</div><button class="btn" type="submit">Save details</button></form>'+
 '<div class="account-security-block"><h4>Change email address</h4><p>Supabase will send a confirmation email to your new address. Open its verification link to complete the change.</p>'+
 '<form id="account-email-form"><div class="field"><label>New email address</label><input name="email" type="email" required></div><button class="btn-mini" type="submit">Send verification</button></form>'+
 '</div>'+
 '<div class="account-security-block"><h4>Change password</h4><form id="account-password-form"><div class="admin-form-grid"><div class="field"><label>Current password</label><input name="current" type="password" required autocomplete="current-password"></div><div class="field"><label>New password</label><input name="next" type="password" minlength="8" required autocomplete="new-password"></div><div class="field"><label>Confirm new password</label><input name="confirm" type="password" minlength="8" required autocomplete="new-password"></div></div><button class="btn-mini" type="submit">Update password</button></form></div></div>'+
 '<div class="admin-panel"><div class="admin-panel-head"><div><h3>My orders</h3><p>Review an order or download its bill whenever you need it.</p></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order / date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+orderRows+'</tbody></table></div></div>'+

 '</div></section>';
}
async function bindAccount(){
 const s=db();if(!s)return;const {data:{session}}=await s.auth.getSession();const user=session?.user;if(!user)return;
 const status=$('#account-edit-status'),panel=$('#account-edit-panel');
 $('#account-edit-toggle')?.addEventListener('click',()=>{panel.hidden=!panel.hidden;$('#account-edit-toggle').textContent=panel.hidden?'Edit details':'Close editor'});
 
 $('#account-profile-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;
  const payload={full_name:String(fd.get('full_name')||'').trim(),phone:String(fd.get('phone')||'').trim(),address:{floor:String(fd.get('floor')||'').trim(),street:String(fd.get('street')||'').trim(),landmark:String(fd.get('landmark')||'').trim(),city:String(fd.get('city')||'').trim(),pincode:String(fd.get('pincode')||'').trim(),state:String(fd.get('state')||'').trim()},updated_at:new Date().toISOString()};
  const {error}=await s.from('profiles').update(payload).eq('id',user.id);
  if(error){showAccountStatus(status,error.message,true)}else{await s.auth.updateUser({data:{full_name:payload.full_name}});showAccountStatus(status,'Your account details and delivery address have been saved.');setTimeout(()=>location.reload(),700)}
  btn.disabled=false;
 });
 $('#account-email-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const email=new FormData(e.currentTarget).get('email').trim();const {error}=await s.auth.updateUser({email});
  if(error){showAccountStatus(status,error.message,true);return}
  $('#account-email-verify-form').hidden=false;showAccountStatus(status,'Verification email requested. Enter the code sent to the new address.');
 });
 $('#account-password-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(e.currentTarget),current=String(fd.get('current')),next=String(fd.get('next')),confirm=String(fd.get('confirm'));
  if(next!==confirm){showAccountStatus(status,'New passwords do not match.',true);return}
  const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;
  const {error:reauthError}=await s.auth.signInWithPassword({email:user.email,password:current});
  if(reauthError){showAccountStatus(status,'Current password is incorrect.',true);btn.disabled=false;return}
  const {error}=await s.auth.updateUser({password:next});showAccountStatus(status,error?.message||'Password changed successfully.',!!error);if(!error)e.currentTarget.reset();btn.disabled=false;
 });
 if(!window.__airevoAccountSupportOpenBound){document.addEventListener('airevo:open-support',()=>loadCustomerSupport(s,user));window.__airevoAccountSupportOpenBound=true;}
 $('#customer-support-form')?.addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,btn=form.querySelector('button[type=submit]'),message=$('#customer-support-message').value.trim(),file=$('#customer-support-file').files[0];if(!message&&!file)return;
  btn.disabled=true;
  try{
   let conversation=window.airevoSupportConversationId;
   if(!conversation){const {data,error}=await s.from('support_conversations').insert({customer_id:user.id,subject:'Customer support'}).select('id').single();if(error)throw error;conversation=data.id;window.airevoSupportConversationId=conversation;window.AirevoSupportWidget?.watchConversation(conversation)}
   let path=null,name=null;
   if(file){if(file.size>10485760)throw new Error('Attachment must be 10 MB or smaller.');if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw new Error('Only JPG, PNG, WEBP or PDF files are allowed.');path=user.id+'/'+conversation+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const up=await s.storage.from('airevo-support').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;name=file.name}
   const {error}=await s.from('support_messages').insert({conversation_id:conversation,sender_id:user.id,sender_role:'customer',message,attachment_path:path,attachment_name:name});if(error)throw error;
   await s.from('support_conversations').update({status:'open',last_message_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',conversation);
   $('#customer-support-message').value='';$('#customer-support-file').value='';await loadCustomerSupport(s,user);
  }catch(err){toast(err.message||'Unable to send your message')}finally{btn.disabled=false}
 });
 $$('[data-download-bill]').forEach(b=>b.addEventListener('click',()=>{const o=window.AirevoAccountOrders?.find(x=>x.id===b.dataset.downloadBill);if(o)downloadCustomerBill(o)}));
 $$('[data-order-review]').forEach(b=>b.addEventListener('click',()=>openOrderReview(s,user,b.dataset.orderReview)));
 window.AirevoAccountOrders=window.AirevoAccountOrders||[];
}
function showAccountStatus(el,message,error=false){if(!el)return;el.textContent=message;el.className='status-message show'+(error?' error':'')}
async function loadCustomerSupport(s,user){
 const host=$('#customer-support-thread');if(!host)return;
 const {data:convs,error}=await s.from('support_conversations').select('*').eq('customer_id',user.id).order('last_message_at',{ascending:false}).limit(1);if(error){host.textContent=error.message;return}
 let conversation=convs?.[0];
 if(!conversation){host.innerHTML='<p class="form-help">Send your first message to start a private chat with the Airevo owner.</p>';return}
 window.airevoSupportConversationId=conversation.id;
 window.AirevoSupportWidget?.watchConversation(conversation.id);
 const {data:messages,error:msgError}=await s.from('support_messages').select('*').eq('conversation_id',conversation.id).order('created_at');
 if(msgError){host.textContent=msgError.message;return}
 host.innerHTML=(messages||[]).map(m=>'<div class="support-message '+(m.sender_role==='customer'?'mine':'theirs')+'"><small>'+(m.sender_role==='customer'?'You':'Airevo owner')+' · '+new Date(m.created_at).toLocaleString('en-IN')+'</small><p>'+esc(m.message)+'</p>'+(m.attachment_path?'<a href="#" data-support-attachment="'+esc(m.attachment_path)+'">'+esc(m.attachment_name||'View attachment')+'</a>':'')+'</div>').join('')||'<p class="form-help">No messages yet.</p>';
 host.scrollTop=host.scrollHeight;
 host.querySelectorAll('[data-support-attachment]').forEach(a=>a.onclick=async ev=>{ev.preventDefault();const {data,error}=await s.storage.from('airevo-support').createSignedUrl(a.dataset.supportAttachment,300);if(error){toast(error.message);return}window.open(data.signedUrl,'_blank','noopener')});
}
function downloadCustomerBill(o){
 const addr=o.shipping_address||{},items=(o.order_items||[]).map(it=>'<tr><td>'+esc(it.product_name)+' '+esc(it.variant_name||'')+'</td><td>'+it.quantity+'</td><td>'+money(it.unit_price)+'</td><td>'+money(it.line_total)+'</td></tr>').join('');
 const html='<!doctype html><html><head><meta charset="utf-8"><title>Airevo bill '+esc(o.order_number)+'</title><style>body{font:14px Arial;padding:36px;color:#172b3a}h1{color:#168bc5}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:12px;border-bottom:1px solid #dce6eb}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:20px}</style></head><body><h1>Airevo</h1><b>Order bill</b><p>Order: '+esc(o.order_number)+'<br>Date: '+new Date(o.created_at).toLocaleString('en-IN')+'<br>Status: '+esc(o.status)+'<br>Payment: '+esc(o.payment_status)+'</p><p>'+esc(o.customer_name)+'<br>'+esc(o.customer_email)+'<br>'+esc(o.customer_phone)+'<br>'+esc([addr.floor,addr.street,addr.landmark,addr.city,addr.state,addr.pincode].filter(Boolean).join(', '))+'</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>'+items+'</tbody></table><div class="total">Grand total: '+money(o.grand_total)+'</div><p>Thank you for choosing Airevo.</p><script>window.onload=()=>window.print()</script></body></html>';
 const w=window.open('','_blank','width=850,height=900');if(!w){toast('Allow pop-ups to download or print your bill.');return}w.document.write(html);w.document.close();
}
async function openOrderReview(s,user,orderId){
 const {data:order,error}=await s.from('orders').select('id,order_number').eq('id',orderId).eq('user_id',user.id).single();if(error){toast(error.message);return}
 const modal=document.createElement('div');modal.className='modal-backdrop open';modal.innerHTML='<div class="modal"><div class="modal-head"><button class="modal-close" type="button">×</button><span class="hero-kicker">Order review</span><h2>Share your experience</h2><p>'+esc(order.order_number)+'</p></div><div class="modal-body"><div id="order-review-status" class="status-message"></div><form id="order-review-form"><div class="field"><label>Star rating</label><select name="rating"><option value="5">★★★★★ · 5 stars</option><option value="4">★★★★ · 4 stars</option><option value="3">★★★ · 3 stars</option><option value="2">★★ · 2 stars</option><option value="1">★ · 1 star</option></select></div><div class="field"><label>Review title</label><input name="title" maxlength="120"></div><div class="field"><label>Your experience</label><textarea name="body" maxlength="4000" required></textarea></div><button class="btn" type="submit">Submit review</button></form></div></div>';
 document.body.appendChild(modal);modal.querySelector('.modal-close').onclick=()=>modal.remove();
 modal.querySelector('#order-review-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),payload={user_id:user.id,order_id:order.id,customer_name:user.user_metadata?.full_name||user.email,rating:Number(fd.get('rating')),title:String(fd.get('title')||'').trim(),body:String(fd.get('body')||'').trim(),is_verified_purchase:true,is_approved:false};const {error}=await s.from('reviews').insert(payload);const st=modal.querySelector('#order-review-status');if(error){st.textContent=error.code==='23505'?'You have already reviewed this order.':error.message;st.className='status-message show error'}else{st.textContent='Thank you. Your review has been sent to the owner for moderation.';st.className='status-message show';e.currentTarget.reset();setTimeout(()=>location.reload(),900)}};
}

function loginPage(){return heroHead('Customer account','Welcome back to Airevo.','Sign in to manage your details, follow orders and save your favourite appliances.')+'<section class="auth-shell"><div class="auth-card"><span class="eyebrow">Customer account</span><h1 id="auth-heading">Sign in to your account</h1><p>Create an account or sign in using email and password. Email verification and password recovery use Supabase Auth.</p><div class="auth-tabs"><button class="active" data-auth-mode="login">Sign in</button><button data-auth-mode="signup">Create account</button></div><div id="customer-auth-status" class="status-message"></div><form id="customer-auth-form" class="auth-form"><div class="field" id="auth-name-field" hidden><label>Full name</label><input id="auth-fullname"></div><div class="field"><label>Email address</label><input id="auth-email" type="email" required autocomplete="email"></div><div class="field"><label>Password</label><input id="auth-password" type="password" minlength="8" required autocomplete="current-password"></div><div id="auth-confirm-password-field" class="field" hidden><label>Confirm password</label><input id="auth-confirm-password" type="password" minlength="8"></div><div class="auth-links"><a href="#" id="forgot-password">Forgot password?</a><a href="/account.html">My account</a></div><button class="btn" id="customer-auth-submit">Sign in</button></form><form id="password-recovery-email-form" class="auth-form" hidden><div class="field"><label>Email address</label><input id="recovery-email" type="email" autocomplete="email" required></div><button class="btn" id="recovery-send-code">Send verification code</button><button class="btn dark" type="button" id="recovery-back-login">Back to sign in</button></form><form id="password-recovery-code-form" class="auth-form" hidden><p class="form-help">Enter the verification code sent to your email address.</p><div class="field"><label>Verification code</label><input id="recovery-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required></div><button class="btn" id="recovery-verify-code">Verify code</button><div class="auth-links"><a href="#" id="recovery-resend-code">Resend code</a><a href="#" id="recovery-back-email">Change email</a></div></form><form id="password-recovery-new-form" class="auth-form" hidden><div class="field"><label>New password</label><input id="recovery-new-password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Confirm new password</label><input id="recovery-confirm-password" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn" id="recovery-update-password">Update password</button></form></div></section>'}
function adminPage(){return adminDashboard()}
function adminDashboard(){return heroHead('Airevo admin','Store management. One workspace.','Manage catalogue content, product variants, stock, collections, orders, reviews and editorial posts.')+'<section class="section"><div class="container admin-shell"><aside class="admin-nav" id="admin-nav"><button class="active" data-admin-tab="overview">Overview</button><button data-admin-tab="products">Products & variants</button><button data-admin-tab="categories">Categories</button><button data-admin-tab="collections">Collections</button><button data-admin-tab="orders">Orders & billing</button><button data-admin-tab="reviews">Reviews</button><button data-admin-tab="blogs">Blog posts</button><button data-admin-tab="inquiries">Enquiries</button><button data-admin-tab="support">Admin Help</button><button id="admin-signout">Sign out</button></aside><div class="admin-main" id="admin-main"><div class="boot-screen"><span class="boot-mark">A</span><span>Loading store data…</span></div></div></div></section>'}
function shell(content){
 app.innerHTML=header()+'<main>'+content+'</main>'+footer()+
 '<div class="drawer" id="cart-drawer"><div class="drawer-head"><h3>Your basket <span id="drawer-count">('+qty()+')</span></h3><button class="drawer-close" id="cart-close">×</button></div><div class="drawer-items" id="drawer-items"></div><div class="drawer-foot" id="drawer-foot"><div class="drawer-total"><span>Subtotal</span><b id="drawer-total">'+money(total())+'</b></div><p class="demo-note">Shipping and final availability are confirmed at checkout.</p><button class="btn" id="checkout-start">Proceed to checkout ↗</button></div></div>'+
 '<div class="modal-backdrop" id="checkout-modal"><div class="modal"><div class="modal-head"><button class="modal-close" data-modal-close="checkout-modal">×</button><span class="eyebrow">Almost yours</span><h2>Delivery details</h2><p>Orders require a verified customer account.</p></div><div class="modal-body"><div id="checkout-status" class="status-message"></div><form id="checkout-form"><div class="form-grid"><div class="field"><label>Full name</label><input id="checkout-name" required></div><div class="field"><label>Mobile number</label><input id="checkout-phone" type="tel" required></div><div class="field full"><label>Delivery address</label><textarea id="checkout-address" required></textarea></div><div class="field"><label>City</label><input id="checkout-city" required></div><div class="field"><label>State</label><input id="checkout-state" required></div><div class="field"><label>PIN code</label><input id="checkout-pin" required></div></div><p class="demo-note">Demo store orders are saved in Airevo and reduce demo stock. No payment gateway is connected yet.</p><button class="btn">Place demo order ↗</button></form></div></div></div>';
 $('#menu-toggle')?.addEventListener('click',()=>$('#main-nav').classList.toggle('open'));
 $$('.nav-item').forEach(it=>{const l=$(':scope > .nav-link',it);if($(':scope > .mega-menu',it))l.addEventListener('click',e=>{if(innerWidth<=850){e.preventDefault();it.classList.toggle('open')}})});
 $('#cart-open')?.addEventListener('click',()=>$('#cart-drawer').classList.add('open'));$('#cart-close')?.addEventListener('click',()=>$('#cart-drawer').classList.remove('open'));
 $('#drawer-items')?.addEventListener('click',e=>{const q=e.target.closest('[data-cart-qty]');if(q){const x=S.cart.find(z=>String(z.key)===q.dataset.cartQty);if(x){x.qty+=Number(q.dataset.step);if(x.qty<1)S.cart=S.cart.filter(z=>z!==x);saveCart();renderCart()}return}const rm=e.target.closest('[data-cart-remove]');if(rm){S.cart=S.cart.filter(z=>String(z.key)!==rm.dataset.cartRemove);saveCart();renderCart()}});
 const startCheckout=async()=>{if(!S.cart.length){toast('Your basket is empty');return}const s=db(),session=await s.auth.getSession();if(!session.data.session){location.href='/login.html?next=%2Fcatalogue.html%3Fcheckout%3D1';return}$('#cart-drawer').classList.remove('open');$('#checkout-modal').classList.add('open');$('#checkout-name').value=session.data.session.user.user_metadata?.full_name||''};$('#checkout-start')?.addEventListener('click',startCheckout);
 $$('[data-modal-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.modalClose).classList.remove('open'));$('#checkout-form')?.addEventListener('submit',placeOrder);
 document.addEventListener('click',e=>{const b=e.target.closest('[data-add-product]');if(!b)return;const p=S.products.find(x=>x.id===b.dataset.addProduct);if(!p)return;const card=b.closest('[data-product-card]'),sel=card?$('.variant-select',card):$('#detail-variant'),v=sel&&p.product_variants?.find(x=>x.id===sel.value),key=v?.id||p.id,old=S.cart.find(x=>x.key===key);if(old)old.qty++;else S.cart.push({key,product_id:p.id,variant_id:v?.id||null,name:p.name+(v?' · '+v.name:''),price:Number(v?.sale_price??p.sale_price),image:v?.image_urls?.[0]||image(p),qty:1});saveCart();renderCart();toast('Added to your basket')});
 renderCart();
if(new URL(location.href).searchParams.get('checkout')==='1'){db()?.auth.getSession().then(({data})=>{if(data.session&&S.cart.length){$('#cart-drawer')?.classList.add('open');$('#checkout-modal')?.classList.add('open');$('#checkout-name').value=data.session.user.user_metadata?.full_name||''}})}
}
function renderCart(){const rows=$('#drawer-items');if(!rows)return;$('#cart-count').textContent=qty();$('#drawer-count').textContent='('+qty()+')';$('#drawer-total').textContent=money(total());$('#drawer-foot').style.display=S.cart.length?'block':'none';rows.innerHTML=S.cart.length?S.cart.map(x=>'<div class="drawer-row"><img src="'+esc(x.image)+'" alt=""><div><strong>'+esc(x.name)+'</strong><small>'+money(x.price)+' each</small><div class="cart-qty"><button data-cart-qty="'+esc(x.key)+'" data-step="-1">−</button><span>'+x.qty+'</span><button data-cart-qty="'+esc(x.key)+'" data-step="1">+</button></div></div><div><b>'+money(x.price*x.qty)+'</b><button class="remove-cart" data-cart-remove="'+esc(x.key)+'">Remove</button></div></div>').join(''):'<div class="empty-state"><h3>Your basket is empty.</h3><p>Explore the Airevo catalogue and add an appliance.</p></div>'}
async function placeOrder(e){
 e.preventDefault();const s=db(),status=$('#checkout-status'),btn=$('#checkout-form button');
 if(!S.cart.length){status.textContent='Your basket is empty.';status.className='status-message show error';return}
 const session=await s.auth.getSession(),user=session.data.session?.user;
 if(!user){location.href='/login.html?next=%2Fcatalogue.html%3Fcheckout%3D1';return}
 status.textContent='';status.className='status-message';btn.disabled=true;btn.textContent='Placing order…';
 const body={customer_name:$('#checkout-name').value.trim(),customer_phone:$('#checkout-phone').value.trim(),shipping_address:{address:$('#checkout-address').value.trim(),city:$('#checkout-city').value.trim(),state:$('#checkout-state').value.trim(),pincode:$('#checkout-pin').value.trim()},items:S.cart.map(x=>({product_id:x.product_id,variant_id:x.variant_id,quantity:x.qty}))};
 try{
  const {data,error}=await s.functions.invoke('place-order',{body});
  if(error||data?.error||!data?.order)throw new Error(data?.error||error?.message||'The order could not be saved. Please try again.');
  S.cart=[];saveCart();renderCart();$('#checkout-modal').classList.remove('open');
  const d=data.order,m=document.createElement('div');m.className='modal-backdrop open';m.innerHTML='<div class="modal"><div class="modal-head"><span class="hero-kicker">Order received</span><h2>Thank you for your order.</h2><p>Your demo order has been saved to the Airevo database.</p></div><div class="modal-body"><h3>'+esc(d.order_number)+'</h3><p>Order total: <strong>'+money(d.grand_total)+'</strong></p><p>Payment remains pending. Razorpay is not connected in this demo.</p><a class="btn" href="/account.html">View my account ↗</a><button class="btn dark" id="confirmation-close">Continue shopping</button></div></div>';document.body.appendChild(m);$('#confirmation-close',m).onclick=()=>m.remove();
 }catch(error){status.textContent=error.message||'Unable to place the demo order.';status.className='status-message show error'}
 finally{btn.disabled=false;btn.textContent='Place demo order ↗'}
}
function bindCatalogue(){
 const search=$('#catalog-search'),sort=$('#catalog-sort'),cat=$('#catalog-category'),price=$('#catalog-price'),grid=$('#catalog-products');if(!grid)return;
 function priceMatch(p){const n=Number(p.sale_price||0),v=price?.value||'';return !v||(v==='under-10000'&&n<10000)||(v==='10000-25000'&&n>=10000&&n<25000)||(v==='25000-50000'&&n>=25000&&n<=50000)||(v==='over-50000'&&n>50000)}
 function run(){let items=S.products.filter(p=>(!cat?.value||catSlug(p)===cat.value)&&priceMatch(p)&&(p.name+' '+(p.short_description||'')+' '+(p.categories?.name||'')).toLowerCase().includes((search?.value||'').toLowerCase()));if(sort?.value==='price-low')items.sort((a,b)=>a.sale_price-b.sale_price);if(sort?.value==='price-high')items.sort((a,b)=>b.sale_price-a.sale_price);if(sort?.value==='name')items.sort((a,b)=>a.name.localeCompare(b.name));if(!sort?.value||sort.value==='featured')items.sort((a,b)=>Number(b.is_trending)-Number(a.is_trending)||Number(b.is_popular)-Number(a.is_popular)||Number(b.is_featured)-Number(a.is_featured));grid.innerHTML=cards(items)}
 search?.addEventListener('input',run);sort?.addEventListener('change',run);cat?.addEventListener('change',()=>{const u=new URL(location.href);if(cat.value)u.searchParams.set('category',cat.value);else u.searchParams.delete('category');history.replaceState({},'',u);run()});price?.addEventListener('change',()=>{const u=new URL(location.href);if(price.value)u.searchParams.set('price',price.value);else u.searchParams.delete('price');history.replaceState({},'',u);run()});run();
}
async function bindContact(){const s=db(),f=$('#contact-form');if(!s||!f)return;f.onsubmit=async e=>{e.preventDefault();const st=$('#contact-status');st.textContent='Sending…';st.className='status-message show';const {error}=await s.from('contact_inquiries').insert({name:$('#contact-name').value.trim(),email:$('#contact-email').value.trim(),phone:$('#contact-phone').value.trim(),subject:$('#contact-subject').value,message:$('#contact-message').value.trim()});st.textContent=error?'Unable to send enquiry: '+error.message:'Thank you. Your enquiry has been saved.';st.className='status-message show'+(error?' error':'');if(!error)f.reset()}}
function productImages(){
 function bindThumbs(){$$('[data-product-image]').forEach(b=>b.onclick=()=>{$('#product-main-image').src=b.dataset.productImage;$$('[data-product-image]').forEach(x=>x.classList.toggle('active',x===b))})}
 bindThumbs();
 const select=$('#detail-variant');if(!select)return;
 const slug=new URL(location.href).searchParams.get('slug')||'',p=S.products.find(x=>x.slug===slug);if(!p)return;
 select.addEventListener('change',()=>{
  const v=(p.product_variants||[]).find(x=>x.id===select.value);if(!v)return;
  $('#detail-price').innerHTML=money(v.sale_price)+' <s>'+money(v.mrp)+'</s>';
  $('#detail-stock').textContent='Demo inventory: '+Number(v.stock_qty||0)+' units · final availability to confirm';
  const fields={sku:v.sku||p.sku||p.model_number||'Demo model',weight_kg:(v.weight_kg??p.weight_kg??'—')+' kg',package_weight_kg:(v.package_weight_kg??p.package_weight_kg??'—')+' kg',dimensions:(v.height_cm??p.height_cm??'—')+' × '+(v.width_cm??p.width_cm??'—')+' × '+(v.depth_cm??p.depth_cm??'—')+' cm',package_dimensions:(v.package_height_cm??p.package_height_cm??'—')+' × '+(v.package_width_cm??p.package_width_cm??'—')+' × '+(v.package_depth_cm??p.package_depth_cm??'—')+' cm'};
  Object.keys(fields).forEach(k=>{const el=$('[data-detail-field="'+k+'"]');if(el)el.textContent=fields[k]});
  const images=v.image_urls?.length?v.image_urls:gallery(p),thumbs=$('#product-thumbnails');thumbs.innerHTML=images.map((src,i)=>'<button data-product-image="'+esc(src)+'" class="'+(i===0?'active':'')+'"><img src="'+esc(src)+'" alt="'+esc(p.name)+' view '+(i+1)+'"></button>').join('');
  $('#product-main-image').src=images[0]||image(p);bindThumbs();
 });
}
async function syncHeaderAuth(){const s=db();if(!s)return;const {data}=await s.auth.getSession();const link=$('.login-link');if(link){if(data.session){link.textContent='Sign out';link.href='#';link.onclick=async e=>{e.preventDefault();await s.auth.signOut();location.href='/login.html'}}else{link.textContent='Sign in';link.href='/login.html';link.onclick=null}}}
async function render(){
 const loadTask=load();
 let content='';
 try{
 if(page==='home')content=await home();
 else if(page==='catalogue')content=catalogue();
 else if(page==='category')content=categoryPage();
 else if(page==='collection')content=collectionPage();
 else if(page==='approach')content=approachPage();
 else if(page==='reviews')content=await reviewsPage();
 else if(page==='contact')content=contactPage();
 else if(page==='product')content=productPage();
 else if(page==='login')content=loginPage();
 else if(page==='account')content=await accountPage();
 else if(page==='admin')content=adminPage();
 else if(page==='blog')content=blogPage();
 else if(page==='blog-post')content=blogPostPage();
 else content=await home();
 shell(content);slider();bindCatalogue();productImages();bindContact();bindReviews();syncHeaderAuth();
 if(page==='login')window.AirevoAuth?.customerBoot();
 if(page==='admin')window.AirevoAdmin?.render();
 if(page==='account')bindAccount();
 }catch(e){console.error(e);shell(heroHead('Airevo','Something went wrong.','Please refresh the page or contact the Airevo team.')+'<section class="section"><div class="container">'+esc(e.message||e)+'</div></section>')}
 if(loadTask&&!S.dataLoaded)loadTask.then(()=>{if(S.dataLoaded&&!document.hidden)render()}).catch(error=>console.error('Airevo data request failed after the storefront rendered.',error));
}
window.AirevoSite={render,toast,load};
render();
})();