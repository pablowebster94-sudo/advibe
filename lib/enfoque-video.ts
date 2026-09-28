// Videos de las fichas: se guardan como URL (YouTube, Vimeo o un .mp4/.webm
// público por https). No se suben a Storage; ver supabase/schema.sql.

export type VideoEmbed =
  | {kind:"iframe";src:string;provider:"youtube"|"vimeo"}
  | {kind:"file";src:string};

const YT_ID=/^[A-Za-z0-9_-]{11}$/;

export function parseVideoUrl(raw:string|null|undefined):VideoEmbed|null {
  const value=(raw||"").trim();
  if(!value)return null;
  let url:URL;
  try{url=new URL(value);}catch{return null;}
  if(url.protocol!=="https:")return null;
  const host=url.hostname.replace(/^www\.|^m\./,"");

  if(host==="youtu.be"){
    const id=url.pathname.slice(1).split("/")[0];
    return YT_ID.test(id)?youtube(id):null;
  }
  if(host==="youtube.com"||host==="youtube-nocookie.com"){
    const parts=url.pathname.split("/").filter(Boolean);
    const id=parts[0]==="watch"?url.searchParams.get("v")||""
      :["embed","shorts","live","v"].includes(parts[0])?parts[1]||"":"";
    return YT_ID.test(id)?youtube(id):null;
  }
  if(host==="vimeo.com"||host==="player.vimeo.com"){
    const parts=url.pathname.split("/").filter(Boolean);
    const id=parts.find(p=>/^\d+$/.test(p));
    if(!id)return null;
    const hash=url.searchParams.get("h")||parts[parts.indexOf(id)+1];
    const h=hash&&/^[a-f0-9]+$/i.test(hash)?"&h="+hash:"";
    return {kind:"iframe",provider:"vimeo",src:`https://player.vimeo.com/video/${id}?dnt=1${h}`};
  }
  if(/\.(mp4|webm|mov)$/i.test(url.pathname))return {kind:"file",src:url.toString()};
  return null;
}

function youtube(id:string):VideoEmbed {
  return {kind:"iframe",provider:"youtube",src:`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`};
}
