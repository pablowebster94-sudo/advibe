import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {runHealthChecks} from "@/lib/enfoque-health";
import {sendMetaEvent} from "@/lib/enfoque-meta";

export async function GET(){
  if(!await getAdminSession())return NextResponse.json({error:"No autorizado"},{status:401});
  return NextResponse.json({checks:await runHealthChecks()});
}

// Envía un evento Lead de PRUEBA a CAPI con el test_event_code que da Meta en "Probar eventos".
export async function POST(req:Request){
  if(!await getAdminSession())return NextResponse.json({error:"No autorizado"},{status:401});
  const {test_event_code}=await req.json().catch(()=>({}));
  if(typeof test_event_code!=="string"||!/^TEST[A-Z0-9]+$/i.test(test_event_code.trim()))
    return NextResponse.json({error:"Pega el código de prueba de Meta (empieza por TEST)."},{status:400});
  const result=await sendMetaEvent({event_name:"Lead",event_id:crypto.randomUUID(),email:"prueba@advibeagencia.com",
    content_type:"test",source:"admin_health",test_event_code:test_event_code.trim(),
    client_ip:req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||null,user_agent:req.headers.get("user-agent")});
  return NextResponse.json(result,{status:result.sent?200:502});
}
