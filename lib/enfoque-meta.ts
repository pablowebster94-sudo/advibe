async function sha256(value:string){
  const data=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
function norm(value:string){return value.trim().toLowerCase();}
function normalizePhone(value:string){
  const digits=value.replace(/\D/g,"");
  if(!digits)return "";
  if(digits.startsWith("00"))return "+"+digits.slice(2);
  if(digits.startsWith("593"))return "+"+digits;
  if(digits.startsWith("0"))return "+593"+digits.slice(1);
  return "+"+digits;
}
export async function sendMetaEvent(input:{
  event_name:"Contact"|"Lead";event_id:string;email?:string|null;phone?:string|null;
  fbp?:string|null;fbc?:string|null;value?:number;currency?:string;
  content_id?:string;content_type?:string;source?:string;url?:string
}){
  const token=process.env.META_ENFOQUE_ACCESS_TOKEN;
  const pixel=process.env.META_ENFOQUE_PIXEL_ID;
  if(!token||!pixel)return {sent:false,reason:"not_configured"};
  const user_data:any={};
  if(input.email)user_data.em=[await sha256(norm(input.email))];
  if(input.phone){
    const normalizedPhone=normalizePhone(input.phone);
    if(normalizedPhone)user_data.ph=[await sha256(normalizedPhone)];
  }
  if(input.fbp)user_data.fbp=input.fbp;
  if(input.fbc)user_data.fbc=input.fbc;
  const event={
    event_name:input.event_name,event_time:Math.floor(Date.now()/1000),event_id:input.event_id,
    action_source:"website",event_source_url:input.url||"https://enfoque.advibeagencia.com",
    user_data,
    custom_data:{content_id:input.content_id,content_type:input.content_type,value:input.value,currency:input.currency||"USD",source:input.source}
  };
  const version=process.env.META_ENFOQUE_GRAPH_API_VERSION||"v26.0";
  const r=await fetch(`https://graph.facebook.com/${version}/${pixel}/events`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({data:[event],access_token:token}),cache:"no-store"
  });
  return {sent:r.ok,status:r.status};
}
