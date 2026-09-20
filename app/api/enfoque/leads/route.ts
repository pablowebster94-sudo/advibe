import {NextResponse} from "next/server";
export async function POST(req:Request){
  try{
    const body=await req.json();
    const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(url&&key){
      const r=await fetch(url+"/rest/v1/leads",{method:"POST",headers:{"Content-Type":"application/json","apikey":key,"Authorization":"Bearer "+key,"Prefer":"return=minimal"},body:JSON.stringify(body)});
      if(!r.ok)return NextResponse.json({ok:false,error:"No se pudo guardar el lead."},{status:500});
    }
    if(process.env.META_ACCESS_TOKEN&&process.env.META_PIXEL_ID){
      fetch("https://graph.facebook.com/v23.0/"+process.env.META_PIXEL_ID+"/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[{event_name:"Lead",event_time:Math.floor(Date.now()/1000),action_source:"website",user_data:{em:body.email?[body.email]:undefined,ph:body.phone?[body.phone]:undefined},custom_data:{content_id:body.content_id,content_type:body.content_type,value:body.value,currency:"USD"}}],access_token:process.env.META_ACCESS_TOKEN})}).catch(()=>{});
    }
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({ok:false,error:"Solicitud inválida"},{status:400})}
}