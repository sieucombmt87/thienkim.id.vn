const brandData={
 dmx:{name:'Điện Máy Xanh',colors:'xanh dương - vàng',style:'vui tươi, mạnh mẽ, rõ ưu đãi, dễ chốt đơn',logo:'Logo Điện Máy Xanh'},
 tgdd:{name:'Thế Giới Di Động',colors:'đen - vàng',style:'hiện đại, bán lẻ công nghệ, nổi bật giá và quà tặng',logo:'Logo Thế Giới Di Động'},
 topzone:{name:'TopZone',colors:'đen premium - trắng - ánh kim',style:'Apple premium, tối giản, sang trọng, cao cấp',logo:'Logo TopZone'}
};
let currentBrand='dmx';
const $=id=>document.getElementById(id);
document.querySelectorAll('.brand-card').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.brand-card').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentBrand=btn.dataset.brand;});
function inferProduct(text){
 const clean=(text||'').trim();
 let name=clean || 'Sản phẩm nổi bật';
 if(clean.includes('/')) name=decodeURIComponent(clean.split('/').filter(Boolean).pop().replaceAll('-',' ')).replace(/\?.*/,'');
 return name.replace(/\bhtml\b/gi,'').trim().replace(/\s+/g,' ');
}
function generate(){
 const product=inferProduct($('productInput').value);
 const price=$('priceInput').value.trim()||'Giá ưu đãi cập nhật tại cửa hàng';
 const promo=$('promoInput').value.trim()||'Trả góp linh hoạt • Nhiều quà tặng hấp dẫn • Hỗ trợ tư vấn tận nơi';
 const address=$('storeAddress').value.trim()||'Thông tin cửa hàng chưa cập nhật';
 const phone=$('storePhone').value.trim()||'Hotline đang cập nhật';
 const brand=brandData[currentBrand];
 $('productBrain').classList.remove('empty');
 $('productBrain').innerHTML=`<b>Thương hiệu:</b> ${brand.name}<br><b>Sản phẩm:</b> ${product}<br><b>Giá:</b> ${price}<br><b>Khuyến mãi:</b> ${promo}<br><b>Nhận diện:</b> ${brand.colors}<br><b>Phong cách:</b> ${brand.style}<br><b>Cửa hàng:</b> ${address}<br><b>Liên hệ:</b> ${phone}`;
 $('captionOutput').value=`🔥 ${product.toUpperCase()} ĐANG CÓ ƯU ĐÃI CỰC NGON!\n\nGiá chỉ từ: ${price}\n${promo}\n\nGhé ngay ${brand.name} để được tư vấn và giữ ưu đãi hôm nay.\n📍 ${address}\n☎️ ${phone}\n\n#${brand.name.replaceAll(' ','')} #ThienKimAI #KhuyenMaiHot`;
 $('promptOutput').value=`Create a high-converting Vietnamese retail marketing poster for ${brand.name}. Product: ${product}. Price: ${price}. Promotion: ${promo}. Brand identity: ${brand.colors}. Visual style: ${brand.style}. Layout: premium advertising poster, bold Vietnamese typography, clear product hero image, strong CTA, sale badge, modern lighting, clean readable composition, ready to edit in Canva. Include store info: ${address}, ${phone}. Do not invent wrong logo. Leave editable text areas for price, promotion, QR code, hotline and address.`;
 $('qualityOutput').innerHTML=[
  ['Logo đúng thương hiệu',brand.logo],['Màu nhận diện',brand.colors],['Giá bán',price],['Khuyến mãi',promo],['Địa chỉ',address],['Hotline',phone],['CTA','Đã có lời kêu gọi hành động'],['Canva','Prompt có vùng text dễ chỉnh sửa']
 ].map(([a,b])=>`<div class="check-item"><span class="ok">✓</span> <b>${a}</b><br><span>${b}</span></div>`).join('');
 makeExport('Poster Facebook 1:1');
}
function makeExport(format){
 const brand=brandData[currentBrand]; const product=inferProduct($('productInput').value); const price=$('priceInput').value||'Giá ưu đãi';
 $('exportOutput').value=`GÓI XUẤT: ${format}\nBrand: ${brand.name}\nSản phẩm: ${product}\nGiá: ${price}\nStyle: ${brand.style}\nTỉ lệ đề xuất: ${format.includes('Story')?'9:16':format.includes('Banner')?'16:9':'1:1'}\nNội dung chính: Tên sản phẩm + giá + khuyến mãi + CTA + địa chỉ + hotline + QR.`;
}
document.querySelectorAll('.copyBtn').forEach(btn=>btn.onclick=async()=>{const el=$(btn.dataset.target);await navigator.clipboard.writeText(el.value);btn.textContent='Đã copy';setTimeout(()=>btn.textContent='Copy',1200)});
document.querySelectorAll('.export-grid button').forEach(btn=>btn.onclick=()=>makeExport(btn.dataset.format));
$('generateBtn').onclick=generate;
$('sampleBtn').onclick=()=>{$('productInput').value='Samsung Galaxy A56 5G';$('priceInput').value='9.990.000đ';$('promoInput').value='Trả góp 0% • Giảm thêm khi thu cũ đổi mới • Tặng voucher phụ kiện';$('storePhone').value='0935 xxx xxx';generate();};
$('clearBtn').onclick=()=>location.reload();
