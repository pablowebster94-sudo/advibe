import {parseVideoUrl} from "@/lib/enfoque-video";

export function ListingVideo({url,title}:{url?:string;title:string}){
  const video=parseVideoUrl(url);
  if(!video)return null;
  return <section className="mt-10" aria-label="Video">
    <h2 className="text-2xl font-black">Video</h2>
    <div className="mt-4 aspect-video overflow-hidden rounded-3xl bg-black">
      {video.kind==="iframe"
        ?<iframe src={video.src} title={"Video de "+title} loading="lazy" className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        :<video src={video.src} controls playsInline preload="metadata" className="h-full w-full"/>}
    </div>
  </section>;
}
