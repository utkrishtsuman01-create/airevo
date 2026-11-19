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
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Products & variants</h3><p>Up to five images per product or variant, stock, pricing, dimensions and shipping weights.</p></div><button class="btn" id="product-new">Add product</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>MRP</th><th>Sale price</th><th>Stock</th><th>Variants</th><th>Status</th><th>Action</th></tr></thead><tbody>'+list.map(p=>'<tr><td>'+esc(p.name)+'<br><small>'+esc(p.sku||'')+'</small></td><td>'+esc(p.categories?.name||'')+'</td><td>'+money(p.mrp)+'</td><td>'+money(p.sale_price)+'</td><td>'+p.stock_qty+'</td><td>'+((p.product_variants||[]).length)+'</td><td>'+ (p.is_active?'Active':'Draft')+'</td><td><button data-product-edit="'+p.id+'">Edit</button> <button data-product-variants="'+p.id+'">Variants</button> <button data-product-delete="'+p.id+'">Hide</button></td></tr>').join('')+'</tbody></table></div></div><div class="admin-panel" id="product-editor" hidden></div><div class="admin-panel" id="variant-editor" hidden></div>';
 $('#product-new').onclick=()=>editProduct(s,null);
 $$('[data-product-edit]').forEach(b=>b.onclick=()=>editProduct(s,list.find(p=>p.id===b.dataset.productEdit)));
 $$('[data-product-variants]').forEach(b=>b.onclick=()=>editVariants(s,list.find(p=>p.id===b.dataset.productVariants)));
 $$('[data-product-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Hide this product from the storefront? Previous order history will be preserved.'))return;const {error}=await s.from('products').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',b.dataset.productDelete);if(error){notify(error.message);return}notify('Product hidden from storefront; order history is preserved');await products(s,host)});
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
 const field=(label,name,value,type='text',opts={})=>adminFormField(label,name,value,type,opts);
 const renderForm=(v=null)=>{
  box.querySelector('#variant-edit-form')?.remove();
  const form=document.createElement('div');form.id='variant-edit-form';form.className='admin-panel';
  form.innerHTML='<h4>'+(v?'Edit variant':'Add variant')+'</h4><form id="variant-form"><div class="admin-form-grid">'+
   field('Variant name','name',v?.name||'','text',{required:true})+
   field('SKU','sku',v?.sku||'')+
   field('Model number','model_number',v?.model_number||'')+
   field('MRP (₹)','mrp',v?.mrp??0,'number',{step:'0.01',min:0})+
   field('Discounted price (₹)','sale_price',v?.sale_price??0,'number',{step:'0.01',min:0})+
   field('Stock quantity','stock_qty',v?.stock_qty??0,'number',{min:0})+
   field('Net weight (kg)','weight_kg',v?.weight_kg??'','number',{step:'0.001',min:0})+
   field('Package / shipping weight (kg)','package_weight_kg',v?.package_weight_kg??'','number',{step:'0.001',min:0})+
   field('Product height (cm)','height_cm',v?.height_cm??'','number',{step:'0.01',min:0})+
   field('Product width (cm)','width_cm',v?.width_cm??'','number',{step:'0.01',min:0})+
   field('Product depth (cm)','depth_cm',v?.depth_cm??'','number',{step:'0.01',min:0})+
   field('Package height (cm)','package_height_cm',v?.package_height_cm??'','number',{step:'0.01',min:0})+
   field('Package width (cm)','package_width_cm',v?.package_width_cm??'','number',{step:'0.01',min:0})+
   field('Package depth (cm)','package_depth_cm',v?.package_depth_cm??'','number',{step:'0.01',min:0})+
   field('Image URLs (up to five, one per line)','image_urls',(v?.image_urls||[]).join('\n'),'textarea',{full:true})+
   '<div class="field full"><label>Or upload up to five variant images</label><input type="file" name="image_files" accept="image/jpeg,image/png,image/webp,image/avif" multiple><small>Images are stored in the Airevo product image bucket.</small></div>'+
   field('Active on storefront','is_active',v?.is_active??true,'checkbox')+
   field('Display order','sort_order',v?.sort_order??0,'number')+
   '</div><div class="hero-buttons"><button class="btn" type="submit">'+(v?'Save variant':'Add variant')+'</button><button class="btn dark" id="variant-cancel" type="button">Cancel</button></div></form>';
  box.appendChild(form);
  form.querySelector('#variant-cancel').onclick=()=>form.remove();
  form.querySelector('#variant-form').onsubmit=async e=>{
   e.preventDefault();
   const el=e.target,fd=new FormData(el),submit=el.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Saving…';
   try{
    let imageUrls=String(fd.get('image_urls')||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,5);
    const files=el.elements.image_files.files;
    if(files.length){const uploaded=await uploadImages(s,files);imageUrls=[...uploaded,...imageUrls].slice(0,5)}
    const num=n=>fd.get(n)===''||fd.get(n)===null?null:Number(fd.get(n));
    const payload={
     product_id:p.id,name:String(fd.get('name')||'').trim(),sku:String(fd.get('sku')||'').trim()||null,
     model_number:String(fd.get('model_number')||'').trim()||null,
     mrp:Number(fd.get('mrp')||0),sale_price:Number(fd.get('sale_price')||0),stock_qty:Number(fd.get('stock_qty')||0),
     weight_kg:num('weight_kg'),package_weight_kg:num('package_weight_kg'),
     height_cm:num('height_cm'),width_cm:num('width_cm'),depth_cm:num('depth_cm'),
     package_height_cm:num('package_height_cm'),package_width_cm:num('package_width_cm'),package_depth_cm:num('package_depth_cm'),
     image_urls:imageUrls,is_active:fd.has('is_active'),sort_order:Number(fd.get('sort_order')||0),
     updated_at:new Date().toISOString()
    };
    const q=v?await s.from('product_variants').update(payload).eq('id',v.id):await s.from('product_variants').insert(payload);
    if(q.error)throw q.error;
    notify(v?'Variant updated':'Variant added');await editVariants(s,p);
   }catch(err){notify(err.message||String(err))}
   finally{submit.disabled=false;submit.textContent=v?'Save variant':'Add variant'}
  };
 };
 box.innerHTML='<h3>Variants — '+esc(p.name)+'</h3><p>Manage size, finish and model options, individual pricing, availability, shipping dimensions and images.</p>'+
  '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Variant</th><th>SKU / model</th><th>MRP</th><th>Sale price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
  (list.length?list.map(v=>'<tr><td>'+esc(v.name)+'</td><td>'+esc(v.sku||v.model_number||'—')+'</td><td>'+money(v.mrp)+'</td><td>'+money(v.sale_price)+'</td><td>'+v.stock_qty+'</td><td>'+(v.is_active?'Active':'Hidden')+'</td><td><button data-variant-edit="'+v.id+'">Edit</button> <button data-variant-delete="'+v.id+'">Hide</button></td></tr>').join(''):'<tr><td colspan="7">No variants yet.</td></tr>')+
  '</tbody></table></div><div id="variant-form-mount"></div><div class="hero-buttons"><button class="btn" id="variant-new" type="button">Add variant</button><button class="btn dark" id="variant-close" type="button">Close</button></div>';
 const mount=()=>{const target=$('#variant-form-mount',box);const current=box.querySelector('#variant-edit-form');if(current)current.remove();renderForm(null)};
 $('#variant-new').onclick=mount;
 $('#variant-close').onclick=()=>box.hidden=true;
 $$('[data-variant-edit]',box).forEach(b=>b.onclick=()=>renderForm(list.find(v=>v.id===b.dataset.variantEdit)));
 $$('[data-variant-delete]',box).forEach(b=>b.onclick=async()=>{
  if(!confirm('Hide this variant from the storefront? Previous orders will be preserved.'))return;
  const {error}=await s.from('product_variants').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',b.dataset.variantDelete);
  if(error){notify(error.message);return}notify('Variant hidden from storefront; previous orders remain intact');await editVariants(s,p);
 });
}
async function categories(s,host){
 const r=await s.from('categories').select('*').order('sort_order');if(r.error)throw r.error;const list=r.data||[];
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Categories</h3><p>Manage the appliance types in the hover menu and category pages.</p></div><button class="btn" id="category-new">Add category</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Active</th><th>Sort</th><th></th></tr></thead><tbody>'+list.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.slug)+'</td><td>'+c.is_active+'</td><td>'+c.sort_order+'</td><td><button data-category-edit="'+c.id+'">Edit</button> <button data-category-delete="'+c.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div></div><div id="category-editor" class="admin-panel" hidden></div>';
 $('#category-new').onclick=()=>categoryForm(s,null);
 $$('[data-category-edit]').forEach(b=>b.onclick=()=>categoryForm(s,list.find(x=>x.id===b.dataset.categoryEdit)));
 $$('[data-category-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this category? Products will remain but become uncategorised.'))return;const {error}=await s.from('categories').delete().eq('id',b.dataset.categoryDelete);if(error){notify(error.message);return}notify('Category deleted');await categories(s,host)});
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
 const [cr,pr]=await Promise.all([
  s.from('collections').select('*,collection_products(collection_id,product_id,sort_order)').order('sort_order'),
  s.from('products').select('id,name,sku,is_active').order('name')
 ]);
 if(cr.error)throw cr.error;if(pr.error)throw pr.error;
 const list=cr.data||[],productsList=pr.data||[];
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Collections</h3><p>Create curated product groups, control their visibility and choose exactly which products appear in each collection.</p></div><button class="btn" id="collection-new" type="button">Add collection</button></div>'+
  '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Collection</th><th>Slug</th><th>Products</th><th>Visibility</th><th>Order</th><th>Actions</th></tr></thead><tbody>'+
  (list.length?list.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.slug)+'</td><td>'+((c.collection_products||[]).length)+'</td><td>'+(c.is_active?'Active':'Hidden')+'</td><td>'+c.sort_order+'</td><td><button data-collection-edit="'+c.id+'" type="button">Edit</button> <button data-collection-delete="'+c.id+'" type="button">Delete</button></td></tr>').join(''):'<tr><td colspan="6">No collections created yet.</td></tr>')+
  '</tbody></table></div></div><div id="collection-editor" class="admin-panel" hidden></div>';
 $('#collection-new').onclick=()=>editCollection(s,null,productsList);
 $$('[data-collection-edit]').forEach(b=>b.onclick=()=>editCollection(s,list.find(c=>c.id===b.dataset.collectionEdit),productsList));
 $$('[data-collection-delete]').forEach(b=>b.onclick=async()=>{
  const c=list.find(x=>x.id===b.dataset.collectionDelete);if(!c||!confirm('Delete the collection "'+c.name+'"? Its products will not be deleted.'))return;
  const {error}=await s.from('collections').delete().eq('id',c.id);if(error){notify(error.message);return}
  notify('Collection deleted');await collections(s,host);
 });
}
async function editCollection(s,c,productsList){
 const box=$('#collection-editor');box.hidden=false;box.scrollIntoView({behavior:'smooth',block:'start'});
 const assigned=new Set((c?.collection_products||[]).map(x=>x.product_id));
 box.innerHTML='<h3>'+(c?'Edit collection':'Create collection')+'</h3><form id="collection-form"><div class="admin-form-grid">'+
  adminFormField('Collection name','name',c?.name||'','text',{required:true})+
  adminFormField('URL slug','slug',c?.slug||'','text',{required:true})+
  adminFormField('Description','description',c?.description||'','textarea',{full:true})+
  adminFormField('Cover image URL','image_url',c?.image_url||'','text',{full:true})+
  adminFormField('Display order','sort_order',c?.sort_order??0,'number',{min:0})+
  adminFormField('Visible on storefront','is_active',c?.is_active??true,'checkbox')+
  '<div class="field full"><label>Products in this collection</label><div class="admin-product-picks">'+
  (productsList.length?productsList.map(p=>'<label class="admin-flag"><span><input type="checkbox" name="collection_product" value="'+p.id+'" '+(assigned.has(p.id)?'checked':'')+' '+(!p.is_active?'':'')+'> '+esc(p.name)+'</span><small>'+esc(p.sku||'')+(p.is_active?'':' · hidden product')+'</small></label>').join(''):'<p>No products are available. Add products first.</p>')+
  '</div></div></div><div class="hero-buttons"><button class="btn" type="submit">Save collection</button><button class="btn dark" id="collection-close" type="button">Close</button></div></form>';
 $('#collection-close').onclick=()=>box.hidden=true;
 $('#collection-form').onsubmit=async e=>{
  e.preventDefault();const form=e.target,fd=new FormData(form),submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;submit.textContent='Saving…';
  try{
   const payload={name:String(fd.get('name')||'').trim(),slug:String(fd.get('slug')||'').trim(),description:String(fd.get('description')||''),image_url:String(fd.get('image_url')||'').trim()||null,sort_order:Number(fd.get('sort_order')||0),is_active:fd.has('is_active')};
   let collectionId=c?.id;
   if(c){const {error}=await s.from('collections').update(payload).eq('id',c.id);if(error)throw error}
   else {const {data,error}=await s.from('collections').insert(payload).select('id').single();if(error)throw error;collectionId=data.id}
   const selected=Array.from(form.querySelectorAll('input[name="collection_product"]:checked')).map(x=>x.value);
   const old=(c?.collection_products||[]).map(x=>x.product_id);
   for(const id of old.filter(id=>!selected.includes(id))){
    const {error}=await s.from('collection_products').delete().eq('collection_id',collectionId).eq('product_id',id);if(error)throw error;
   }
   for(let i=0;i<selected.length;i++){
    if(old.includes(selected[i])){
     const {error}=await s.from('collection_products').update({sort_order:i}).eq('collection_id',collectionId).eq('product_id',selected[i]);if(error)throw error;
    }else{
     const {error}=await s.from('collection_products').insert({collection_id:collectionId,product_id:selected[i],sort_order:i});if(error)throw error;
    }
   }
   notify('Collection and product assignments saved');await collections(s,$('#admin-main'));
  }catch(err){notify(err.message||String(err))}
  finally{submit.disabled=false;submit.textContent='Save collection'}
 };
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
 host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Blog posts</h3><p>Create, edit, publish or archive Airevo buying guides.</p></div><button class="btn" id="blog-new">Add article</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Last update</th><th></th></tr></thead><tbody>'+data.map(b=>'<tr><td>'+esc(b.title)+'</td><td>'+esc(b.slug)+'</td><td>'+esc(b.status)+'</td><td>'+new Date(b.updated_at||b.created_at).toLocaleDateString('en-IN')+'</td><td><button data-blog-edit="'+b.id+'">Edit</button> <button data-blog-delete="'+b.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div></div><div class="admin-panel" id="blog-editor" hidden></div>';
 $('#blog-new').onclick=()=>blogForm(s,null);$$('[data-blog-edit]').forEach(b=>b.onclick=()=>blogForm(s,data.find(x=>x.id===b.dataset.blogEdit)));$$('[data-blog-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this article permanently?'))return;const {error}=await s.from('blog_posts').delete().eq('id',b.dataset.blogDelete);if(error){notify(error.message);return}notify('Article deleted');await blogs(s,host)});
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
function mountDemoDashboard(){
 const main=$('#app main');if(!main)return;
 const nav=$('#admin-nav'),host=$('#admin-main');if(!nav||!host)return;
 const KEY='airevo_demo_admin_workspace_v1';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const seed={
  categories:[
   {id:'cat-kitchen',name:'Kitchen Appliances',description:'Appliances for everyday cooking'},
   {id:'cat-home',name:'Home Care',description:'Cleaning and home-care essentials'},
   {id:'cat-personal',name:'Personal Care',description:'Personal grooming and wellness'},
   {id:'cat-smart',name:'Smart Living',description:'Connected home products'}
  ],
  products:[
   {id:'prd-1001',name:'Digital Air Fryer 5L',sku:'AR-AF-500',categoryId:'cat-kitchen',mrp:7999,price:6499,stock:2,lowStock:5,active:true,description:'A roomy air fryer for everyday family meals.',variants:[{id:'var-1001',name:'5 Litre · Black',sku:'AR-AF-500-BK',price:6499,stock:2},{id:'var-1002',name:'5 Litre · Silver',sku:'AR-AF-500-SL',price:6799,stock:4}]},
   {id:'prd-1002',name:'Electric Kettle 1.8L',sku:'AR-EK-180',categoryId:'cat-kitchen',mrp:1599,price:1299,stock:3,lowStock:5,active:true,description:'Fast-boil electric kettle with auto shut-off.',variants:[{id:'var-1003',name:'1.8 Litre · Stainless steel',sku:'AR-EK-180-SS',price:1299,stock:3}]},
   {id:'prd-1003',name:'Steam Iron Pro',sku:'AR-SI-220',categoryId:'cat-home',mrp:2799,price:2199,stock:14,lowStock:4,active:true,description:'A practical steam iron for daily garment care.',variants:[]}
  ],
  collections:[
   {id:'col-1',name:'Everyday essentials',description:'Useful appliances for daily routines.',active:true},
   {id:'col-2',name:'New arrivals',description:'Recently added products.',active:true},
   {id:'col-3',name:'Smart kitchen picks',description:'Thoughtful upgrades for the kitchen.',active:true}
  ],
  orders:[
   {id:'ARV-DEMO-1024',date:'2026-11-18',customer:'Aarav Mehta (sample)',items:'Air Fryer 5L × 1, Kettle × 1',total:7798,status:'Processing',payment:'Paid'},
   {id:'ARV-DEMO-1023',date:'2026-11-17',customer:'Mira Shah (sample)',items:'Electric Kettle × 1',total:1299,status:'Delivered',payment:'Paid'},
   {id:'ARV-DEMO-1022',date:'2026-11-16',customer:'Kabir Rao (sample)',items:'Steam Iron Pro × 1',total:2199,status:'Pending',payment:'Pending'}
  ],
  reviews:[
   {id:'rev-1',customer:'Sample customer A',product:'Digital Air Fryer 5L',rating:5,text:'Great product quality and quick delivery.',status:'Pending'},
   {id:'rev-2',customer:'Sample customer B',product:'Electric Kettle 1.8L',rating:4,text:'Works exactly as expected.',status:'Published'}
  ],
  blogs:[
   {id:'blog-1',title:'Choosing the right air fryer',slug:'choosing-the-right-air-fryer',excerpt:'A quick guide to capacity, controls and everyday use.',body:'Think about the number of people you cook for, the counter space available and the features you will use regularly.',status:'Published'},
   {id:'blog-2',title:'Everyday appliance care',slug:'everyday-appliance-care',excerpt:'Simple habits that help appliances stay in good shape.',body:'Read the product manual, keep vents clear and clean appliances only as recommended by the manufacturer.',status:'Draft'},
   {id:'blog-3',title:'A smarter kitchen',slug:'a-smarter-kitchen',excerpt:'Small upgrades that can make daily routines easier.',body:'Start with the tasks you repeat most often and choose appliances that fit your space and habits.',status:'Published'}
  ],
  inquiries:[
   {id:'inq-1',name:'Sample visitor A',email:'visitor-a@example.test',subject:'Product availability question',message:'Is the 5L air fryer available?',status:'New'},
   {id:'inq-2',name:'Sample visitor B',email:'visitor-b@example.test',subject:'Bulk purchase enquiry',message:'Please share details for a bulk purchase.',status:'In progress'}
  ]
 };
 let state;
 try{
  const stored=JSON.parse(localStorage.getItem(KEY)||'null');
  state=stored&&Array.isArray(stored.products)&&Array.isArray(stored.categories)?stored:clone(seed);
 }catch(_){state=clone(seed)}
 let tab='overview';
 const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
 const categoryName=id=>state.categories.find(x=>x.id===id)?.name||'Uncategorised';
 const save=message=>{
  try{localStorage.setItem(KEY,JSON.stringify(state));toast(message||'Demo changes saved in this browser.')}
  catch(e){toast('Could not save in this browser: '+e.message)}
 };
 const toast=message=>{
  let el=$('#demo-toast');
  if(!el){el=document.createElement('div');el.id='demo-toast';el.style.cssText='position:fixed;right:22px;bottom:22px;z-index:9999;background:#102534;color:#fff;padding:12px 16px;border-radius:10px;font-size:12px;box-shadow:0 8px 30px #0002';document.body.appendChild(el)}
  el.textContent=message;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',2800);
 };
 const field=(label,name,value,type,full,extra)=>{
  return '<div class="field'+(full?' full':'')+'"><label for="demo-'+name+'">'+label+'</label>'+
   (type==='textarea'?'<textarea id="demo-'+name+'" name="'+name+'" rows="4">'+esc(value||'')+'</textarea>':
   type==='select'?'<select id="demo-'+name+'" name="'+name+'">'+extra.map(o=>'<option value="'+esc(o.value)+'" '+(String(o.value)===String(value)?'selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select>':
   '<input id="demo-'+name+'" name="'+name+'" type="'+(type||'text')+'" value="'+esc(value??'')+'" '+(extra||'')+'>')+
  '</div>';
 };
 const table=(headers,rows)=>'<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+ (rows||'<tr><td colspan="'+headers.length+'">No records yet.</td></tr>')+'</tbody></table></div>';
 const button=(action,label,idValue,secondary)=>'<button type="button" data-action="'+action+'" data-id="'+esc(idValue||'')+'" '+(secondary?'class="secondary"':'')+'>'+label+'</button>';
 const actions=(items)=>'<div class="hero-buttons" style="gap:7px;flex-wrap:wrap">'+items+'</div>';
 const editor=(title,form)=>'<div class="admin-panel" id="demo-editor"><div class="admin-panel-head"><h3>'+title+'</h3>'+button('editor-close','Close')+'</div>'+form+'</div>';
 const setTab=next=>{
  tab=next;
  $$('#admin-nav [data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));
  render();
 };
 const renderOverview=()=>{
  const low=state.products.filter(p=>p.active&&Number(p.stock)<=Number(p.lowStock));
  const recent=state.orders.slice(0,4).map(o=>'<tr><td>'+esc(o.id)+'</td><td>'+esc(o.customer)+'</td><td>'+money(o.total)+'</td><td>'+esc(o.status)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-stats">'+[
   ['Products',state.products.length],['Orders',state.orders.length],['Pending reviews',state.reviews.filter(x=>x.status==='Pending').length],
   ['New enquiries',state.inquiries.filter(x=>x.status==='New').length],['Blog posts',state.blogs.length],['Low-stock items',low.length]
  ].map(x=>'<div class="admin-stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('')+'</div>'+
  '<div class="admin-panel"><div class="admin-panel-head"><div><h3>Store overview</h3><p>Manage the sample catalogue and day-to-day store activity from this workspace.</p></div>'+button('reset-demo','Reset demo data')+'</div>'+
  actions(button('go-tab','Manage products','products')+button('go-tab','View orders','orders')+button('go-tab','Write a blog post','blogs'))+'</div>'+
  '<div class="admin-panel"><h3>Recent orders</h3>'+table(['Order','Customer','Total','Status'],recent)+'</div>'+
  '<div class="admin-panel"><h3>Low-stock watch</h3>'+table(['Product','Stock left','Alert at','Status'],low.map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+p.stock+'</td><td>'+p.lowStock+'</td><td><span class="stock-low">Low stock</span></td></tr>').join('')||'<tr><td colspan="4">All sample products are above their low-stock threshold.</td></tr>')+'</div>';
 };
 const renderProducts=()=>{
  const rows=state.products.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><br><small>'+esc(p.sku)+'</small></td><td>'+esc(categoryName(p.categoryId))+'</td><td>'+money(p.price)+'</td><td>'+p.stock+'</td><td>'+(p.active?'Active':'Hidden')+'</td><td>'+p.variants.length+'</td><td>'+button('product-edit','Edit',p.id)+' '+button('variants-open','Variants',p.id,true)+' '+button('product-delete','Delete',p.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Products & variants</h3><p>Create, edit, hide and remove products in the demo catalogue.</p></div>'+button('product-add','Add product')+'</div>'+table(['Product','Category','Sale price','Stock','Status','Variants','Actions'],rows)+'</div>';
 };
 const renderCategories=()=>{
  const rows=state.categories.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong></td><td>'+esc(c.description)+'</td><td>'+state.products.filter(p=>p.categoryId===c.id).length+'</td><td>'+button('category-edit','Edit',c.id)+' '+button('category-delete','Delete',c.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Categories</h3><p>Organise products into useful storefront categories.</p></div>'+button('category-add','Add category')+'</div>'+table(['Category','Description','Products','Actions'],rows)+'</div>';
 };
 const renderCollections=()=>{
  const rows=state.collections.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong></td><td>'+esc(c.description)+'</td><td>'+(c.active?'Active':'Hidden')+'</td><td>'+button('collection-edit','Edit',c.id)+' '+button('collection-toggle',c.active?'Hide':'Publish',c.id,true)+' '+button('collection-delete','Delete',c.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Collections</h3><p>Create curated groups such as new arrivals and everyday essentials.</p></div>'+button('collection-add','Add collection')+'</div>'+table(['Collection','Description','Status','Actions'],rows)+'</div>';
 };
 const renderOrders=()=>{
  const rows=state.orders.map(o=>'<tr><td><strong>'+esc(o.id)+'</strong><br><small>'+esc(o.date)+'</small></td><td>'+esc(o.customer)+'</td><td>'+esc(o.items)+'</td><td>'+money(o.total)+'</td><td><select data-order-status="'+esc(o.id)+'">'+['Pending','Processing','Shipped','Delivered','Cancelled'].map(x=>'<option '+(x===o.status?'selected':'')+'>'+x+'</option>').join('')+'</select></td><td><select data-payment-status="'+esc(o.id)+'">'+['Pending','Paid','Failed','Refunded'].map(x=>'<option '+(x===o.payment?'selected':'')+'>'+x+'</option>').join('')+'</select></td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><h3>Orders & billing</h3><p>Change order and payment status to demonstrate the order workflow. All entries are sample records.</p>'+table(['Order','Customer','Items','Total','Order status','Payment'],rows)+'</div>';
 };
 const renderReviews=()=>{
  const rows=state.reviews.map(r=>'<tr><td>'+esc(r.customer)+'</td><td>'+esc(r.product)+'</td><td>'+('★'.repeat(Number(r.rating)||0))+'</td><td>'+esc(r.text)+'</td><td>'+esc(r.status)+'</td><td>'+button('review-toggle',r.status==='Published'?'Unpublish':'Approve',r.id)+' '+button('review-delete','Delete',r.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><h3>Reviews</h3><p>Approve reviews before they appear in the sample moderation workflow.</p>'+table(['Customer','Product','Rating','Review','Status','Actions'],rows)+'</div>';
 };
 const renderBlogs=()=>{
  const rows=state.blogs.map(b=>'<tr><td><strong>'+esc(b.title)+'</strong><br><small>/'+esc(b.slug)+'</small></td><td>'+esc(b.excerpt)+'</td><td>'+esc(b.status)+'</td><td>'+button('blog-edit','Edit',b.id)+' '+button('blog-delete','Delete',b.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Blog posts</h3><p>Draft and publish sample buying guides and editorial posts.</p></div>'+button('blog-add','New post')+'</div>'+table(['Post','Excerpt','Status','Actions'],rows)+'</div>';
 };
 const renderInquiries=()=>{
  const rows=state.inquiries.map(q=>'<tr><td><strong>'+esc(q.subject)+'</strong><br><small>'+esc(q.name)+' · '+esc(q.email)+'</small><p>'+esc(q.message)+'</p></td><td><select data-inquiry-status="'+esc(q.id)+'">'+['New','In progress','Resolved'].map(x=>'<option '+(x===q.status?'selected':'')+'>'+x+'</option>').join('')+'</select></td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><h3>Enquiries</h3><p>Update the status of sample customer enquiries.</p>'+table(['Enquiry','Status'],rows)+'</div>';
 };
 const render=()=>{
  host.innerHTML='<div class="demo-note"><strong>INTERACTIVE DEMO WORKSPACE</strong> · Sample records only. Changes are saved in this browser and do not modify Supabase, live orders or the public storefront.</div>';
  const before=host.innerHTML;
  if(tab==='overview'){renderOverview()}else if(tab==='products'){renderProducts()}else if(tab==='categories'){renderCategories()}else if(tab==='collections'){renderCollections()}else if(tab==='orders'){renderOrders()}else if(tab==='reviews'){renderReviews()}else if(tab==='blogs'){renderBlogs()}else if(tab==='inquiries'){renderInquiries()}else{renderOverview()}
  host.innerHTML=before+host.innerHTML;
 };
 const showProductForm=p=>{
  const isEdit=!!p;
  const options=state.categories.map(c=>({value:c.id,label:c.name}));
  const form='<form id="demo-product-form"><div class="admin-form-grid">'+
   field('Product name','product-name',p?.name||'','text',false,'required')+
   field('SKU / model number','product-sku',p?.sku||'','text',false,'required')+
   field('Category','product-category',p?.categoryId||options[0]?.value||'','select',false,options)+
   field('MRP (₹)','product-mrp',p?.mrp??0,'number',false,'min="0" step="0.01" required')+
   field('Sale price (₹)','product-price',p?.price??0,'number',false,'min="0" step="0.01" required')+
   field('Stock quantity','product-stock',p?.stock??0,'number',false,'min="0" step="1" required')+
   field('Low-stock alert','product-lowstock',p?.lowStock??5,'number',false,'min="0" step="1" required')+
   field('Description','product-description',p?.description||'','textarea',true)+
   field('Storefront status','product-active',p?.active!==false?'Active':'Hidden','select',false,[{value:'Active',label:'Active'},{value:'Hidden',label:'Hidden'}])+
   '</div><div class="hero-buttons"><button class="btn" type="submit">'+(isEdit?'Save changes':'Create product')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(isEdit?'Edit product':'Add product',form));
  $('#demo-editor').dataset.editId=p?.id||'';
  $('#demo-editor').scrollIntoView({behavior:'smooth',block:'start'});
 };
 const showCategoryForm=c=>{
  const form='<form id="demo-category-form"><div class="admin-form-grid">'+field('Category name','category-name',c?.name||'','text',false,'required')+field('Description','category-description',c?.description||'','textarea',true)+'</div><div class="hero-buttons"><button class="btn" type="submit">'+(c?'Save changes':'Create category')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(c?'Edit category':'Add category',form));
  $('#demo-editor').dataset.editId=c?.id||'';
 };
 const showCollectionForm=c=>{
  const form='<form id="demo-collection-form"><div class="admin-form-grid">'+field('Collection name','collection-name',c?.name||'','text',false,'required')+field('Description','collection-description',c?.description||'','textarea',true)+field('Status','collection-active',c?.active===false?'Hidden':'Active','select',false,[{value:'Active',label:'Active'},{value:'Hidden',label:'Hidden'}])+'</div><div class="hero-buttons"><button class="btn" type="submit">'+(c?'Save changes':'Create collection')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(c?'Edit collection':'Add collection',form));
  $('#demo-editor').dataset.editId=c?.id||'';
 };
 const showBlogForm=b=>{
  const form='<form id="demo-blog-form"><div class="admin-form-grid">'+field('Post title','blog-title',b?.title||'','text',false,'required')+field('URL slug','blog-slug',b?.slug||'','text',false,'required')+field('Excerpt','blog-excerpt',b?.excerpt||'','textarea',true)+field('Article content','blog-body',b?.body||'','textarea',true)+field('Status','blog-status',b?.status||'Draft','select',false,[{value:'Draft',label:'Draft'},{value:'Published',label:'Published'}])+'</div><div class="hero-buttons"><button class="btn" type="submit">'+(b?'Save post':'Create post')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(b?'Edit blog post':'New blog post',form));
  $('#demo-editor').dataset.editId=b?.id||'';
 };
 const renderVariants=p=>{
  $('#demo-editor')?.remove();
  const rows=p.variants.map(v=>'<tr><td>'+esc(v.name)+'</td><td>'+esc(v.sku)+'</td><td>'+money(v.price)+'</td><td>'+v.stock+'</td><td>'+button('variant-edit','Edit',p.id+'|'+v.id)+' '+button('variant-delete','Delete',p.id+'|'+v.id,true)+'</td></tr>').join('');
  host.insertAdjacentHTML('beforeend',editor('Variants · '+esc(p.name),'<p>Manage model, finish, size or capacity options for this product.</p>'+table(['Variant','SKU','Price','Stock','Actions'],rows)+'<div class="hero-buttons">'+button('variant-add','Add variant',p.id)+'</div>'));
  $('#demo-editor').dataset.productId=p.id;
 };
 const showVariantForm=(p,v)=>{
  $('#demo-editor')?.remove();
  const form='<form id="demo-variant-form"><div class="admin-form-grid">'+field('Variant name','variant-name',v?.name||'','text',false,'required')+field('SKU','variant-sku',v?.sku||'','text')+field('Price (₹)','variant-price',v?.price??p.price,'number',false,'min="0" step="0.01" required')+field('Stock quantity','variant-stock',v?.stock??0,'number',false,'min="0" step="1" required')+'</div><div class="hero-buttons"><button class="btn" type="submit">Save variant</button><button class="btn dark" type="button" data-action="variants-back" data-id="'+p.id+'">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(v?'Edit variant':'Add variant',form));
  $('#demo-editor').dataset.productId=p.id;$('#demo-editor').dataset.variantId=v?.id||'';
 };
 nav.innerHTML='<div class="admin-nav-label">AIREVO DEMO WORKSPACE</div>'+
  [['overview','Overview'],['products','Products & variants'],['categories','Categories'],['collections','Collections'],['orders','Orders & billing'],['reviews','Reviews'],['blogs','Blog posts'],['inquiries','Enquiries']].map(x=>'<button type="button" data-admin-tab="'+x[0]+'">'+x[1]+'</button>').join('')+
  '<div style="margin-top:18px;padding-top:14px;border-top:1px solid #ffffff20"><small style="display:block;color:#8fa5b4;font-size:9px;line-height:1.5;margin-bottom:9px">Changes are local to this browser.</small>'+button('reset-demo','Reset sample data')+'</div>';
 nav.onclick=e=>{const b=e.target.closest('[data-admin-tab]');if(b){setTab(b.dataset.adminTab);return}const a=e.target.closest('[data-action="reset-demo"]');if(a&&confirm('Reset all demo records to the original sample data?')){state=clone(seed);save('Demo data reset.');setTab('overview')}};
 host.onclick=e=>{
  const jump=e.target.closest('[data-action="go-tab"]');if(jump){setTab(jump.dataset.id);return}
  const b=e.target.closest('[data-action]');if(!b)return;
  const action=b.dataset.action,idValue=b.dataset.id;
  if(action==='editor-close'){$('#demo-editor')?.remove();return}
  if(action==='reset-demo'&&confirm('Reset all demo records to the original sample data?')){state=clone(seed);save('Demo data reset.');setTab('overview');return}
  if(action==='product-add'){showProductForm(null);return}
  if(action==='product-edit'){const p=state.products.find(x=>x.id===idValue);if(p)showProductForm(p);return}
  if(action==='product-delete'){const p=state.products.find(x=>x.id===idValue);if(p&&confirm('Delete '+p.name+' from the demo catalogue?')){state.products=state.products.filter(x=>x.id!==idValue);save('Product deleted.');render()}return}
  if(action==='variants-open'){const p=state.products.find(x=>x.id===idValue);if(p)renderVariants(p);return}
  if(action==='variant-add'){const p=state.products.find(x=>x.id===idValue);if(p)showVariantForm(p,null);return}
  if(action==='variant-edit'||action==='variant-delete'||action==='variants-back'){
   const parts=idValue.split('|'),pid=action==='variants-back'?idValue:parts[0],vid=parts[1],p=state.products.find(x=>x.id===pid);if(!p)return;
   if(action==='variants-back'){renderVariants(p);return}
   const v=p.variants.find(x=>x.id===vid);if(action==='variant-edit'&&v)showVariantForm(p,v);
   if(action==='variant-delete'&&v&&confirm('Delete this variant?')){p.variants=p.variants.filter(x=>x.id!==vid);save('Variant deleted.');renderVariants(p)}
   return;
  }
  if(action==='category-add'){showCategoryForm(null);return}
  if(action==='category-edit'){const c=state.categories.find(x=>x.id===idValue);if(c)showCategoryForm(c);return}
  if(action==='category-delete'){const c=state.categories.find(x=>x.id===idValue);if(c&&confirm('Delete this category? Products will become uncategorised.')){state.categories=state.categories.filter(x=>x.id!==idValue);state.products.forEach(p=>{if(p.categoryId===idValue)p.categoryId='' });save('Category deleted.');render()}return}
  if(action==='collection-add'){showCollectionForm(null);return}
  if(action==='collection-edit'){const c=state.collections.find(x=>x.id===idValue);if(c)showCollectionForm(c);return}
  if(action==='collection-toggle'){const c=state.collections.find(x=>x.id===idValue);if(c){c.active=!c.active;save('Collection status updated.');render()}return}
  if(action==='collection-delete'){if(confirm('Delete this collection?')){state.collections=state.collections.filter(x=>x.id!==idValue);save('Collection deleted.');render()}return}
  if(action==='review-toggle'){const r=state.reviews.find(x=>x.id===idValue);if(r){r.status=r.status==='Published'?'Pending':'Published';save('Review status updated.');render()}return}
  if(action==='review-delete'){if(confirm('Delete this sample review?')){state.reviews=state.reviews.filter(x=>x.id!==idValue);save('Review deleted.');render()}return}
  if(action==='blog-add'){showBlogForm(null);return}
  if(action==='blog-edit'){const b=state.blogs.find(x=>x.id===idValue);if(b)showBlogForm(b);return}
  if(action==='blog-delete'){if(confirm('Delete this blog post?')){state.blogs=state.blogs.filter(x=>x.id!==idValue);save('Blog post deleted.');render()}return}
 };
 host.onsubmit=e=>{
  const form=e.target;if(!form.id.startsWith('demo-'))return;
  e.preventDefault();const d=new FormData(form),val=n=>String(d.get(n)||'').trim(),num=n=>Number(d.get(n)||0);
  const edit=$('#demo-editor')?.dataset.editId||'';
  if(form.id==='demo-product-form'){
   const payload={id:edit||id('prd'),name:val('product-name'),sku:val('product-sku'),categoryId:val('product-category'),mrp:num('product-mrp'),price:num('product-price'),stock:num('product-stock'),lowStock:num('product-lowstock'),description:val('product-description'),active:val('product-active')==='Active',variants:state.products.find(x=>x.id===edit)?.variants||[]};
   if(!payload.name||!payload.sku){toast('Product name and SKU are required.');return}
   if(edit)state.products=state.products.map(x=>x.id===edit?payload:x);else state.products.unshift(payload);
   save(edit?'Product updated.':'Product created.');render();return;
  }
  if(form.id==='demo-category-form'){
   const payload={id:edit||id('cat'),name:val('category-name'),description:val('category-description')};
   if(!payload.name){toast('Enter a category name.');return}
   if(edit)state.categories=state.categories.map(x=>x.id===edit?payload:x);else state.categories.push(payload);
   save(edit?'Category updated.':'Category created.');render();return;
  }
  if(form.id==='demo-collection-form'){
   const payload={id:edit||id('col'),name:val('collection-name'),description:val('collection-description'),active:val('collection-active')==='Active'};
   if(!payload.name){toast('Enter a collection name.');return}
   if(edit)state.collections=state.collections.map(x=>x.id===edit?payload:x);else state.collections.push(payload);
   save(edit?'Collection updated.':'Collection created.');render();return;
  }
  if(form.id==='demo-blog-form'){
   const payload={id:edit||id('blog'),title:val('blog-title'),slug:val('blog-slug'),excerpt:val('blog-excerpt'),body:val('blog-body'),status:val('blog-status')};
   if(!payload.title||!payload.slug){toast('Post title and URL slug are required.');return}
   if(edit)state.blogs=state.blogs.map(x=>x.id===edit?payload:x);else state.blogs.unshift(payload);
   save(edit?'Blog post updated.':'Blog post created.');render();return;
  }
  if(form.id==='demo-variant-form'){
   const pid=$('#demo-editor')?.dataset.productId||'',vid=$('#demo-editor')?.dataset.variantId||'',p=state.products.find(x=>x.id===pid);if(!p)return;
   const payload={id:vid||id('var'),name:val('variant-name'),sku:val('variant-sku'),price:num('variant-price'),stock:num('variant-stock')};
   if(!payload.name){toast('Enter a variant name.');return}
   if(vid)p.variants=p.variants.map(x=>x.id===vid?payload:x);else p.variants.push(payload);
   save(vid?'Variant updated.':'Variant created.');renderVariants(p);
  }
 };
 host.onchange=e=>{
  const el=e.target;
  if(el.dataset.orderStatus){const x=state.orders.find(o=>o.id===el.dataset.orderStatus);if(x){x.status=el.value;save('Order status updated.')} }
  if(el.dataset.paymentStatus){const x=state.orders.find(o=>o.id===el.dataset.paymentStatus);if(x){x.payment=el.value;save('Payment status updated.')} }
  if(el.dataset.inquiryStatus){const x=state.inquiries.find(q=>q.id===el.dataset.inquiryStatus);if(x){x.status=el.value;save('Enquiry status updated.')} }
 };
 setTab('overview');
}
function render(){mountDemoDashboard()}
window.AirevoAdmin={render,verify};
})();