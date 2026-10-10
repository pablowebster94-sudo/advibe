// En enfoque.advibeagencia.com el middleware sirve esto como /robots.txt.
export function GET(){
  const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com").replace(/\/$/,"");
  const body=["User-agent: *","Allow: /","Allow: /busco-propiedad","Disallow: /admin","Disallow: /enfoque-visual/admin","Disallow: /api/","",`Sitemap: ${base}/sitemap.xml`,""].join("\n");
  return new Response(body,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=3600"}});
}
