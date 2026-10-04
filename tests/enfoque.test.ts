import {test} from "node:test";
import assert from "node:assert/strict";
import {parseVideoUrl} from "../lib/enfoque-video";
import {filterProperties,filterVehicles,options,readPropertyFilters,readVehicleFilters,activeFilterCount} from "../lib/enfoque-filters";
import {features,propertyPayload,slugify,vehiclePayload} from "../lib/enfoque-listing";
import {demoAllowed} from "../lib/enfoque-catalog";
import {capiFields,isE164,isValidPhone,normalizePhone,resolveFbc,resolveFbp,sendMetaEvent} from "../lib/enfoque-meta";
import {supabaseHeaders} from "../lib/enfoque-supabase";
import {jwtSecondsLeft} from "../lib/enfoque-session";
import {quickPatch} from "../lib/enfoque-listing";
import {createHash} from "node:crypto";
import {orderImages} from "../lib/enfoque-supabase";
import {runHealthChecks} from "../lib/enfoque-health";
import {properties,vehicles} from "../lib/enfoque-data";

test("video: YouTube, Shorts, youtu.be y Vimeo se convierten en embed", () => {
  const yt="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1";
  for(const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ","https://youtu.be/dQw4w9WgXcQ?si=x","https://youtube.com/shorts/dQw4w9WgXcQ","https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=3"])
    assert.deepEqual(parseVideoUrl(u),{kind:"iframe",provider:"youtube",src:yt});
  assert.equal(parseVideoUrl("https://vimeo.com/123456789")?.src,"https://player.vimeo.com/video/123456789?dnt=1");
  assert.equal(parseVideoUrl("https://vimeo.com/123456789/abc123def")?.src,"https://player.vimeo.com/video/123456789?dnt=1&h=abc123def");
  assert.deepEqual(parseVideoUrl("https://cdn.x.com/a/recorrido.mp4"),{kind:"file",src:"https://cdn.x.com/a/recorrido.mp4"});
});

test("video: rechaza http, dominios desconocidos y basura", () => {
  for(const u of ["http://youtu.be/dQw4w9WgXcQ","https://evil.com/watch?v=dQw4w9WgXcQ","https://youtube.com/watch?v=<script>","javascript:alert(1)","",null,undefined,"no es url"])
    assert.equal(parseVideoUrl(u as string),null);
});

test("filtros de propiedades: operación, ciudad sin tildes/mayúsculas, precio, habitaciones y texto", () => {
  const f=(q:Record<string,string>)=>filterProperties(properties,readPropertyFilters(q)).map(x=>x.id);
  assert.deepEqual(f({operacion:"alquiler"}),["p4"]);
  assert.deepEqual(f({ciudad:"CUENCA",tipo:"departamento"}),["p2","p4"]);
  assert.deepEqual(f({min:"90000",max:"200000"}),["p1","p2"]);
  assert.deepEqual(f({habitaciones:"4"}),["p1"]);
  assert.deepEqual(f({q:"batán"}),["p2"]);
  assert.deepEqual(f({orden:"precio_asc"}),["p4","p3","p2","p1"]);
  assert.deepEqual(f({min:"abc"}),["p1","p2","p3","p4"]);
});

test("filtros de vehículos: marca, año, combustible (con y sin tilde) y transmisión", () => {
  const f=(q:Record<string,string>)=>filterVehicles(vehicles,readVehicleFilters(q)).map(x=>x.id);
  assert.deepEqual(f({marca:"toyota"}),["v2"]);
  assert.deepEqual(f({desde:"2021"}),["v2"]);
  assert.deepEqual(f({combustible:"diesel"}),["v2"]);
  assert.deepEqual(f({transmision:"automatica",max:"30000"}),["v1"]);
  assert.equal(activeFilterCount(readVehicleFilters({marca:"x",orden:"precio_asc"})),1);
});

test("options deduplica por forma normalizada y ordena", () => {
  assert.deepEqual(options(["Cuenca","cuenca","Azogues",undefined,""]),["Azogues","Cuenca"]);
});

test("slugify genera slugs válidos para el esquema", () => {
  assert.equal(slugify("Casa contemporánea en Gualaceo — 2 plantas!"),"casa-contemporanea-en-gualaceo-2-plantas");
  assert.equal(slugify("  --MINI Cooper S 2020--  "),"mini-cooper-s-2020");
  assert.match(slugify("x".repeat(300)),/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("propertyPayload valida y normaliza", () => {
  const ok=propertyPayload({title:"Casa en Gualaceo",price:"190000",city:"Gualaceo",bedrooms:"4",bathrooms:"2.4",features:"- Patio\nPatio\n\n✓ Cocina amplia",video_url:"https://youtu.be/dQw4w9WgXcQ",property_type:"hack"});
  assert.ok(ok.ok);
  if(ok.ok){
    assert.equal(ok.data.slug,"casa-en-gualaceo");
    assert.equal(ok.data.bathrooms,2.5);
    assert.deepEqual(ok.data.features,["Patio","Cocina amplia"]);
    assert.equal(ok.data.property_type,"casa");
    assert.equal(ok.data.land_area_m2,null);
    assert.equal(ok.data.publication_status,"borrador");
  }
  assert.equal(propertyPayload({title:"Casa",price:"1",city:"x"}).ok,false);
  assert.equal(propertyPayload({title:"Casa bonita",price:"-5",city:"x"}).ok,false);
  assert.equal(propertyPayload({title:"Casa bonita",price:"5",city:"x",video_url:"https://evil.com/v"}).ok,false);
  const noVideo=propertyPayload({title:"Casa bonita",price:"5",city:"x",video_url:""});
  assert.ok(noVideo.ok&&noVideo.data.video_url===null);
});

test("vehiclePayload valida y arma el slug con marca-modelo-año", () => {
  const ok=vehiclePayload({brand:"Toyota",model:"Fortuner",year:"2022",price:"46500",mileage_km:"",fuel:"diesel"});
  assert.ok(ok.ok&&ok.data.slug==="toyota-fortuner-2022"&&ok.data.mileage_km===0&&ok.data.fuel==="diesel");
  assert.equal(vehiclePayload({brand:"Toyota",model:"X",year:"1800",price:"1"}).ok,false);
  assert.deepEqual(features(["a"," a ","b"]),["a","b"]);
});

test("datos demo: nunca en producción salvo opt-in explícito", () => {
  assert.equal(demoAllowed({NODE_ENV:"production"}),false);
  assert.equal(demoAllowed({NODE_ENV:"development"}),true);
  assert.equal(demoAllowed({NODE_ENV:"production",ENFOQUE_ALLOW_DEMO:"true"}),true);
  assert.equal(demoAllowed({NODE_ENV:"development",ENFOQUE_ALLOW_DEMO:"false"}),false);
});

test("teléfonos de Ecuador se normalizan a E.164", () => {
  assert.equal(normalizePhone("099 123 4567"),"+593991234567");
  assert.equal(normalizePhone("991234567"),"+593991234567");
  assert.equal(normalizePhone("+593 99-123-4567"),"+593991234567");
  assert.equal(normalizePhone("0034 612 345 678"),"+34612345678");
  assert.ok(isE164(normalizePhone("0991234567")));
  assert.equal(isE164(normalizePhone("123")),false);
});

test("capiFields refleja el resultado de CAPI", () => {
  assert.equal(capiFields({sent:true}).capi_status,"enviado");
  assert.deepEqual(capiFields({sent:false,reason:"not_configured"}),{capi_status:"omitido"});
  assert.equal(capiFields({sent:false,status:400,body:"bad"}).capi_last_error,"HTTP 400: bad");
});

test("orderImages pone la portada primero y respeta sort_order", () => {
  const r=orderImages([{id:"a",sort_order:0},{id:"b",sort_order:2,is_cover:true},{id:"c",sort_order:1}]);
  assert.deepEqual(r.map(x=>x.id),["b","a","c"]);
});

test("health: detecta WhatsApp, CAPI y pixel mal configurados sin exponer secretos", async () => {
  const checks=await runHealthChecks({NODE_ENV:"production",META_ENFOQUE_PIXEL_ID:"111",NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID:"222",META_ENFOQUE_ACCESS_TOKEN:"secreto-no-mostrar"},{remote:false});
  const by=Object.fromEntries(checks.map(c=>[c.id,c]));
  assert.equal(by.whatsapp.status,"error");
  assert.equal(by.supabase_public.status,"error");
  assert.equal(by.demo.status,"ok");
  assert.equal(by.dedup.status,"error");
  assert.ok(!JSON.stringify(checks).includes("secreto-no-mostrar"));
  const good=await runHealthChecks({NEXT_PUBLIC_WHATSAPP_NUMBER:"+593 98 496 6335"},{remote:false});
  assert.equal(good.find(c=>c.id==="whatsapp")?.status,"ok");
});

test("teléfonos: valida longitud real en Ecuador", () => {
  assert.equal(isValidPhone(normalizePhone("0991234567")),true);   // móvil
  assert.equal(isValidPhone(normalizePhone("072123456")),true);    // fijo Cuenca
  assert.equal(isValidPhone(normalizePhone("099123456")),false);   // móvil corto
  assert.equal(isValidPhone(normalizePhone("09912345678")),false); // móvil largo
  assert.equal(isValidPhone(normalizePhone("+34 612 345 678")),true);
});

test("_fbc/_fbp: cookie válida o fbclid del clic", () => {
  assert.equal(resolveFbc("fb.1.1700000000000.AbC",null),"fb.1.1700000000000.AbC");
  assert.equal(resolveFbc(null,{fbclid:"IwAR123",ts:1700000000123}),"fb.1.1700000000123.IwAR123");
  assert.equal(resolveFbc("basura",null),null);
  assert.equal(resolveFbp("fb.1.1700000000000.123456789"),"fb.1.1700000000000.123456789");
  assert.equal(resolveFbp("x"),null);
});

test("supabaseHeaders: claves nuevas solo en apikey; JWT también en Authorization", () => {
  assert.deepEqual(supabaseHeaders("service",undefined,{SUPABASE_SERVICE_ROLE_KEY:"sb_secret_x"}),{apikey:"sb_secret_x"});
  assert.deepEqual(supabaseHeaders("public",undefined,{NEXT_PUBLIC_SUPABASE_ANON_KEY:"eyJabc"}),{apikey:"eyJabc",Authorization:"Bearer eyJabc"});
  assert.deepEqual(supabaseHeaders("user","tok",{NEXT_PUBLIC_SUPABASE_ANON_KEY:"sb_publishable_y",SUPABASE_SERVICE_ROLE_KEY:"eyJsecret"}),{apikey:"sb_publishable_y",Authorization:"Bearer tok"});
});

test("jwtSecondsLeft lee exp sin verificar firma", () => {
  const b64=(o:object)=>Buffer.from(JSON.stringify(o)).toString("base64url");
  const token=`${b64({alg:"HS256"})}.${b64({exp:2000})}.firma`;
  assert.equal(jwtSecondsLeft(token,1000*1000),1000);
  assert.equal(jwtSecondsLeft("no-es-jwt"),-1);
});

test("quickPatch solo acepta estado, disponibilidad y destacado válidos", () => {
  assert.deepEqual(quickPatch({publication_status:"publicado",title:"ignorado"}),{ok:true,data:{publication_status:"publicado"}});
  assert.equal(quickPatch({publication_status:"hackeado"}).ok,false);
  assert.equal(quickPatch({}).ok,false);
  assert.deepEqual(quickPatch({is_featured:1}),{ok:true,data:{is_featured:true}});
});

test("sendMetaEvent: payload CAPI con hashes correctos, dedup y errores sin lanzar", async () => {
  const sha=(v:string)=>createHash("sha256").update(v).digest("hex");
  const env={...process.env};const realFetch=globalThis.fetch;
  try{
    delete process.env.META_ENFOQUE_PIXEL_ID;delete process.env.META_ENFOQUE_ACCESS_TOKEN;
    assert.deepEqual(await sendMetaEvent({event_name:"Lead",event_id:"e1"}),{sent:false,reason:"not_configured"});
    process.env.META_ENFOQUE_PIXEL_ID="999";process.env.META_ENFOQUE_ACCESS_TOKEN="tok";delete process.env.META_ENFOQUE_TEST_EVENT_CODE;
    type Captured={test_event_code?:string;data:Array<{event_id:string;action_source:string;user_data:Record<string,unknown>;custom_data:Record<string,unknown>}>};
    let captured:Captured={data:[]};let url="";
    globalThis.fetch=(async(u:string,init:RequestInit)=>{url=u;captured=JSON.parse(String(init.body));return new Response('{"events_received":1}',{status:200});}) as typeof fetch;
    const r=await sendMetaEvent({event_name:"Lead",event_id:"evt-1",email:" Ana@Mail.com ",phone:"099 123 4567",fbp:"fb.1.1.2",fbc:"fb.1.1.abc",
      client_ip:"1.2.3.4",user_agent:"UA",external_id:"visitor",value:190000,content_id:"prop-1",content_type:"home_listing",url:"https://enfoque.advibeagencia.com/x"});
    assert.equal(r.sent,true);
    assert.match(url,/\/999\/events$/);
    const ev=captured.data[0];
    assert.equal(ev.event_id,"evt-1");
    assert.equal(ev.action_source,"website");
    assert.deepEqual(ev.user_data.em,[sha("ana@mail.com")]);
    assert.deepEqual(ev.user_data.ph,[sha("593991234567")]);
    assert.deepEqual(ev.user_data.external_id,[sha("visitor")]);
    assert.equal(ev.user_data.client_ip_address,"1.2.3.4");
    assert.equal(ev.user_data.fbc,"fb.1.1.abc");
    assert.deepEqual(ev.custom_data.content_ids,["prop-1"]);
    assert.equal(ev.custom_data.currency,"USD");
    assert.equal(captured.test_event_code,undefined);
    globalThis.fetch=(async()=>new Response('{"error":{"message":"Invalid token"}}',{status:400})) as typeof fetch;
    const bad=await sendMetaEvent({event_name:"Contact",event_id:"e2"});
    assert.equal(bad.sent,false);assert.equal(capiFields(bad).capi_status,"fallido");
    globalThis.fetch=(async()=>{throw new Error("red caída");}) as typeof fetch;
    const down=await sendMetaEvent({event_name:"Contact",event_id:"e3"});
    assert.deepEqual(down,{sent:false,reason:"network_error"});
  }finally{globalThis.fetch=realFetch;process.env=env;}
});
