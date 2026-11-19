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
 const KEY='airevo_demo_admin_workspace_v1',REV_KEY='airevo_demo_customer_reviews_v1';
 const clone=x=>JSON.parse(JSON.stringify(x)),today=()=>new Date().toISOString();
 const seed={
  categories:[
   {id:'cat-kitchen',name:'Kitchen Appliances',description:'Appliances for everyday cooking'},
   {id:'cat-home',name:'Home Care',description:'Cleaning and home-care essentials'},
   {id:'cat-personal',name:'Personal Care',description:'Personal grooming and wellness'},
   {id:'cat-smart',name:'Smart Living',description:'Connected home products'}
  ],
  products:[
   {id:'prd-1001',name:'Digital Air Fryer 5L',sku:'AR-AF-500',categoryId:'cat-kitchen',mrp:7999,price:6499,costPrice:4200,stock:2,lowStock:5,active:true,description:'A roomy air fryer for everyday family meals.',imageUrls:[],videoUrl:'',variants:[{id:'var-1001',name:'5 Litre · Black',sku:'AR-AF-500-BK',price:6499,costPrice:4200,stock:2},{id:'var-1002',name:'5 Litre · Silver',sku:'AR-AF-500-SL',price:6799,costPrice:4450,stock:4}]},
   {id:'prd-1002',name:'Electric Kettle 1.8L',sku:'AR-EK-180',categoryId:'cat-kitchen',mrp:1599,price:1299,costPrice:780,stock:3,lowStock:5,active:true,description:'Fast-boil electric kettle with auto shut-off.',imageUrls:[],videoUrl:'',variants:[{id:'var-1003',name:'1.8 Litre · Stainless steel',sku:'AR-EK-180-SS',price:1299,costPrice:780,stock:3}]},
   {id:'prd-1003',name:'Steam Iron Pro',sku:'AR-SI-220',categoryId:'cat-home',mrp:2799,price:2199,costPrice:1350,stock:14,lowStock:4,active:true,description:'A practical steam iron for daily garment care.',imageUrls:[],videoUrl:'',variants:[]},
   {id:'prd-1004',name:'Built-in Microwave 28L',sku:'AR-BM-280',categoryId:'cat-kitchen',mrp:21999,price:18499,costPrice:13200,stock:7,lowStock:2,active:true,description:'A built-in microwave for a streamlined kitchen.',imageUrls:[],videoUrl:'',variants:[]}
  ],
  collections:[
   {id:'col-trending',name:'Trending',slug:'trending',description:'Products currently highlighted as trending.',active:true,productIds:['prd-1001','prd-1004'],kind:'trending'},
   {id:'col-popular',name:'Popular',slug:'popular',description:'Popular picks across the Airevo catalogue.',active:true,productIds:['prd-1001','prd-1002'],kind:'popular'},
   {id:'col-essentials',name:'Everyday Essentials',slug:'everyday-essentials',description:'Useful appliances for daily routines.',active:true,productIds:['prd-1002','prd-1003'],kind:'custom'}
  ],
  orders:[
   {id:'ord-1024',orderNo:'ARV-DEMO-1024',date:'2026-11-18T10:30:00.000Z',source:'Online',customerName:'Aarav Mehta (sample)',email:'aarav@example.test',phone:'+91 90000 00001',address:'Sample address, Kolkata',status:'Delivered',payment:'Paid',paymentMethod:'Online (demo)',shippingFee:99,discount:0,returnAmount:0,returnReason:'',items:[{productId:'prd-1001',name:'Digital Air Fryer 5L',sku:'AR-AF-500',qty:1,unitPrice:6499,unitCost:4200},{productId:'prd-1002',name:'Electric Kettle 1.8L',sku:'AR-EK-180',qty:1,unitPrice:1299,unitCost:780}]},
   {id:'ord-1023',orderNo:'ARV-DEMO-1023',date:'2026-11-17T12:15:00.000Z',source:'Offline',customerName:'Mira Shah (sample)',email:'mira@example.test',phone:'+91 90000 00002',address:'Walk-in sale',status:'Completed',payment:'Paid',paymentMethod:'Cash',shippingFee:0,discount:0,returnAmount:0,returnReason:'',items:[{productId:'prd-1002',name:'Electric Kettle 1.8L',sku:'AR-EK-180',qty:2,unitPrice:1299,unitCost:780}]},
   {id:'ord-1022',orderNo:'ARV-DEMO-1022',date:'2026-11-16T09:05:00.000Z',source:'Online',customerName:'Kabir Rao (sample)',email:'kabir@example.test',phone:'+91 90000 00003',address:'Sample address, Howrah',status:'Returned',payment:'Refunded',paymentMethod:'Online (demo)',shippingFee:0,discount:0,returnAmount:2199,returnReason:'Sample full return',items:[{productId:'prd-1003',name:'Steam Iron Pro',sku:'AR-SI-220',qty:1,unitPrice:2199,unitCost:1350}]}
  ],
  reviews:[
   {id:'rev-1',customer:'Sample customer A',place:'Kolkata',product:'Digital Air Fryer 5L',rating:5,text:'Great product quality and quick delivery.',status:'Published',imageUrl:'',isDemo:true},
   {id:'rev-2',customer:'Sample customer B',place:'Howrah',product:'Electric Kettle 1.8L',rating:5,text:'Works exactly as expected. Very easy to use.',status:'Published',imageUrl:'',isDemo:true},
   {id:'rev-3',customer:'Sample customer C',place:'New Delhi',product:'Steam Iron Pro',rating:4,text:'Good everyday performance.',status:'Pending',imageUrl:'',isDemo:true}
  ],
  blogs:[
   {id:'blog-1',title:'Choosing the right air fryer',slug:'choosing-the-right-air-fryer',excerpt:'A quick guide to capacity, controls and everyday use.',body:'Think about the number of people you cook for, the counter space available and the features you will use regularly.',images:[],status:'Published'},
   {id:'blog-2',title:'Everyday appliance care',slug:'everyday-appliance-care',excerpt:'Simple habits that help appliances stay in good shape.',body:'Read the product manual, keep vents clear and clean appliances only as recommended by the manufacturer.',images:[],status:'Draft'},
   {id:'blog-3',title:'A smarter kitchen',slug:'a-smarter-kitchen',excerpt:'Small upgrades that can make daily routines easier.',body:'Start with the tasks you repeat most often and choose appliances that fit your space and habits.',images:[],status:'Published'}
  ],
  inquiries:[
   {id:'inq-1',name:'Sample visitor A',email:'visitor-a@example.test',phone:'+91 90000 00011',subject:'Product availability question',message:'Is the 5L air fryer available?',status:'New',date:'2026-11-18T08:30:00.000Z'},
   {id:'inq-2',name:'Sample visitor B',email:'visitor-b@example.test',phone:'+91 90000 00012',subject:'Bulk purchase enquiry',message:'Please share details for a bulk purchase.',status:'In progress',date:'2026-11-17T11:10:00.000Z'}
  ]
 };
 let state;
 try{
  const stored=JSON.parse(localStorage.getItem(KEY)||'null');
  state=stored&&Array.isArray(stored.products)&&Array.isArray(stored.orders)?stored:clone(seed);
 }catch(_){state=clone(seed)}
 state.categories=Array.isArray(state.categories)?state.categories:clone(seed.categories);
 state.products=Array.isArray(state.products)?state.products:clone(seed.products);
 state.orders=Array.isArray(state.orders)?state.orders:clone(seed.orders);
 state.reviews=Array.isArray(state.reviews)?state.reviews:clone(seed.reviews);
 state.blogs=Array.isArray(state.blogs)?state.blogs:clone(seed.blogs);
 state.inquiries=Array.isArray(state.inquiries)?state.inquiries:clone(seed.inquiries);
 state.collections=Array.isArray(state.collections)?state.collections:clone(seed.collections);
 state.orders=state.orders.map(o=>{
  if(Array.isArray(o.items))return {...o,source:o.source||'Online',returnAmount:Number(o.returnAmount||0),shippingFee:Number(o.shippingFee||0),discount:Number(o.discount||0)};
  const base=seed.orders.find(x=>x.orderNo===o.id||x.orderNo===o.orderNo);
  return base?clone(base):{id:o.id||id('ord'),orderNo:o.orderNo||o.id,date:o.date||today(),source:'Online',customerName:o.customer||'Sample customer',email:'',phone:'',address:'',status:o.status||'Pending',payment:o.payment||'Pending',paymentMethod:'Demo',shippingFee:0,discount:0,returnAmount:0,items:[]};
 });
 state.products=state.products.map(p=>({...p,costPrice:Number(p.costPrice??p.cost_price??seed.products.find(x=>x.id===p.id)?.costPrice??0),imageUrls:p.imageUrls||p.image_urls||[],videoUrl:p.videoUrl||p.video_url||'',variants:(p.variants||[]).map(v=>({...v,costPrice:Number(v.costPrice??0)}))}));
 state.blogs=state.blogs.map(b=>({...b,images:b.images||b.imageUrls||[]}));
 state.collections=state.collections.map(c=>({...c,productIds:c.productIds||[],kind:c.kind||((c.slug==='trending'||c.name.toLowerCase()==='trending')?'trending':(c.slug==='popular'||c.name.toLowerCase()==='popular')?'popular':'custom')}));
 if(!state.collections.some(c=>c.kind==='trending'||c.slug==='trending'))state.collections.unshift(clone(seed.collections[0]));
 else state.collections.forEach(c=>{if(c.kind==='trending'||c.slug==='trending'){c.name='Trending';c.slug='trending';c.kind='trending'}});
 if(!state.collections.some(c=>c.kind==='popular'||c.slug==='popular'))state.collections.splice(1,0,clone(seed.collections[1]));
 else state.collections.forEach(c=>{if(c.kind==='popular'||c.slug==='popular'){c.name='Popular';c.slug='popular';c.kind='popular'}});
 try{
  const customerReviews=JSON.parse(localStorage.getItem(REV_KEY)||'[]');
  customerReviews.forEach(r=>{if(!state.reviews.some(x=>x.id===r.id))state.reviews.unshift({...r,customer:r.customer_name||r.customer||'Customer',place:r.customer_place||r.place||'',product:r.product||r.title||'Customer order',text:r.body||r.text||'',imageUrl:r.image_url||r.imageUrl||'',status:r.status||'Pending',fromCustomer:true})});
 }catch(_){}
 let tab='overview',offlineLineCount=0;
 const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 const categoryName=catId=>state.categories.find(x=>x.id===catId)?.name||'Uncategorised';
 const productById=pid=>state.products.find(x=>x.id===pid);
 const amount=o=>(o.items||[]).reduce((n,x)=>n+Number(x.qty||0)*Number(x.unitPrice||0),0)+Number(o.shippingFee||0)-Number(o.discount||0);
 const cost=o=>(o.items||[]).reduce((n,x)=>n+Number(x.qty||0)*Number(x.unitCost||0),0);
 const recognised=o=>!['Cancelled','Pending'].includes(o.status)&&o.payment!=='Pending';
 const moneyText=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
 const save=message=>{
  try{
   localStorage.setItem(KEY,JSON.stringify(state));
   localStorage.setItem(REV_KEY,JSON.stringify(state.reviews.filter(r=>r.fromCustomer).map(r=>({...r,customer_name:r.customer,customer_place:r.place,body:r.text,image_url:r.imageUrl,status:r.status}))));
   toast(message||'Demo changes saved in this browser.');
  }catch(e){toast('Browser storage is full. Remove large demo media and try again.');console.error(e)}
 };
 const toast=message=>{
  let el=$('#demo-toast');if(!el){el=document.createElement('div');el.id='demo-toast';el.style.cssText='position:fixed;right:22px;bottom:22px;z-index:9999;background:#102534;color:#fff;padding:12px 16px;border-radius:10px;font-size:12px;box-shadow:0 8px 30px #0002';document.body.appendChild(el)}
  el.textContent=message;el.style.display='block';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.display='none',3000);
 };
 const csvCell=v=>{let s=String(v??'');if(typeof v==='string'&&/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const downloadExcel=()=>{
  const rows=[['Invoice / order','Date','Sale type','Customer name','Customer email','Customer phone','Address','Product','SKU','Quantity','Unit sale price','Item revenue','Unit cost (private)','Item cost','Return amount','Net order revenue','Order gross profit','Order status','Payment status','Payment method','Return reason']];
  state.orders.forEach(o=>(o.items||[]).forEach((it,i)=>rows.push([
   o.orderNo,o.date,o.source,o.customerName,o.email,o.phone,o.address,it.name,it.sku,it.qty,it.unitPrice,Number(it.qty)*Number(it.unitPrice),it.unitCost,Number(it.qty)*Number(it.unitCost),i===0?o.returnAmount:0,amount(o)-Number(o.returnAmount||0),amount(o)-Number(o.returnAmount||0)-cost(o),o.status,o.payment,o.paymentMethod,o.returnReason
  ])));
  const recognized=state.orders.filter(recognised),gross=recognized.reduce((n,o)=>n+amount(o),0),returns=recognized.reduce((n,o)=>n+Number(o.returnAmount||0),0),cogs=recognized.reduce((n,o)=>n+cost(o),0);
  rows.push([]);rows.push(['TOTALS','Gross sales',gross,'Returns',returns,'Cost of goods sold',cogs,'Net revenue',gross-returns,'Gross profit',gross-returns-cogs]);
  const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='airevo-sales-returns-profit-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast('Excel-compatible sales and returns sheet downloaded.');
 };
 const printBill=o=>{
  const w=window.open('','_blank','width=850,height=900');if(!w){toast('Allow pop-ups to print the bill.');return}
  const rows=(o.items||[]).map(x=>'<tr><td>'+esc(x.name)+'<br><small>'+esc(x.sku||'')+'</small></td><td>'+x.qty+'</td><td>'+moneyText(x.unitPrice)+'</td><td>'+moneyText(Number(x.qty)*Number(x.unitPrice))+'</td></tr>').join('');
  w.document.write('<!doctype html><html><head><title>Bill '+esc(o.orderNo)+'</title><style>body{font:14px Arial;padding:35px;color:#111}table{width:100%;border-collapse:collapse;margin-top:25px}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}.total{text-align:right;font-size:21px;font-weight:bold;margin-top:25px}.muted{color:#666;font-size:11px}</style></head><body><h1>AIRÉVO</h1><small>PREMIUM KITCHEN LIVING</small><h2>Sales invoice / receipt</h2><p><b>Invoice:</b> '+esc(o.orderNo)+'<br><b>Date:</b> '+new Date(o.date).toLocaleString('en-IN')+'<br><b>Sale type:</b> '+esc(o.source)+'<br><b>Status:</b> '+esc(o.status)+'</p><p><b>Customer:</b> '+esc(o.customerName||'Walk-in customer')+'<br>'+esc(o.email||'')+'<br>'+esc(o.phone||'')+'<br>'+esc(o.address||'')+'</p><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>'+rows+'</tbody></table><p style="text-align:right">Shipping / other: '+moneyText(o.shippingFee)+'<br>Discount: −'+moneyText(o.discount)+'<br>Returns / refund: −'+moneyText(o.returnAmount)+'</p><div class="total">Net total: '+moneyText(amount(o)-Number(o.returnAmount||0))+'</div><p>Payment: '+esc(o.payment)+' · '+esc(o.paymentMethod||'')+'</p><p class="muted">Demo invoice. Add the registered seller details, GSTIN and statutory invoice fields before production billing.</p><script>window.onload=function(){window.print()}</script></body></html>');w.document.close();
 };
 const field=(label,name,value,type,full,extra)=>{
  const opts=Array.isArray(extra)?extra:null,attr=typeof extra==='string'?extra:'';
  return '<div class="field'+(full?' full':'')+'"><label for="demo-'+name+'">'+label+'</label>'+
   (type==='textarea'?'<textarea id="demo-'+name+'" name="'+name+'" rows="4">'+esc(value||'')+'</textarea>':
   type==='select'?'<select id="demo-'+name+'" name="'+name+'">'+(opts||[]).map(o=>'<option value="'+esc(o.value)+'" '+(String(o.value)===String(value)?'selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select>':
   '<input id="demo-'+name+'" name="'+name+'" type="'+(type||'text')+'" value="'+esc(value??'')+'" '+attr+'>')+
  '</div>';
 };
 const table=(headers,rows)=>'<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+ (rows||'<tr><td colspan="'+headers.length+'">No records yet.</td></tr>')+'</tbody></table></div>';
 const button=(action,label,idValue,secondary)=>'<button type="button" data-action="'+action+'" data-id="'+esc(idValue||'')+'" '+(secondary?'class="secondary"':'')+'>'+label+'</button>';
 const actions=items=>'<div class="hero-buttons" style="gap:7px;flex-wrap:wrap">'+items+'</div>';
 const editor=(title,body)=>'<div class="admin-panel" id="demo-editor"><div class="admin-panel-head"><h3>'+title+'</h3>'+button('editor-close','Close')+'</div>'+body+'</div>';
 const setTab=next=>{tab=next;$$('#admin-nav [data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));render()};
 const metrics=()=>{
  const done=state.orders.filter(recognised),gross=done.reduce((n,o)=>n+amount(o),0),returns=done.reduce((n,o)=>n+Number(o.returnAmount||0),0),cogs=done.reduce((n,o)=>n+cost(o),0);
  return {done,gross,returns,cogs,net:gross-returns,profit:gross-returns-cogs,offline:state.orders.filter(o=>o.source==='Offline').length,pending:state.orders.filter(o=>o.status==='Pending'||o.payment==='Pending').length,returnedCount:done.filter(o=>Number(o.returnAmount||0)>0).length,stockValue:state.products.reduce((n,p)=>n+Number(p.stock||0)*Number(p.costPrice||0),0),customers:new Set(state.orders.map(o=>o.customerName).filter(Boolean)).size};
 };
 const renderOverview=()=>{
  const m=metrics(),low=state.products.filter(p=>p.active&&Number(p.stock)<=Number(p.lowStock));
  host.innerHTML='<div class="admin-stats">'+[
   ['Total revenue',moneyText(m.net)],['Gross sales',moneyText(m.gross)],['Returns / refunds',moneyText(m.returns)],['Gross profit',moneyText(m.profit)],['Cost of goods sold',moneyText(m.cogs)],['Returned orders',m.returnedCount],['Total orders',state.orders.length],['Offline bills',m.offline],['Customers',m.customers],['Stock value at cost',moneyText(m.stockValue)],['Pending orders / payments',m.pending],['Products',state.products.length],['Pending reviews',state.reviews.filter(x=>x.status==='Pending').length],['New enquiries',state.inquiries.filter(x=>x.status==='New').length],['Low-stock products',low.length]
  ].map(x=>'<div class="admin-stat"><small>'+x[0]+'</small><b>'+x[1]+'</b></div>').join('')+'</div>'+
  '<div class="admin-panel"><div class="admin-panel-head"><div><h3>Business performance</h3><p>Demo calculations: gross sales − returns − cost of goods sold = gross profit. Overheads, tax and payment fees are not included.</p></div>'+button('export-sales','Download Excel sheet')+'</div>'+
  actions(button('offline-sale','Create offline bill')+button('go-tab','Manage products','products')+button('go-tab','Orders & returns','orders'))+'</div>'+
  '<div class="admin-panel"><h3>Low-stock watch</h3>'+table(['Product','Stock left','Alert at','Status'],low.map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+p.stock+'</td><td>'+p.lowStock+'</td><td><span class="stock-low">Low stock</span></td></tr>').join('')||'<tr><td colspan="4">All demo products are above their low-stock threshold.</td></tr>')+'</div>';
 };
 const renderProducts=()=>{
  const rows=state.products.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><br><small>'+esc(p.sku)+'</small></td><td>'+esc(categoryName(p.categoryId))+'</td><td>'+moneyText(p.price)+'</td><td>'+moneyText(p.costPrice)+' <small>(private)</small></td><td>'+p.stock+'</td><td>'+p.imageUrls.length+' images'+(p.videoUrl?' + video':'')+'</td><td>'+(p.active?'Active':'Hidden')+'</td><td>'+button('product-edit','Edit',p.id)+' '+button('variants-open','Variants',p.id,true)+' '+button('product-delete','Delete',p.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Products & variants</h3><p>Set retail pricing, private cost price, stock, up to 5 images and 1 product video.</p></div>'+button('product-add','Add product')+'</div>'+table(['Product','Category','Sale price','Cost price (owner only)','Stock','Media','Status','Actions'],rows)+'</div>';
 };
 const renderCategories=()=>{
  const rows=state.categories.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong></td><td>'+esc(c.description)+'</td><td>'+state.products.filter(p=>p.categoryId===c.id).length+'</td><td>'+button('category-edit','Edit',c.id)+' '+button('category-delete','Delete',c.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Categories</h3><p>Organise products into storefront categories.</p></div>'+button('category-add','Add category')+'</div>'+table(['Category','Description','Products','Actions'],rows)+'</div>';
 };
 const renderCollections=()=>{
  const rows=state.collections.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong><br><small>'+esc(c.kind==='trending'?'Homepage · Trending':c.kind==='popular'?'Homepage · Popular':'Custom collection')+'</small></td><td>'+esc(c.description)+'</td><td>'+(c.productIds||[]).map(pid=>esc(productById(pid)?.name||'')).filter(Boolean).join(', ')+'</td><td>'+(c.active?'Active':'Hidden')+'</td><td>'+button('collection-edit','Edit',c.id)+' '+button('collection-toggle',c.active?'Hide':'Publish',c.id,true)+' '+(c.kind==='custom'?button('collection-delete','Delete',c.id,true):'')+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Collections & homepage merchandising</h3><p>Trending and Popular are built-in homepage collections. Add custom collections whenever needed.</p></div>'+button('collection-add','Add collection')+'</div>'+table(['Collection','Description','Assigned products','Status','Actions'],rows)+'</div>';
 };
 const renderOrders=()=>{
  const m=metrics(),rows=state.orders.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(o=>'<tr><td><strong>'+esc(o.orderNo)+'</strong><br><small>'+esc(o.source)+' · '+new Date(o.date).toLocaleDateString('en-IN')+'</small></td><td>'+esc(o.customerName||'Walk-in customer')+'<br><small>'+esc(o.phone||'')+'</small></td><td>'+moneyText(amount(o))+'</td><td>'+moneyText(o.returnAmount)+'</td><td>'+moneyText(amount(o)-Number(o.returnAmount||0)-cost(o))+'</td><td><select data-order-status="'+esc(o.id)+'">'+['Pending','Processing','Shipped','Delivered','Completed','Returned','Partially returned','Cancelled'].map(x=>'<option '+(o.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></td><td><select data-payment-status="'+esc(o.id)+'">'+['Pending','Paid','Failed','Refunded'].map(x=>'<option '+(o.payment===x?'selected':'')+'>'+x+'</option>').join('')+'</select></td><td>'+button('print-bill','Print bill',o.id)+' '+button('return-order','Record return',o.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Orders, offline bills & returns</h3><p>Print invoices for online and offline sales, update status and record full or partial returns.</p></div>'+button('offline-sale','Create offline bill')+'</div>'+actions(button('export-sales','Download Excel sales & returns')+' <span class="demo-note">Net revenue '+moneyText(m.net)+' · Gross profit '+moneyText(m.profit)+'</span>')+table(['Order / invoice','Customer','Gross sale','Returns','Gross profit','Order status','Payment','Actions'],rows)+'</div>';
 };
 const renderReviews=()=>{
  const rows=state.reviews.map(r=>'<tr><td>'+esc(r.customer||'Customer')+'<br><small>'+esc(r.place||'')+'</small></td><td>'+esc(r.product||'')+'</td><td>'+('★'.repeat(Number(r.rating)||0))+'</td><td>'+esc(r.text||'')+(r.imageUrl?'<br><a href="'+esc(r.imageUrl)+'" target="_blank" rel="noopener"><img src="'+esc(r.imageUrl)+'" alt="Review image" style="width:64px;height:48px;object-fit:cover;border-radius:6px;margin-top:6px"></a>':'')+'</td><td>'+esc(r.status)+'</td><td>'+button('review-toggle',r.status==='Published'?'Unpublish / reject':'Approve',r.id)+' '+button('review-delete','Delete',r.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><h3>Customer reviews</h3><p>Reviews submitted after an order appear here as pending. Approve them before they appear on the storefront. Sample previews are clearly marked.</p>'+table(['Customer','Product','Rating','Review / image','Status','Actions'],rows)+'</div>';
 };
 const renderBlogs=()=>{
  const rows=state.blogs.map(b=>'<tr><td><strong>'+esc(b.title)+'</strong><br><small>/'+esc(b.slug)+'</small></td><td>'+esc(b.excerpt)+'</td><td>'+((b.images||[]).length)+' images</td><td>'+esc(b.status)+'</td><td>'+button('blog-edit','Edit',b.id)+' '+button('blog-delete','Delete',b.id,true)+'</td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><div class="admin-panel-head"><div><h3>Blog posts</h3><p>Add up to five images to each article. They appear inside the customer-facing article.</p></div>'+button('blog-add','New post')+'</div>'+table(['Post','Excerpt','Gallery','Status','Actions'],rows)+'</div>';
 };
 const renderInquiries=()=>{
  const rows=state.inquiries.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(q=>'<tr><td>'+new Date(q.date).toLocaleString('en-IN')+'</td><td><strong>'+esc(q.name)+'</strong></td><td><a href="tel:'+esc(q.phone.replace(/[^+\d]/g,''))+'">'+esc(q.phone)+'</a></td><td><a href="mailto:'+esc(q.email)+'">'+esc(q.email)+'</a></td><td>'+esc(q.subject)+'</td><td>'+esc(q.message)+'</td><td><select data-inquiry-status="'+esc(q.id)+'">'+['New','In progress','Resolved'].map(x=>'<option '+(x===q.status?'selected':'')+'>'+x+'</option>').join('')+'</select></td></tr>').join('');
  host.innerHTML='<div class="admin-panel"><h3>Customer enquiries</h3><p>Customer details are shown in separate columns. Use the phone link to call and the email link to compose an email.</p>'+table(['Received','Name','Call','Email','Subject','Message','Status'],rows)+'</div>';
 };
 const render=()=>{
  const views={overview:renderOverview,products:renderProducts,categories:renderCategories,collections:renderCollections,orders:renderOrders,reviews:renderReviews,blogs:renderBlogs,inquiries:renderInquiries};
  host.innerHTML='<div class="demo-note"><strong>INTERACTIVE CLIENT DEMO</strong> · Sample records only. Changes stay in this browser and do not modify Supabase, real customer orders or the public catalogue.</div>';
  const note=host.innerHTML; (views[tab]||renderOverview)();host.innerHTML=note+host.innerHTML;
 };
 const mediaImage=async file=>{
  if(!file.type.startsWith('image/'))throw new Error('Please choose image files only.');
  if(!window.createImageBitmap) {
   if(file.size>350000)throw new Error('For this browser demo, each image must be below 350 KB.');
   return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  }
  const bmp=await createImageBitmap(file),scale=Math.min(1,1200/Math.max(bmp.width,bmp.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(bmp.width*scale);canvas.height=Math.round(bmp.height*scale);
  canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);
  let quality=.78,data=canvas.toDataURL('image/jpeg',quality);
  while(data.length>480000&&quality>.42){quality-=.08;data=canvas.toDataURL('image/jpeg',quality)}
  if(data.length>520000)throw new Error('This image is too large for the browser demo. Please choose a smaller image.');
  return data;
 };
 const mediaVideo=async file=>{
  if(!file.type.startsWith('video/'))throw new Error('Please choose a video file.');
  if(file.size>1200000)throw new Error('For this browser demo, the video must be below 1.2 MB. A hosted video URL can also be used.');
  return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
 };
 const showProductForm=p=>{
  $('#demo-editor')?.remove();
  const form='<form id="demo-product-form"><div class="admin-form-grid">'+
   field('Product name','product-name',p?.name||'','text',false,'required')+
   field('SKU / model number','product-sku',p?.sku||'','text',false,'required')+
   field('Category','product-category',p?.categoryId||state.categories[0]?.id||'','select',false,state.categories.map(c=>({value:c.id,label:c.name})))+
   field('MRP (₹)','product-mrp',p?.mrp??0,'number',false,'min="0" step="0.01" required')+
   field('Selling price (₹)','product-price',p?.price??0,'number',false,'min="0" step="0.01" required')+
   field('Cost price per unit (₹) · PRIVATE','product-cost',p?.costPrice??0,'number',false,'min="0" step="0.01" required')+
   field('Stock quantity','product-stock',p?.stock??0,'number',false,'min="0" step="1" required')+
   field('Low-stock alert','product-lowstock',p?.lowStock??5,'number',false,'min="0" step="1" required')+
   field('Description','product-description',p?.description||'','textarea',true)+
   field('Storefront status','product-active',p?.active!==false?'Active':'Hidden','select',false,[{value:'Active',label:'Active'},{value:'Hidden',label:'Hidden'}])+
   field('Image URLs (up to five, one per line)','product-image-urls',(p?.imageUrls||[]).filter(x=>!String(x).startsWith('data:')).join('\n'),'textarea',true)+
   '<div class="field full"><label>Or upload up to 5 product images</label><input id="product-image-files" type="file" accept="image/*" multiple><small>Images are compressed and saved in this browser for demo preview.</small><div class="demo-media-preview">'+(p?.imageUrls||[]).map(src=>'<img src="'+esc(src)+'" alt="Product preview">').join('')+'</div></div>'+
   field('Product video URL (optional)','product-video-url',p?.videoUrl&&!String(p.videoUrl).startsWith('data:')?p.videoUrl:'','url',true,'placeholder="https://…"')+
   '<div class="field full"><label>Or upload one product video</label><input id="product-video-file" type="file" accept="video/mp4,video/webm,video/quicktime"><small>Browser demo upload limit: 1.2 MB. For launch, use a hosted video URL or owner-authenticated storage upload.</small>'+(p?.videoUrl?'<video controls muted style="max-width:180px;display:block;margin-top:8px" src="'+esc(p.videoUrl)+'"></video>':'')+'</div>'+
   '</div><div class="hero-buttons"><button class="btn" type="submit">'+(p?'Save product':'Create product')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(p?'Edit product':'Add product',form));$('#demo-editor').dataset.editId=p?.id||'';
  $('#demo-product-form').onsubmit=async e=>{
   e.preventDefault();const f=e.target;try{
    const urls=f.elements['product-image-urls'].value.split('\n').map(x=>x.trim()).filter(Boolean),existingData=(p?.imageUrls||[]).filter(x=>String(x).startsWith('data:'));
    const files=Array.from($('#product-image-files').files||[]);if(urls.length+existingData.length+files.length>5)throw new Error('A product can have a maximum of five images.');
    const fileUrls=[];for(const file of files)fileUrls.push(await mediaImage(file));
    const videoUrl=f.elements['product-video-url'].value.trim();const vf=$('#product-video-file').files[0];
    if(videoUrl&&vf)throw new Error('Use one video URL or one uploaded video, not both.');
    const video=vf?await mediaVideo(vf):(videoUrl||p?.videoUrl||'');
    const edit=$('#demo-editor').dataset.editId||'',oldProduct=productById(edit);
    const payload={id:edit||id('prd'),name:f.elements['product-name'].value.trim(),sku:f.elements['product-sku'].value.trim(),categoryId:f.elements['product-category'].value,mrp:Number(f.elements['product-mrp'].value),price:Number(f.elements['product-price'].value),costPrice:Number(f.elements['product-cost'].value),stock:Number(f.elements['product-stock'].value),lowStock:Number(f.elements['product-lowstock'].value),description:f.elements['product-description'].value.trim(),active:f.elements['product-active'].value==='Active',imageUrls:[...urls,...existingData,...fileUrls],videoUrl:video,variants:oldProduct?.variants||[]};
    if(!payload.name||!payload.sku)throw new Error('Product name and SKU are required.');
    if(edit)state.products=state.products.map(x=>x.id===edit?payload:x);else state.products.unshift(payload);
    save(edit?'Product updated.':'Product created.');render();
   }catch(err){toast(err.message||String(err))}
  };
 };
 const showCategoryForm=c=>{
  $('#demo-editor')?.remove();
  const form='<form id="demo-category-form"><div class="admin-form-grid">'+field('Category name','category-name',c?.name||'','text',false,'required')+field('Description','category-description',c?.description||'','textarea',true)+'</div><div class="hero-buttons"><button class="btn" type="submit">'+(c?'Save changes':'Create category')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(c?'Edit category':'Add category',form));$('#demo-editor').dataset.editId=c?.id||'';
 };
 const showCollectionForm=c=>{
  $('#demo-editor')?.remove();const defaults=c?.productIds||[],options=state.products.map(p=>'<label class="demo-check"><input type="checkbox" name="collection-product" value="'+esc(p.id)+'" '+(defaults.includes(p.id)?'checked':'')+'> '+esc(p.name)+'</label>').join('');
  const form='<form id="demo-collection-form"><div class="admin-form-grid">'+field('Collection name','collection-name',c?.name||'','text',false,'required')+field('Description','collection-description',c?.description||'','textarea',true)+field('Status','collection-active',c?.active===false?'Hidden':'Active','select',false,[{value:'Active',label:'Active'},{value:'Hidden',label:'Hidden'}])+'<div class="field full"><label>Products in this collection</label>'+options+'</div></div><div class="hero-buttons"><button class="btn" type="submit">'+(c?'Save collection':'Create collection')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(c?'Edit collection':'Add collection',form));$('#demo-editor').dataset.editId=c?.id||'';
 };
 const showBlogForm=b=>{
  $('#demo-editor')?.remove();
  const form='<form id="demo-blog-form"><div class="admin-form-grid">'+field('Post title','blog-title',b?.title||'','text',false,'required')+field('URL slug','blog-slug',b?.slug||'','text',false,'required')+field('Excerpt','blog-excerpt',b?.excerpt||'','textarea',true)+field('Article content','blog-body',b?.body||'','textarea',true)+field('Image URLs (up to five, one per line)','blog-image-urls',(b?.images||[]).filter(x=>!String(x).startsWith('data:')).join('\n'),'textarea',true)+'<div class="field full"><label>Or upload up to 5 article images</label><input id="blog-image-files" type="file" accept="image/*" multiple><small>Uploaded images will be visible inside the published article. Browser demo compresses the files locally.</small><div class="demo-media-preview">'+(b?.images||[]).map(src=>'<img src="'+esc(src)+'" alt="Article image preview">').join('')+'</div></div>'+field('Status','blog-status',b?.status||'Draft','select',false,[{value:'Draft',label:'Draft'},{value:'Published',label:'Published'}])+'</div><div class="hero-buttons"><button class="btn" type="submit">'+(b?'Save post':'Create post')+'</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(b?'Edit blog post':'New blog post',form));$('#demo-editor').dataset.editId=b?.id||'';
  $('#demo-blog-form').onsubmit=async e=>{
   e.preventDefault();const f=e.target;try{
    const urls=f.elements['blog-image-urls'].value.split('\n').map(x=>x.trim()).filter(Boolean),existingData=(b?.images||[]).filter(x=>String(x).startsWith('data:')),files=Array.from($('#blog-image-files').files||[]);
    if(urls.length+existingData.length+files.length>5)throw new Error('A blog post can have a maximum of five images.');
    const uploaded=[];for(const file of files)uploaded.push(await mediaImage(file));
    const edit=$('#demo-editor').dataset.editId||'',payload={id:edit||id('blog'),title:f.elements['blog-title'].value.trim(),slug:f.elements['blog-slug'].value.trim(),excerpt:f.elements['blog-excerpt'].value.trim(),body:f.elements['blog-body'].value.trim(),images:[...urls,...existingData,...uploaded],status:f.elements['blog-status'].value};
    if(!payload.title||!payload.slug)throw new Error('Post title and URL slug are required.');
    if(edit)state.blogs=state.blogs.map(x=>x.id===edit?payload:x);else state.blogs.unshift(payload);
    save(edit?'Blog post updated.':'Blog post created.');render();
   }catch(err){toast(err.message||String(err))}
  };
 };
 const showVariantForm=(p,v)=>{
  $('#demo-editor')?.remove();
  const form='<form id="demo-variant-form"><div class="admin-form-grid">'+field('Variant name','variant-name',v?.name||'','text',false,'required')+field('SKU','variant-sku',v?.sku||'','text')+field('Selling price (₹)','variant-price',v?.price??p.price,'number',false,'min="0" step="0.01" required')+field('Cost price per unit (₹) · PRIVATE','variant-cost',v?.costPrice??p.costPrice,'number',false,'min="0" step="0.01" required')+field('Stock quantity','variant-stock',v?.stock??0,'number',false,'min="0" step="1" required')+'</div><div class="hero-buttons"><button class="btn" type="submit">Save variant</button><button class="btn dark" type="button" data-action="variants-back" data-id="'+p.id+'">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor(v?'Edit variant':'Add variant',form));$('#demo-editor').dataset.productId=p.id;$('#demo-editor').dataset.variantId=v?.id||'';
 };
 const renderVariants=p=>{
  $('#demo-editor')?.remove();const rows=p.variants.map(v=>'<tr><td>'+esc(v.name)+'</td><td>'+esc(v.sku)+'</td><td>'+moneyText(v.price)+'</td><td>'+moneyText(v.costPrice)+' <small>(private)</small></td><td>'+v.stock+'</td><td>'+button('variant-edit','Edit',p.id+'|'+v.id)+' '+button('variant-delete','Delete',p.id+'|'+v.id,true)+'</td></tr>').join('');
  host.insertAdjacentHTML('beforeend',editor('Variants · '+esc(p.name),'<p>Variant cost prices are included in internal gross-profit calculations only.</p>'+table(['Variant','SKU','Selling price','Cost price','Stock','Actions'],rows)+'<div class="hero-buttons">'+button('variant-add','Add variant',p.id)+'</div>'));$('#demo-editor').dataset.productId=p.id;
 };
 const addOfflineLine=()=>{
  const wrap=$('#offline-lines');if(!wrap)return;const options=state.products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+moneyText(p.price)+'</option>').join('');
  const row=document.createElement('div');row.className='offline-line';
  row.innerHTML='<select data-offline-product>'+options+'</select><input type="number" min="1" step="1" value="1" data-offline-qty aria-label="Quantity"><button type="button" data-action="offline-remove-line">Remove</button>';
  wrap.appendChild(row);updateOfflineTotal();
 };
 const updateOfflineTotal=()=>{
  const lines=$$('#offline-lines .offline-line');let sum=0;
  lines.forEach(row=>{const p=productById(row.querySelector('[data-offline-product]')?.value),qty=Number(row.querySelector('[data-offline-qty]')?.value||0);sum+=Number(p?.price||0)*qty});
  const total=$('#offline-total');if(total)total.textContent=moneyText(sum);
 };
 const showOfflineForm=()=>{
  $('#demo-editor')?.remove();const form='<form id="offline-form"><div class="admin-form-grid">'+field('Customer name','offline-name','','text',false,'placeholder="Walk-in customer"')+field('Phone number','offline-phone','','tel',false,'placeholder="Optional"')+field('Email address','offline-email','','email',false,'placeholder="Optional"')+field('Address / notes','offline-address','','text',false,'placeholder="Optional"')+field('Payment method','offline-payment','Cash','select',false,['Cash','UPI','Card','Bank transfer','Other'].map(x=>({value:x,label:x})))+'</div><h4>Bill items</h4><div id="offline-lines"></div><div class="hero-buttons">'+button('offline-add-line','Add item')+' <strong>Bill total: <span id="offline-total">₹0</span></strong></div><div class="hero-buttons"><button class="btn" type="submit">Create bill & record sale</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor('Create offline sales bill',form));$('#demo-editor').scrollIntoView({behavior:'smooth',block:'start'});addOfflineLine();
 };
 const showReturnForm=o=>{
  $('#demo-editor')?.remove();const form='<form id="return-form">'+field('Return / refund amount (₹)','return-amount',o.returnAmount||0,'number',false,'min="0" max="'+amount(o)+'" step="0.01" required')+field('Return reason','return-reason',o.returnReason||'','text',true,'placeholder="Reason for return"')+'<div class="hero-buttons"><button class="btn" type="submit">Save return</button><button class="btn dark" type="button" data-action="editor-close">Cancel</button></div></form>';
  host.insertAdjacentHTML('beforeend',editor('Record return · '+esc(o.orderNo),form));$('#demo-editor').dataset.orderId=o.id;
 };
 nav.innerHTML='<div class="admin-nav-label">AIREVO DEMO WORKSPACE</div>'+
  [['overview','Overview'],['products','Products & variants'],['categories','Categories'],['collections','Collections'],['orders','Orders, bills & returns'],['reviews','Customer reviews'],['blogs','Blog posts'],['inquiries','Enquiries']].map(x=>'<button type="button" data-admin-tab="'+x[0]+'">'+x[1]+'</button>').join('')+
  '<div style="margin-top:18px;padding-top:14px;border-top:1px solid #ffffff20"><small style="display:block;color:#8fa5b4;font-size:9px;line-height:1.5;margin-bottom:9px">Sample data · browser-only demo</small>'+button('reset-demo','Reset sample data')+'</div>';
 nav.onclick=e=>{
  const t=e.target.closest('[data-admin-tab]');if(t){setTab(t.dataset.adminTab);return}
  const a=e.target.closest('[data-action]');if(!a)return;
  if(a.dataset.action==='reset-demo'&&confirm('Reset all Airevo demo records to the original sample data?')){state=clone(seed);try{localStorage.removeItem(REV_KEY)}catch(_){}save('Demo data reset.');setTab('overview')}
 };
 host.onclick=e=>{
  const go=e.target.closest('[data-action="go-tab"]');if(go){setTab(go.dataset.id);return}
  const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,value=b.dataset.id;
  if(action==='editor-close'){$('#demo-editor')?.remove();return}
  if(action==='export-sales'){downloadExcel();return}
  if(action==='print-bill'){const o=state.orders.find(x=>x.id===value);if(o)printBill(o);return}
  if(action==='return-order'){const o=state.orders.find(x=>x.id===value);if(o)showReturnForm(o);return}
  if(action==='offline-sale'){showOfflineForm();return}
  if(action==='offline-add-line'){addOfflineLine();return}
  if(action==='offline-remove-line'){b.closest('.offline-line')?.remove();updateOfflineTotal();return}
  if(action==='product-add'){showProductForm(null);return}
  if(action==='product-edit'){const p=productById(value);if(p)showProductForm(p);return}
  if(action==='product-delete'){const p=productById(value);if(p&&confirm('Delete '+p.name+' from the demo catalogue?')){state.products=state.products.filter(x=>x.id!==value);save('Product deleted.');render()}return}
  if(action==='variants-open'){const p=productById(value);if(p)renderVariants(p);return}
  if(action==='variant-add'){const p=productById(value);if(p)showVariantForm(p,null);return}
  if(action==='variant-edit'||action==='variant-delete'||action==='variants-back'){
   const parts=value.split('|'),pid=parts[0],vid=parts[1],p=productById(pid);if(!p)return;
   if(action==='variants-back'){renderVariants(p);return}
   const v=p.variants.find(x=>x.id===vid);
   if(action==='variant-edit'&&v)showVariantForm(p,v);
   if(action==='variant-delete'&&v&&confirm('Delete this variant?')){p.variants=p.variants.filter(x=>x.id!==vid);save('Variant deleted.');renderVariants(p)}
   return;
  }
  if(action==='category-add'){showCategoryForm(null);return}
  if(action==='category-edit'){const c=state.categories.find(x=>x.id===value);if(c)showCategoryForm(c);return}
  if(action==='category-delete'){const c=state.categories.find(x=>x.id===value);if(c&&confirm('Delete this category? Products will become uncategorised.')){state.categories=state.categories.filter(x=>x.id!==value);state.products.forEach(p=>{if(p.categoryId===value)p.categoryId=''});save('Category deleted.');render()}return}
  if(action==='collection-add'){showCollectionForm(null);return}
  if(action==='collection-edit'){const c=state.collections.find(x=>x.id===value);if(c)showCollectionForm(c);return}
  if(action==='collection-toggle'){const c=state.collections.find(x=>x.id===value);if(c){c.active=!c.active;save('Collection status updated.');render()}return}
  if(action==='collection-delete'){if(confirm('Delete this collection?')){state.collections=state.collections.filter(x=>x.id!==value);save('Collection deleted.');render()}return}
  if(action==='review-toggle'){const r=state.reviews.find(x=>x.id===value);if(r){r.status=r.status==='Published'?'Rejected':'Published';save('Review status updated.');render()}return}
  if(action==='review-delete'){if(confirm('Delete this review?')){state.reviews=state.reviews.filter(x=>x.id!==value);save('Review deleted.');render()}return}
  if(action==='blog-add'){showBlogForm(null);return}
  if(action==='blog-edit'){const b=state.blogs.find(x=>x.id===value);if(b)showBlogForm(b);return}
  if(action==='blog-delete'){if(confirm('Delete this blog post?')){state.blogs=state.blogs.filter(x=>x.id!==value);save('Blog post deleted.');render()}return}
  if(action==='reset-demo'&&confirm('Reset demo data?')){state=clone(seed);save('Demo data reset.');setTab('overview');return}
 };
 host.onchange=e=>{
  const el=e.target;
  if(el.matches('[data-offline-product],[data-offline-qty]'))updateOfflineTotal();
  if(el.dataset.orderStatus){const o=state.orders.find(x=>x.id===el.dataset.orderStatus);if(o){o.status=el.value;save('Order status updated.');render()}}
  if(el.dataset.paymentStatus){const o=state.orders.find(x=>x.id===el.dataset.paymentStatus);if(o){o.payment=el.value;save('Payment status updated.');render()}}
  if(el.dataset.inquiryStatus){const q=state.inquiries.find(x=>x.id===el.dataset.inquiryStatus);if(q){q.status=el.value;save('Enquiry status updated.')}}
 };
 host.onsubmit=async e=>{
  const form=e.target;if(!form.id||!form.id.endsWith('-form'))return;
  e.preventDefault();const d=new FormData(form),val=n=>String(d.get(n)||'').trim(),num=n=>Number(d.get(n)||0),edit=$('#demo-editor')?.dataset.editId||'';
  if(form.id==='demo-category-form'){
   const payload={id:edit||id('cat'),name:val('category-name'),description:val('category-description')};if(!payload.name){toast('Enter a category name.');return}
   if(edit)state.categories=state.categories.map(x=>x.id===edit?payload:x);else state.categories.push(payload);save(edit?'Category updated.':'Category created.');render();return;
  }
  if(form.id==='demo-collection-form'){
   const payload={id:edit||id('col'),name:val('collection-name'),slug:val('collection-name').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),description:val('collection-description'),active:val('collection-active')==='Active',productIds:Array.from(form.querySelectorAll('[name="collection-product"]:checked')).map(x=>x.value),kind:state.collections.find(x=>x.id===edit)?.kind||'custom'};
   if(!payload.name){toast('Enter a collection name.');return}if(edit)state.collections=state.collections.map(x=>x.id===edit?payload:x);else state.collections.push(payload);save(edit?'Collection updated.':'Collection created.');render();return;
  }
  if(form.id==='demo-variant-form'){
   const pid=$('#demo-editor')?.dataset.productId||'',vid=$('#demo-editor')?.dataset.variantId||'',p=productById(pid);if(!p)return;
   const payload={id:vid||id('var'),name:val('variant-name'),sku:val('variant-sku'),price:num('variant-price'),costPrice:num('variant-cost'),stock:num('variant-stock')};
   if(!payload.name){toast('Enter a variant name.');return}if(vid)p.variants=p.variants.map(x=>x.id===vid?payload:x);else p.variants.push(payload);save(vid?'Variant updated.':'Variant created.');renderVariants(p);return;
  }
  if(form.id==='offline-form'){
   const lines=Array.from($('#offline-lines').querySelectorAll('.offline-line')).map(row=>{const p=productById(row.querySelector('[data-offline-product]').value),qty=Number(row.querySelector('[data-offline-qty]').value);if(!p||qty<1)throw new Error('Choose a valid product and quantity.');return {productId:p.id,name:p.name,sku:p.sku,qty,unitPrice:Number(p.price),unitCost:Number(p.costPrice)}}).filter(x=>x.qty>0);
   if(!lines.length){toast('Add at least one product to the bill.');return}
   const subtotal=lines.reduce((n,x)=>n+x.qty*x.unitPrice,0),o={id:id('ord'),orderNo:'ARV-OFF-'+Date.now().toString().slice(-8),date:today(),source:'Offline',customerName:val('offline-name')||'Walk-in customer',email:val('offline-email'),phone:val('offline-phone'),address:val('offline-address'),status:'Completed',payment:'Paid',paymentMethod:val('offline-payment'),shippingFee:0,discount:0,returnAmount:0,returnReason:'',items:lines};
   state.orders.unshift(o);lines.forEach(x=>{const p=productById(x.productId);if(p)p.stock=Math.max(0,Number(p.stock)-x.qty)});save('Offline bill created and added to sales.');renderOrders();setTimeout(()=>{const last=state.orders[0];if(last)printBill(last)},100);return;
  }
  if(form.id==='return-form'){
   const o=state.orders.find(x=>x.id===$('#demo-editor').dataset.orderId);if(!o)return;const v=num('return-amount');if(v<0||v>amount(o)){toast('Enter a return amount within the original bill total.');return}
   o.returnAmount=v;o.returnReason=val('return-reason');o.status=v>=amount(o)?'Returned':v>0?'Partially returned':o.status;o.payment=v>0?'Refunded':o.payment;save('Return recorded. Revenue and profit totals recalculated.');render();return;
  }
 };
 $('#admin-nav [data-action="reset-demo"]')?.addEventListener('click',()=>{});
 setTab('overview');
}
function render(){mountDemoDashboard()}
window.AirevoAdmin={render,verify};
})();