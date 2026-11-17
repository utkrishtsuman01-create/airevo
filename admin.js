(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const db=()=>window.airevoSupabase,esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN');
function notify(msg){window.AirevoSite?.toast(msg)||alert(msg)}
function panelError(e){return '<div class="admin-panel"><h3>Could not load this section</h3><p>'+esc(e?.message||e)+'</p></div>'}
function setTab(tab){$$('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));loadTab(tab)}
function mountDashboard(){
 const main=$('#app main');if(!main)return;
 const old=$('.auth-shell',main);if(old)old.remove();
 let host=$('.admin-shell',main);
 if(!host){
  main.insertAdjacentHTML('beforeend','<section class="section"><div class="container admin-shell"><aside class="admin-nav" id="admin-nav"><div class="admin-nav-label">STORE MANAGEMENT</div><button class="active" data-admin-tab="overview">Overview</button><button data-admin-tab="products">Products & variants</button><button data-admin-tab="categories">Categories</button><button data-admin-tab="collections">Collections</button><button data-admin-tab="orders">Orders & billing</button><button data-admin-tab="reviews">Reviews</button><button data-admin-tab="blogs">Blog posts</button><button data-admin-tab="inquiries">Enquiries</button><button data-admin-tab="access">Admin access</button><button id="admin-signout">Sign out</button></aside><div class="admin-main" id="admin-main"><div class="boot-screen"><span class="boot-mark">A</span><span>Loading dashboard…</span></div></div></div></section>');
 }
 $('#admin-nav').onclick=e=>{const b=e.target.closest('[data-admin-tab]');if(b)setTab(b.dataset.adminTab)};
 $('#admin-signout').onclick=async()=>{await db().auth.signOut();location.href='/admin'};
 loadTab('overview');
}
async function verify(){
 const s=db();if(!s)return false;
 const {data:{session}}=await s.auth.getSession();if(!session)return false;
 const {data,error}=await s.from('user_roles').select('role').eq('user_id',session.user.id).maybeSingle();
 if(error)throw error;
 return data?.role==='admin';
}
async function loadTab(tab){
 const s=db(),host=$('#admin-main');if(!host)return;
 host.innerHTML='<div class="boot-screen"><span class="boot-mark">A</span><span>Loading '+esc(tab)+'…</span></div>';
 try{
  if(tab==='overview')await overview(s,host);
  if(tab==='products')await products(s,host);
  if(tab==='categories')await categories(s,host);
  if(tab==='collections')await collections(s,host);
  if(tab==='orders')await orders(s,host);
  if(tab==='reviews')await reviews(s,host);
  if(tab==='blogs')await blogs(s,host);
  if(tab==='inquiries')await inquiries(s,host);
  if(tab==='access')await accessRequests(s,host);
 }catch(e){host.innerHTML=panelError(e)}
}
async function count(s,table,filter){
 let q=s.from(table).select('id',{count:'exact',head:true});if(filter)q=filter(q);const r=await q;if(r.error)throw r.error;return r.count||0;
}
async function overview(s,host){
 const [p,o,r,i,b,a]=await Promise.all([
 count(s,'products'),count(s,'orders'),count(s,'reviews',q=>q.eq('is_approved',false)),
 count(s,'contact_inquiries',q=>q.eq('status','new')),count(s,'blog_posts'),count(s,'admin_access_requests',q=>q.eq('status','pending'))
 ]);
 const {data:low,error}=await s.from('products').select('id,name,stock_qty,low_stock_threshold').eq('is_active',true).order('stock_qty').limit(7);if(error)throw error;
 host.innerHTML='<div class="admin-stats">'+[['Products',p],['Orders',o],['Pending reviews',r],['New enquiries',i],['Blog posts',b],['Admin requests',a]].map(x=>'<div class="admin-stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('')+'</div>'+
 '<div class="admin-panel"><h3>Store overview</h3><p>Manage products and variants, inventory, categories, orders, customer reviews and editorial content from this private workspace.</p><div class="admin-shortcuts"><button data-admin-tab="products">Manage products</button><button data-admin-tab="orders">View orders</button><button data-admin-tab="reviews">Moderate reviews</button><button data-admin-tab="access">Admin access requests</button></div></div>'+
 '<div class="admin-panel"><h3>Low-stock watch</h3>'+(low?.length?'<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Stock left</th><th>Alert at</th><th>Status</th></tr></thead><tbody>'+low.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.stock_qty+'</td><td>'+x.low_stock_threshold+'</td><td>'+(x.stock_qty<=x.low_stock_threshold?'<span class="stock-low">Low stock</span>':'Healthy')+'</td></tr>').join('')+'</tbody></table></div>':'<p>No stock records yet.</p>')+'</div>'+
 '<div class="demo-note">This Airevo demo uses sample products, indicative prices and sample stock levels. Replace them with the client-approved catalogue before live orders.</div>';
 host.onclick=e=>{const b=e.target.closest('[data-admin-tab]');if(b)setTab(b.dataset.adminTab)};
}
function adminFormField(label,name,value,type='text',opts={}){
 const safe=esc(value??'');
 if(type==='textarea')return '<div class="field '+(opts.full?'full':'')+'"><label>'+label+'</label><textarea name="'+name+'" '+(opts.required?'required':'')+'>'+safe+'</textarea></div>';
 if(type==='checkbox')return '<div class="field"><label><input type="checkbox" name="'+name+'" '+(value?'checked':'')+'> '+label+'</label></div>';
 if(type==='select')return '<div class="field"><label>'+label+'</label><select name="'+name+'">'+(opts.options||[]).map(o=>'<option value="'+esc(o.value)+'" '+(String(o.value)===String(value)?'selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select></div>';
 return '<div class="field '+(opts.full?'full':'')+'"><label>'+label+'</label><input name="'+name+'" type="'+type+'" value="'+safe+'" '+(opts.required?'required':'')+' '+(opts.step?'step="'+opts.step+'"':'')+' '+(opts.min!==undefined?'min="'+opts.min+'"':'')+'></div>';
}
async function products(s,host){
 const r=await s.from('products').select('*,categories(name),product_variants(*)').order('created_at',{ascending:false});if(r.error)throw r.error;
 const list=r.data||[];
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Products & variants</h3><p>Up to five images per product or variant, stock, pricing, dimensions and shipping weights.</p></div><button class="btn" id="product-new">Add product</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>MRP</th><th>Sale price</th><th>Stock</th><th>Variants</th><th>Status</th><th>Action</th></tr></thead><tbody>'+list.map(p=>'<tr><td>'+esc(p.name)+'<br><small>'+esc(p.sku||'')+'</small></td><td>'+esc(p.categories?.name||'')+'</td><td>'+money(p.mrp)+'</td><td>'+money(p.sale_price)+'</td><td>'+p.stock_qty+'</td><td>'+((p.product_variants||[]).length)+'</td><td>'+ (p.is_active?'Active':'Draft')+'</td><td><button data-product-edit="'+p.id+'">Edit</button> <button data-product-variants="'+p.id+'">Variants</button> <button data-product-delete="'+p.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div></div><div class="admin-panel" id="product-editor" hidden></div><div class="admin-panel" id="variant-editor" hidden></div>';
 $('#product-new').onclick=()=>editProduct(s,null);
 $$('[data-product-edit]').forEach(b=>b.onclick=()=>editProduct(s,list.find(p=>p.id===b.dataset.productEdit)));
 $('[data-product-variants]').forEach(b=>b.onclick=()=>editVariants(s,list.find(p=>p.id===b.dataset.productVariants)));
 $('[data-product-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this product and its variants permanently?'))return;const {error}=await s.from('products').delete().eq('id',b.dataset.productDelete);if(error){notify(error.message);return}notify('Product deleted');await products(s,host)});
}
async function uploadImages(s,files){
 const urls=[];for(const file of Array.from(files).slice(0,5)){
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase(),path='products/'+crypto.randomUUID()+'.'+ext;
  const {error}=await s.storage.from('airevo-products').upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});
  if(error)throw error;
  const {data}=s.storage.from('airevo-products').getPublicUrl(path);urls.push(data.publicUrl);
 }
 return urls;
}
async function editProduct(s,p){
 const box=$('#product-editor');box.hidden=false;box.scrollIntoView({behavior:'smooth',block:'start'});
 const cr=await s.from('categories').select('id,name').order('sort_order');if(cr.error){box.innerHTML=panelError(cr.error);return}
 const categories=cr.data||[];
 box.innerHTML='<h3>'+(p?'Edit product':'Add new product')+'</h3><form id="product-form"><div class="admin-form-grid">'+
 adminFormField('Product name','name',p?.name,'text',{required:true})+adminFormField('URL slug','slug',p?.slug,'text',{required:true})+
 adminFormField('Category','category_id',p?.category_id||categories[0]?.id,'select',{options:categories.map(c=>({value:c.id,label:c.name}))})+
 adminFormField('SKU / model number','sku',p?.sku||'')+
 adminFormField('MRP (₹)','mrp',p?.mrp||0,'number',{step:'0.01',min:0})+adminFormField('Discounted price (₹)','sale_price',p?.sale_price||0,'number',{step:'0.01',min:0})+
 adminFormField('Stock remaining','stock_qty',p?.stock_qty||0,'number',{min:0})+adminFormField('Low-stock alert','low_stock_threshold',p?.low_stock_threshold??3,'number',{min:0})+
 adminFormField('Short description','short_description',p?.short_description||'','textarea',{full:true})+
 adminFormField('Full description','description',p?.description||'','textarea',{full:true})+
 adminFormField('Existing image URLs (up to five; one per line)','image_urls',(p?.image_urls||[]).join('\n'),'textarea',{full:true})+
 '<div class="field full"><label>Or upload up to five product images</label><input type="file" name="image_files" accept="image/jpeg,image/png,image/webp,image/avif" multiple><small>Uploads are stored in the Airevo product image bucket. Max five images total.</small></div>'+
 adminFormField('Product weight (kg)','weight_kg',p?.weight_kg??'','number',{step:'0.001',min:0})+
 adminFormField('Package / shipping weight (kg)','package_weight_kg',p?.package_weight_kg??'','number',{step:'0.001',min:0})+
 adminFormField('Product height (cm)','height_cm',p?.height_cm??'','number',{step:'0.01',min:0})+
 adminFormField('Product width (cm)','width_cm',p?.width_cm??'','number',{step:'0.01',min:0})+
 adminFormField('Product depth (cm)','depth_cm',p?.depth_cm??'','number',{step:'0.01',min:0})+
 adminFormField('Package height (cm)','package_height_cm',p?.package_height_cm??'','number',{step:'0.01',min:0})+
 adminFormField('Package width (cm)','package_width_cm',p?.package_width_cm??'','number',{step:'0.01',min:0})+
 adminFormField('Package depth (cm)','package_depth_cm',p?.package_depth_cm??'','number',{step:'0.01',min:0})+
 adminFormField('Active on storefront','is_active',p?.is_active??true,'checkbox')+
 adminFormField('Trending product','is_trending',p?.is_trending??false,'checkbox')+
 adminFormField('Popular product','is_popular',p?.is_popular??false,'checkbox')+
 adminFormField('Featured on homepage','is_featured',p?.is_featured??false,'checkbox')+
 '</div><div class="hero-buttons"><button class="btn" type="submit">Save product</button><button class="btn dark" type="button" id="product-editor-close">Close</button></div></form>';
 $('#product-editor-close').onclick=()=>box.hidden=true;
 $('#product-form').onsubmit=async e=>{
  e.preventDefault();const f=e.target,fd=new FormData(f),button=$('button[type=submit]',f);button.disabled=true;button.textContent='Saving…';
  try{
   let imageUrls=String(fd.get('image_urls')||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,5);
   const files=f.elements.image_files.files;if(files.length){const uploaded=await uploadImages(s,files);imageUrls=[...uploaded,...imageUrls].slice(0,5)}
   const num=n=>fd.get(n)===''||fd.get(n)===null?null:Number(fd.get(n));
   const payload={
    name:fd.get('name').trim(),slug:fd.get('slug').trim(),category_id:fd.get('category_id')||null,
    sku:fd.get('sku').trim()||null,model_number:fd.get('sku').trim()||null,
    short_description:fd.get('short_description'),description:fd.get('description'),
    mrp:Number(fd.get('mrp')||0),sale_price:Number(fd.get('sale_price')||0),
    stock_qty:Number(fd.get('stock_qty')||0),low_stock_threshold:Number(fd.get('low_stock_threshold')||3),
    image_urls:imageUrls,weight_kg:num('weight_kg'),package_weight_kg:num('package_weight_kg'),
    height_cm:num('height_cm'),width_cm:num('width_cm'),depth_cm:num('depth_cm'),
    package_height_cm:num('package_height_cm'),package_width_cm:num('package_width_cm'),package_depth_cm:num('package_depth_cm'),
    is_active:fd.has('is_active'),is_trending:fd.has('is_trending'),is_popular:fd.has('is_popular'),is_featured:fd.has('is_featured'),
    updated_at:new Date().toISOString()
   };
   const q=p?await s.from('products').update(payload).eq('id',p.id):await s.from('products').insert(payload);
   if(q.error)throw q.error;notify('Product saved');await products(s,$('#admin-main'));
  }catch(err){notify(err.message||String(err))}finally{button.disabled=false;button.textContent='Save product'}
 };
}
async function editVariants(s,p){
 const box=$('#variant-editor');box.hidden=false;box.scrollIntoView({behavior:'smooth',block:'start'});
 const r=await s.from('product_variants').select('*').eq('product_id',p.id).order('sort_order');if(r.error){box.innerHTML=panelError(r.error);return}
 const list=r.data||[];
 box.innerHTML='<h3>Variants — '+esc(p.name)+'</h3><p>Separate size, finish or model options. Each variant has its own stock, price, shipping dimensions and up to five images.</p>'+
 '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Variant</th><th>SKU</th><th>MRP</th><th>Sale</th><th>Stock</th><th></th></tr></thead><tbody>'+list.map(v=>'<tr><td>'+esc(v.name)+'</td><td>'+esc(v.sku||'')+'</td><td>'+money(v.mrp)+'</td><td>'+money(v.sale_price)+'</td><td>'+v.stock_qty+'</td><td><button data-variant-edit="'+v.id+'">Edit</button> <button data-variant-delete="'+v.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div>'+
 '<form id="variant-form" class="admin-form-grid"><h4 class="field full">Add variant</h4>'+adminFormField('Variant name','name','','text',{required:true})+adminFormField('SKU','sku','')+
 adminFormField('MRP (₹)','mrp',0,'number',{step:'0.01',min:0})+adminFormField('Discounted price (₹)','sale_price',0,'number',{step:'0.01',min:0})+
 adminFormField('Stock','stock_qty',0,'number',{min:0})+adminFormField('Net weight (kg)','weight_kg','','number',{step:'0.001',min:0})+
 adminFormField('Package weight (kg)','package_weight_kg','','number',{step:'0.001',min:0})+
 adminFormField('Height (cm)','height_cm','','number',{step:'0.01',min:0})+adminFormField('Width (cm)','width_cm','','number',{step:'0.01',min:0})+adminFormField('Depth (cm)','depth_cm','','number',{step:'0.01',min:0})+
 adminFormField('Image URLs (up to five, one per line)','image_urls','','textarea',{full:true})+
 '<div class="field full"><button class="btn" type="submit">Add variant</button></div></form><button class="btn dark" id="variant-close" type="button">Close</button>';
 $('#variant-close').onclick=()=>box.hidden=true;
 $('#variant-form').onsubmit=async e=>{
  e.preventDefault();const fd=new FormData(e.target);
  const payload={product_id:p.id,name:fd.get('name').trim(),sku:fd.get('sku').trim()||null,mrp:Number(fd.get('mrp')||0),sale_price:Number(fd.get('sale_price')||0),stock_qty:Number(fd.get('stock_qty')||0),weight_kg:fd.get('weight_kg')?Number(fd.get('weight_kg')):null,package_weight_kg:fd.get('package_weight_kg')?Number(fd.get('package_weight_kg')):null,height_cm:fd.get('height_cm')?Number(fd.get('height_cm')):null,width_cm:fd.get('width_cm')?Number(fd.get('width_cm')):null,depth_cm:fd.get('depth_cm')?Number(fd.get('depth_cm')):null,image_urls:String(fd.get('image_urls')||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,5)};
  const q=await s.from('product_variants').insert(payload);if(q.error){notify(q.error.message);return}notify('Variant added');await editVariants(s,p);
 };
 $('[data-variant-edit]').forEach(b=>b.onclick=async()=>{
  const v=list.find(x=>x.id===b.dataset.variantEdit);const name=prompt('Variant name',v.name);if(name===null)return;
  const sku=prompt('SKU',v.sku||'');if(sku===null)return;
  const stock=prompt('Stock quantity',String(v.stock_qty));if(stock===null)return;
  const {error}=await s.from('product_variants').update({name,sku:sku||null,stock_qty:Math.max(0,Number(stock)||0)}).eq('id',v.id);
  if(error)notify(error.message);else{notify('Variant updated');await editVariants(s,p)}
 });
 $('[data-variant-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this variant?'))return;const {error}=await s.from('product_variants').delete().eq('id',b.dataset.variantDelete);if(error){notify(error.message);return}notify('Variant deleted');await editVariants(s,p)});
}
async function categories(s,host){
 const r=await s.from('categories').select('*').order('sort_order');if(r.error)throw r.error;const list=r.data||[];
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Categories</h3><p>Manage the appliance types in the hover menu and category pages.</p></div><button class="btn" id="category-new">Add category</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Active</th><th>Sort</th><th></th></tr></thead><tbody>'+list.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.slug)+'</td><td>'+c.is_active+'</td><td>'+c.sort_order+'</td><td><button data-category-edit="'+c.id+'">Edit</button> <button data-category-delete="'+c.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div></div><div id="category-editor" class="admin-panel" hidden></div>';
 $('#category-new').onclick=()=>categoryForm(s,null);
 $('[data-category-edit]').forEach(b=>b.onclick=()=>categoryForm(s,list.find(x=>x.id===b.dataset.categoryEdit)));
 $('[data-category-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this category? Products will remain but become uncategorised.'))return;const {error}=await s.from('categories').delete().eq('id',b.dataset.categoryDelete);if(error){notify(error.message);return}notify('Category deleted');await categories(s,host)});
}
async function categoryForm(s,c){
 const box=$('#category-editor');box.hidden=false;box.innerHTML='<h3>'+(c?'Edit':'Add')+' category</h3><form id="category-form" class="admin-form-grid">'+
 adminFormField('Name','name',c?.name||'','text',{required:true})+adminFormField('Slug','slug',c?.slug||'','text',{required:true})+
 adminFormField('Description','description',c?.description||'','textarea',{full:true})+adminFormField('Image URL','image_url',c?.image_url||'','text',{full:true})+
 adminFormField('Sort order','sort_order',c?.sort_order??0,'number')+adminFormField('Active','is_active',c?.is_active??true,'checkbox')+
 '<div class="field full"><button class="btn">Save category</button></div></form>';
 $('#category-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),data={name:f.get('name'),slug:f.get('slug'),description:f.get('description'),image_url:f.get('image_url')||null,sort_order:Number(f.get('sort_order')||0),is_active:f.has('is_active')};const q=c?await s.from('categories').update(data).eq('id',c.id):await s.from('categories').insert(data);if(q.error){notify(q.error.message);return}notify('Category saved');await categories(s,$('#admin-main'))};
}
async function collections(s,host){
 const [cr,pr]=await Promise.all([s.from('collections').select('*,collection_products(product_id)').order('sort_order'),s.from('products').select('id,name,is_trending,is_popular,is_featured').order('name')]);
 if(cr.error)throw cr.error;if(pr.error)throw pr.error;
 host.innerHTML='<div class="admin-panel"><h3>Collections</h3><p>Choose products to surface in Trending, Popular and Featured sections.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Collection</th><th>Products</th><th>Active</th></tr></thead><tbody>'+(cr.data||[]).map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+((c.collection_products||[]).length)+'</td><td>'+c.is_active+'</td></tr>').join('')+'</tbody></table></div></div><div class="admin-panel"><h3>Product merchandising</h3>'+pr.data.map(p=>'<label class="admin-flag"><strong>'+esc(p.name)+'</strong><span><input type="checkbox" data-flag-product="'+p.id+'" data-flag="is_trending" '+(p.is_trending?'checked':'')+'> Trending</span><span><input type="checkbox" data-flag-product="'+p.id+'" data-flag="is_popular" '+(p.is_popular?'checked':'')+'> Popular</span><span><input type="checkbox" data-flag-product="'+p.id+'" data-flag="is_featured" '+(p.is_featured?'checked':'')+'> Featured</span></label>').join('')+'</div>';
 $$('[data-flag-product]').forEach(el=>el.onchange=async()=>{const patch={};patch[el.dataset.flag]=el.checked;const {error}=await s.from('products').update(patch).eq('id',el.dataset.flagProduct);if(error){notify(error.message);el.checked=!el.checked}else notify('Merchandising choice saved')});
}
async function orders(s,host){
 const r=await s.from('orders').select('*,order_items(*)').order('created_at',{ascending:false});if(r.error)throw r.error;const data=r.data||[];
 host.innerHTML='<div class="admin-panel"><h3>Orders & billing</h3><p>Update the order and payment state, view customer/order details and print a bill.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Order status</th><th>Payment</th><th></th></tr></thead><tbody>'+data.map(o=>'<tr><td>'+esc(o.order_number)+'</td><td>'+esc(o.customer_name)+'<br><small>'+esc(o.customer_email)+'</small><br><small>'+esc(o.customer_phone)+'</small></td><td>'+new Date(o.created_at).toLocaleDateString('en-IN')+'</td><td>'+money(o.grand_total)+'</td><td><select data-order-status="'+o.id+'">'+['pending','confirmed','processing','shipped','delivered','cancelled','refunded'].map(x=>'<option '+(o.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></td><td><select data-pay-status="'+o.id+'">'+['pending','paid','failed','refunded','cod'].map(x=>'<option '+(o.payment_status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></td><td><button data-print="'+o.id+'">Print bill</button></td></tr>').join('')+'</tbody></table></div></div>';
 $$('[data-order-status],[data-pay-status]').forEach(el=>el.onchange=async()=>{const payload=el.dataset.orderStatus?{status:el.value}:{payment_status:el.value};const {error}=await s.from('orders').update(payload).eq('id',el.dataset.orderStatus||el.dataset.payStatus);notify(error?.message||'Order status updated')});
 $$('[data-print]').forEach(b=>b.onclick=()=>printBill(data.find(o=>o.id===b.dataset.print)));
}
function printBill(o){
 const rows=(o.order_items||[]).map(x=>'<tr><td>'+esc(x.product_name)+' '+esc(x.variant_name||'')+'</td><td>'+x.quantity+'</td><td>'+money(x.unit_price)+'</td><td>'+money(x.line_total)+'</td></tr>').join('');
 const w=window.open('','_blank','width=850,height=900');if(!w){notify('Allow pop-ups to print the bill');return}
 w.document.write('<!doctype html><html><head><title>Bill '+esc(o.order_number)+'</title><style>body{font:14px Arial;padding:35px;color:#111}table{width:100%;border-collapse:collapse;margin-top:25px}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}.total{text-align:right;font-size:21px;font-weight:bold;margin-top:25px}.muted{color:#666;font-size:11px}</style></head><body><h1>AIRÉVO</h1><small>PREMIUM KITCHEN LIVING</small><h2>Order bill / receipt</h2><p><b>Order:</b> '+esc(o.order_number)+'<br><b>Date:</b> '+new Date(o.created_at).toLocaleString('en-IN')+'<br><b>Status:</b> '+esc(o.status)+'</p><p><b>Customer:</b> '+esc(o.customer_name)+'<br>'+esc(o.customer_email)+'<br>'+esc(o.customer_phone)+'</p><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>'+rows+'</tbody></table><div class="total">Total: '+money(o.grand_total)+'</div><p>Payment status: '+esc(o.payment_status)+'</p><p class="muted">Demo invoice. Configure seller, GST and statutory invoice information before production billing.</p><script>window.onload=function(){window.print()}</script></body></html>');w.document.close();
}
async function reviews(s,host){
 const r=await s.from('reviews').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;const data=r.data||[];
 host.innerHTML='<div class="admin-panel"><h3>Review moderation</h3><p>Only approved five-star reviews are shown on the public homepage and reviews page. Other ratings remain private and can be removed by an administrator.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Approved</th><th></th></tr></thead><tbody>'+data.map(x=>'<tr><td>'+esc(x.customer_name)+'</td><td>'+x.rating+'/5</td><td>'+esc(x.body)+'</td><td>'+new Date(x.created_at).toLocaleDateString('en-IN')+'</td><td>'+x.is_approved+'</td><td>'+(x.rating===5?'<button data-review-toggle="'+x.id+'">'+(x.is_approved?'Unpublish':'Approve')+'</button>':'')+' <button data-review-remove="'+x.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div></div>';
 $$('[data-review-toggle]').forEach(b=>b.onclick=async()=>{const x=data.find(r=>r.id===b.dataset.reviewToggle);const {error}=await s.from('reviews').update({is_approved:!x.is_approved,reviewed_at:new Date().toISOString()}).eq('id',x.id);notify(error?.message||'Review updated');await reviews(s,host)});
 $$('[data-review-remove]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this review permanently?'))return;const {error}=await s.from('reviews').delete().eq('id',b.dataset.reviewRemove);notify(error?.message||'Review deleted');await reviews(s,host)});
}
async function blogs(s,host){
 const r=await s.from('blog_posts').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;const data=r.data||[];
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Blog posts</h3><p>Create, edit, publish or archive Airevo buying guides.</p></div><button class="btn" id="blog-new">Add article</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Last update</th><th></th></tr></thead><tbody>'+data.map(b=>'<tr><td>'+esc(b.title)+'</td><td>'+esc(b.slug)+'</td><td>'+esc(b.status)+'</td><td>'+new Date(b.updated_at||b.created_at).toLocaleDateString('en-IN')+'</td><td><button data-blog-edit="'+b.id+'">Edit</button></td></tr>').join('')+'</tbody></table></div></div><div class="admin-panel" id="blog-editor" hidden></div>';
 $('#blog-new').onclick=()=>blogForm(s,null);$$('[data-blog-edit]').forEach(b=>b.onclick=()=>blogForm(s,data.find(x=>x.id===b.dataset.blogEdit)));
}
async function blogForm(s,b){
 const box=$('#blog-editor');box.hidden=false;box.innerHTML='<h3>'+(b?'Edit article':'New article')+'</h3><form id="blog-form" class="admin-form-grid">'+adminFormField('Title','title',b?.title||'','text',{required:true})+adminFormField('Slug','slug',b?.slug||'','text',{required:true})+adminFormField('Excerpt','excerpt',b?.excerpt||'','textarea',{full:true})+adminFormField('Article content','content',b?.content||'','textarea',{full:true})+adminFormField('Cover image URL','cover_image_url',b?.cover_image_url||'','text',{full:true})+adminFormField('Status','status',b?.status||'draft','select',{options:[{value:'draft',label:'Draft'},{value:'published',label:'Published'},{value:'archived',label:'Archived'}]})+'<div class="field full"><button class="btn">Save article</button></div></form>';
 $('#blog-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),status=f.get('status'),payload={title:f.get('title'),slug:f.get('slug'),excerpt:f.get('excerpt'),content:f.get('content'),cover_image_url:f.get('cover_image_url')||null,status,published_at:status==='published'?(b?.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};const q=b?await s.from('blog_posts').update(payload).eq('id',b.id):await s.from('blog_posts').insert(payload);if(q.error){notify(q.error.message);return}notify('Article saved');await blogs(s,$('#admin-main'))};
}
async function inquiries(s,host){
 const r=await s.from('contact_inquiries').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;const data=r.data||[];
 host.innerHTML='<div class="admin-panel"><h3>Customer enquiries</h3><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Contact</th><th>Subject</th><th>Message</th><th>Status</th></tr></thead><tbody>'+data.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.email)+'<br>'+esc(x.phone)+'</td><td>'+esc(x.subject)+'</td><td>'+esc(x.message)+'</td><td><select data-inquiry="'+x.id+'">'+['new','contacted','closed'].map(v=>'<option '+(x.status===v?'selected':'')+'>'+v+'</option>').join('')+'</select></td></tr>').join('')+'</tbody></table></div></div>';
 $$('[data-inquiry]').forEach(el=>el.onchange=async()=>{const {error}=await s.from('contact_inquiries').update({status:el.value}).eq('id',el.dataset.inquiry);notify(error?.message||'Enquiry updated')});
}
async function accessRequests(s,host){
 const r=await s.from('admin_access_requests').select('*').order('requested_at',{ascending:false});if(r.error)throw r.error;const data=r.data||[];
 host.innerHTML='<div class="admin-panel"><h3>Admin access requests</h3><p>Only existing administrators can approve new administrators. Email verification is required before access is granted.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Email</th><th>Status</th><th>Requested</th><th>Action</th></tr></thead><tbody>'+data.map(x=>'<tr><td>'+esc(x.email)+'</td><td>'+esc(x.status)+'</td><td>'+new Date(x.requested_at).toLocaleDateString('en-IN')+'</td><td>'+(x.status==='pending'?'<button data-admin-approve="'+x.user_id+'">Approve admin</button> <button data-admin-reject="'+x.user_id+'">Reject</button>':'—')+'</td></tr>').join('')+'</tbody></table></div></div>';
 $$('[data-admin-approve]').forEach(b=>b.onclick=async()=>{const userId=b.dataset.adminApprove;const {data:user,error:userErr}=await s.from('profiles').select('email').eq('id',userId).maybeSingle();if(userErr||!user){notify(userErr?.message||'User not found');return}const {error}=await s.from('user_roles').upsert({user_id:userId,role:'admin'},{onConflict:'user_id'});if(error){notify(error.message);return}const {error:reqErr}=await s.from('admin_access_requests').update({status:'approved',reviewed_at:new Date().toISOString()}).eq('user_id',userId);notify(reqErr?.message||'Administrator access approved');await accessRequests(s,host)});
 $$('[data-admin-reject]').forEach(b=>b.onclick=async()=>{const {error}=await s.from('admin_access_requests').update({status:'rejected',reviewed_at:new Date().toISOString()}).eq('user_id',b.dataset.adminReject);notify(error?.message||'Admin request rejected');await accessRequests(s,host)});
}
async function categoriesAndAdmin(){}
async function render(){
 const ok=await verify().catch(e=>{const el=$('#admin-auth-status');if(el){el.textContent=e.message;el.className='status-message show error'}return false});
 if(!ok){if(!$('#admin-auth-form'))location.reload();return}
 mountDashboard();
}
window.AirevoAdmin={render,verify};
})();