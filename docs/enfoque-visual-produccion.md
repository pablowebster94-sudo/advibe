# Enfoque Visual — checklist de salida a producción

Verificación manual que el código no puede hacer por sí solo. Orden recomendado.

## 1. Variables de entorno
Usa `docs/enfoque-visual-env.example` (nombres exactos). Tras desplegar, entra a
**/enfoque-visual/admin/estado**: debe estar todo en ✓ salvo GA (opcional).

## 2. Supabase
- [ ] `supabase/schema.sql` y `supabase/migrations/*` aplicados.
- [ ] Bucket `listing-media` existe y es público.
- [ ] Crear una propiedad de prueba desde el panel con 3 fotos + video → publicarla → se ve en el catálogo y en la ficha.
- [ ] Reordenar fotos y cambiar portada → el catálogo muestra la nueva portada.
- [ ] Eliminar la propiedad de prueba → desaparecen también sus archivos de Storage.

## 3. Datos demo
- [ ] En producción el catálogo NO muestra la casa de Gualaceo de $190.000 ni los vehículos de ejemplo
      (si Supabase está vacío, se ve “Pronto tendremos publicaciones aquí”).
- [ ] `/propiedades/casa-gualaceo-divina-misericordia` responde 404.

## 4. WhatsApp → Contact
- [ ] En una ficha, “Escribir por WhatsApp” abre el número correcto con el mensaje y `(Ref: EV-XXXXX)`.
- [ ] En /admin/estado, “Últimos eventos” muestra un `Contact` con CAPI `enviado`.

## 5. Formulario → Lead
- [ ] Enviar el formulario de una ficha con un teléfono `09XXXXXXXX` → aparece en /admin/leads, vinculado a la publicación.
- [ ] En /admin/estado aparece el `Lead` con CAPI `enviado`.

## 6. Meta CAPI
- [ ] Administrador de eventos → dataset → **Probar eventos** → copiar código TEST…
- [ ] /admin/estado → “Probar Meta CAPI” → el evento aparece en Meta.
- [ ] Con el Pixel Helper, comprobar que `Lead`/`Contact` del navegador y del servidor llegan con el mismo `event_id` (Meta los marca como deduplicados).
- [ ] Revisar calidad de coincidencia (EMQ) del dataset tras unos días.

## 7. Móvil, SEO y rendimiento
- [ ] Lighthouse móvil en home, catálogo y una ficha (objetivo: LCP < 2,5 s).
- [ ] `https://enfoque.advibeagencia.com/sitemap.xml` y `/robots.txt` responden y listan las fichas publicadas.
- [ ] Enviar el sitemap a Google Search Console.
- [ ] Compartir una ficha en WhatsApp → la vista previa muestra foto, título y precio.
