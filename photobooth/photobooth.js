const IMGBB_API_KEY="1d1aa4b919d175436c480b9509c088e7";
const LOCATION_LABEL="Jakarta";
const RECEIPT_WIDTH=576;

const video=document.getElementById('camera');
const startBtnCenter=document.getElementById('startBtnCenter');
const receiptCard=document.getElementById('receiptCard');
const photoPreview=document.getElementById('photoPreview');
const footerText=document.getElementById('footerText');
const previewControls=document.getElementById('previewControls');
const retryBtn=document.getElementById('retryBtn');
const printUploadBtn=document.getElementById('printUploadBtn');
const processingOverlay=document.getElementById('processingOverlay');
const filterBtn=document.getElementById('filterBtn');
const receiptCanvas=document.getElementById('receiptCanvas');
const rcCtx=receiptCanvas.getContext('2d');
let lastReceiptDataUrl=null;
let filterMode='normal';

async function openCamera(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:1920}},audio:false});
    video.srcObject=stream;
  }catch(e){alert('Tidak bisa mengakses kamera: '+(e.message||e));}
}
openCamera();

startBtnCenter.addEventListener('click',async()=>{
  startBtnCenter.style.display='none';
  await countdown(3);
  captureReceiptFrame();
});

retryBtn.addEventListener('click',()=>{
  previewControls.style.display='none';
  receiptCard.style.display='none';
  startBtnCenter.style.display='block';
  document.getElementById('cameraWrap').style.display='flex';
});

filterBtn.addEventListener('click',()=>{
  if(filterMode==='normal'){filterMode='bw';filterBtn.textContent='Filter: B&W';photoPreview.classList.add('bw');}
  else{filterMode='normal';filterBtn.textContent='Filter: Normal';photoPreview.classList.remove('bw');}
});

printUploadBtn.addEventListener('click',async()=>{
  try{
    processingOverlay.style.display='flex';
    const url=await uploadReceiptImage(lastReceiptDataUrl);
    processingOverlay.style.display='none';
    // encode full URL ImgBB
    const encodedUrl = encodeURIComponent(url);
    window.location.href = `preview.html?img=${encodedUrl}`;
  }catch(err){
    processingOverlay.style.display='none';
    alert('Upload gagal: '+(err.message||err));
    retryBtn.click();
  }
});

async function countdown(sec){
  const cd=document.getElementById('countdown');
  if(!cd) return;
  cd.style.display='block';
  for(let i=sec;i>0;i--){
    cd.textContent=i;
    await new Promise(r=>setTimeout(r,1000));
  }
  cd.style.display='none';
}

function captureReceiptFrame(){
  const vw=video.videoWidth||1280;
  const vh=video.videoHeight||720;
  const sideMargin=Math.round(RECEIPT_WIDTH*0.06);
  const photoW=RECEIPT_WIDTH-sideMargin*2;
  const scale=photoW/vw;
  const photoH=Math.round(vh*scale);
  const headerH=Math.round(RECEIPT_WIDTH*0.12);
  const footerH=Math.round(RECEIPT_WIDTH*0.2);
  const canvasW=RECEIPT_WIDTH;
  const canvasH=headerH+photoH+footerH;
  receiptCanvas.width=canvasW;
  receiptCanvas.height=canvasH;
  rcCtx.fillStyle='#fff'; rcCtx.fillRect(0,0,canvasW,canvasH);
  rcCtx.fillStyle='#000'; rcCtx.textAlign='center';
  rcCtx.font=`${Math.round(canvasW*0.06)}px monospace`; rcCtx.fillText('VIZRIZE PHOTOBOOTH RECEIPT',canvasW/2,Math.round(headerH*0.55));
  rcCtx.font=`${Math.round(canvasW*0.035)}px monospace`; rcCtx.fillText('Jakarta • Photobooth',canvasW/2,Math.round(headerH*0.88));
  const photoX=sideMargin; const photoY=headerH; const innerBorder=Math.max(6,Math.round(photoW*0.03));
  rcCtx.fillStyle='#fff'; rcCtx.fillRect(photoX,photoY,photoW,photoH);
  const tmp=document.createElement('canvas'); tmp.width=vw; tmp.height=vh; const tctx=tmp.getContext('2d');
  tctx.save(); tctx.scale(-1,1); tctx.drawImage(video,-vw,0,vw,vh); tctx.restore();
  rcCtx.drawImage(tmp,0,0,vw,vh,photoX+innerBorder,photoY+innerBorder,photoW-innerBorder*2,photoH-innerBorder*2);

  if(filterMode==='bw'){
    const imgData=rcCtx.getImageData(photoX+innerBorder,photoY+innerBorder,photoW-innerBorder*2,photoH-innerBorder*2);
    for(let i=0;i<imgData.data.length;i+=4){
      const avg=(imgData.data[i]+imgData.data[i+1]+imgData.data[i+2])/3;
      imgData.data[i]=imgData.data[i+1]=imgData.data[i+2]=avg;
    }
    rcCtx.putImageData(imgData,photoX+innerBorder,photoY+innerBorder);
  }

  const dateStr=new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
  rcCtx.fillStyle='#000'; rcCtx.font=`${Math.round(canvasW*0.04)}px monospace`; rcCtx.fillText(`${LOCATION_LABEL} • ${dateStr}`,canvasW/2,photoY+photoH+Math.round(footerH*0.45));
  rcCtx.font=`${Math.round(canvasW*0.03)}px monospace`; rcCtx.fillText('Scan QR untuk mengunduh foto',canvasW/2,photoY+photoH+Math.round(footerH*0.78));
  lastReceiptDataUrl=receiptCanvas.toDataURL('image/jpeg',0.92);
  photoPreview.src=lastReceiptDataUrl;
  footerText.textContent=`${LOCATION_LABEL} • ${dateStr}`;
  receiptCard.style.display='block';
  previewControls.style.display='flex';
  document.getElementById('cameraWrap').style.display='none';
}

async function uploadReceiptImage(dataUrl){
  if(!dataUrl) throw new Error('Tidak ada gambar');
  const base64=dataUrl.split(',')[1]; const form=new FormData();
  form.append('image',base64); form.append('name',`vizrize_${Date.now()}`);
  const resp=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,{method:'POST',body:form});
  if(!resp.ok) throw new Error('ImgBB upload gagal (network)');
  const json=await resp.json();
  if(!json||!json.data||!json.data.url) throw new Error('ImgBB tidak mengembalikan URL');
  return json.data.url;
}
