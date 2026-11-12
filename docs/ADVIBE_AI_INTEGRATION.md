# AdVibe AI — plan de integración

## Estado
- Rama de trabajo: `feature/advibe-ai-integration`
- Base: `main` en commit `33082d0871aa9df539b80813f9c4cedfab9d8bfe`
- Primer commit de esta rama: documentación del plan y auditoría.
- Alcance: integración gradual; no se han cambiado producción, variables ni el proyecto raíz.
- Este documento registra el estado observado y las puertas de aceptación. No implica que las fases de código estén implementadas.

## Decisión de arquitectura
Usar `ventads-ai/` como núcleo de producto (dominio, persistencia, orquestación de campañas, cola, renderizado y almacenamiento). El proyecto raíz actual es principalmente el sitio web de AdVibe y no contiene el editor publicitario conversacional que se había supuesto en una revisión anterior. Por tanto, no se deben importar componentes de un supuesto `/crear` ni de `AdCreator.tsx` sin encontrarlos en la rama actual. Mantener los dos proyectos independientes y conectar el sitio público al producto mediante un enlace o dominio cuando corresponda.

## Hallazgos verificados

### Aplicación raíz
- Next.js 16.2.10 / React 19.2.4, con `package.json` independiente.
- El README raíz sigue siendo el README inicial de Next.js y no describe el producto.
- La estructura actual de `app/` corresponde al sitio web de AdVibe y secciones de negocio.
- Las rutas de API raíz observadas incluyen `/api/meta/capi`, `/api/chat`, `/api/enfoque` y `/api/am-motorsport`.
- En el árbol actual inspeccionado no se encontró `app/crear`, `components/AdCreator.tsx`, `ChatInterface.tsx` ni un endpoint `/api/meta/publish`. No asumir que existen en `main`.
- `/api/meta/capi` es Conversions API para eventos web; no es una integración de publicación de anuncios.

### ventads-ai
- Proyecto Next.js independiente dentro de `ventads-ai/`, con su propio `package.json`, lockfile, configuración y aplicación App Router.
- Next.js 16, React 19, TypeScript, Prisma 7 y PostgreSQL.
- Dominio existente de marcas, productos, campañas, conceptos, copies y creatividades.
- APIs existentes para marcas, productos, campañas, creatividades, uploads, procesamiento de jobs y generación de campañas.
- `POST /api/campaigns` recibe datos validados por `campaignInputSchema`, verifica que el producto pertenezca al usuario demo, persiste la campaña y crea conceptos/copies/creatives pendientes; devuelve `{ campaign }` con HTTP 201.
- `POST /api/generate-ad-campaign` requiere `productId` y `objective`, acepta contexto opcional y devuelve `{ success, data }`. Usa Gemini/Claude/OpenAI server-side con fallback determinista.
- `GET/POST /api/brands` y `GET/POST /api/products` gestionan los registros asociados al usuario actual.
- La autenticación de aplicación es actualmente Basic Auth en `proxy.ts` y un usuario demo implícito en `lib/auth.ts`; NO es autenticación multiusuario. La autorización por userId existe en consultas de productos y marcas, pero el usuario se resuelve a una identidad fija.
- La generación de imagen usa `ImageGenerationService`; el proveedor implementado es local compositor y Gemini. Pixazo no aparece en el adaptador actual inspeccionado y no debe declararse integrado.
- El proveedor Gemini incluye protecciones para no redibujar la foto original: usa cutout/fondo y compone el producto real; el texto se renderiza mediante el compositor.
- La cola persiste el trabajo en registros Creative y usa workers HTTP.
- Storage soporta local, database y S3 compatible según configuración/código. En Vercel no se debe depender del filesystem efímero.
- `ventads-ai/vercel.json` tiene un cron diario `0 3 * * *`, no `*/5 * * * *`.

### Vercel
- El equipo ADVIBE está en plan Hobby.
- Existe un proyecto Vercel llamado `advibe-ai`, conectado al repositorio `pablowebster94-sudo/advibe`, con dominios `advibe-ai-six.vercel.app` y `advibe-ai-advibe.vercel.app`.
- La configuración consultada muestra SSO protection habilitada para todos excepto dominios custom. No se verificó el Root Directory porque la lectura de proyecto consultada no expuso ese campo.
- Al momento de la consulta, Vercel reportó el deployment más reciente en estado BUILDING. No se ha iniciado ni modificado ningún deployment desde esta rama.
- No se consultaron ni copiaron valores de variables de entorno.

## Restricciones obligatorias
1. No modificar `main` ni producción durante esta integración.
2. No copiar secretos ni valores reales de variables de entorno a documentación, commits o logs.
3. No exponer claves de proveedores en código cliente.
4. No inventar precios, características ni claims de productos: usar exclusivamente datos verificados del ProductBrief.
5. No sobrescribir las fotografías originales ni alterar logotipos, placas, vehículos o productos.
6. Los textos exactos (precio, titular, CTA) se renderizan de forma determinista, no dentro de la imagen generativa.
7. La publicación en Meta permanece separada, con aprobación humana y preferiblemente en estado PAUSED. La CAPI raíz no sustituye esta integración.
8. No introducir cambios de esquema hasta revisar migraciones, datos y compatibilidad.
9. No implementar multi-tenant SaaS sobre Basic Auth/usuario demo; antes del acceso a clientes se requiere autenticación real, organizaciones, autorización por tenant y pruebas de aislamiento.
10. No añadir Pixazo hasta implementar un adaptador compatible con `ImageGenerationService` y validar calidad, coste, latencia y fidelidad.

## Fases y criterios de aceptación

### Fase 0 — Auditoría técnica
- [x] Confirmar rama base y crear rama de integración.
- [x] Confirmar separación de los dos proyectos y sus manifests.
- [x] Inventariar las rutas principales de API raíz y VentAds.
- [x] Revisar documentación local de Next.js 16, Prisma 7, proveedores y despliegue.
- [x] Inspeccionar contratos de los endpoints de campañas, generación de IA, marcas y productos.
- [x] Confirmar que la aplicación raíz actual no contiene el editor/publicador asumido en el plan inicial.
- [x] Revisar el cron configurado y el plan de Vercel.
- [x] Inspeccionar rutas de upload, regeneración de creative, worker y sweep.
- [ ] Revisar configuración exacta de Root Directory (no expuesta por la lectura de proyecto disponible) y presencia de variables de entorno sin revelar valores.
- [ ] Ejecutar lint, tests y build con dependencias y variables seguras; el conector GitHub no ejecuta comandos locales y no se ha conectado un entorno de ejecución.
- [ ] QA visual con imágenes reales de prueba y verificación de aislamiento.

**Puerta de salida:** no iniciar la integración de UI ni despliegue hasta completar los puntos pendientes de ejecución y verificación.

### Contratos API revisados en Fase 0

| Endpoint | Contrato observado | Observación |
|---|---|---|
| `GET/POST /api/brands` | Lista o crea Brand del usuario actual | Usa identidad demo fija |
| `GET/POST /api/products` | Lista o crea Product; valida `brandId` del mismo usuario | Incluye imágenes y Brand |
| `POST /api/uploads` | `multipart/form-data` con `file` y `folder`; responde `key`, `url`, dimensiones | Validación de imagen delegada a `processUploadedImage` |
| `POST /api/campaigns` | `productId`, `objective`, `style`, `variants` | Persiste campaña y jobs; responde 201 con campaign |
| `GET /api/campaigns/:id` | Devuelve campaña, conceptos, copy, creatives y producto | Verifica propiedad; hace self-heal de jobs pendientes |
| `POST /api/creatives/:id/regenerate` | Inicia nueva versión pendiente | Verifica propiedad; responde 202 |
| `POST /api/jobs/process` | Bearer `CRON_SECRET`, `campaignId` opcional | Worker protegido; procesa trabajos en ventana acotada |
| `GET /api/cron/sweep` | Bearer `CRON_SECRET` | Recupera jobs abandonados, finaliza campañas y procesa lote pequeño |
| `POST /api/generate-ad-campaign` | `productId`, `objective` obligatorios; contexto opcional | Orquestador IA devuelve análisis, variantes y estado de proveedores; no reemplaza por sí solo el flujo persistente de `/api/campaigns` |
| Raíz `POST /api/meta/capi` | Envía evento de conversión a Meta CAPI | No publica anuncios ni crea campañas |

**Hallazgo de seguridad/arquitectura:** `getCurrentUser()` resuelve actualmente un usuario demo fijo (`demo@ventads.ai`). El Basic Auth global evita exposición casual, pero no crea identidad individual. No habilitar clientes externos hasta reemplazar ambos mecanismos por autenticación y autorización multi-tenant.

### Fase 1 — Experiencia de producto
La UI de VentAds ya tiene un flujo de producto/campaña propio (`app/new`, `app/products`, `app/results`, componentes wizard y resultados). Primero consolidar esta UI como aplicación del producto. El sitio raíz debe enlazar a la aplicación, no compartir componentes Next.js entre dos builds independientes. Criterio: crear producto/campaña, consultar estado, ver variantes, regenerar una creatividad y exportar resultados desde un flujo coherente.

### Fase 2 — Proveedores de IA
Formalizar y probar interfaces de proveedores. Gemini ya está conectado como proveedor de imagen; el orquestador de campaña llama Gemini, Claude y OpenAI para estrategia/copy/dirección de arte. Pixazo se incorpora solo como adaptador adicional si cumple calidad, coste, latencia, términos y preservación del producto. Criterio: fallback probado, observabilidad sin secretos y claves solo server-side.

### Fase 3 — Brand Kit y catálogo
Completar identidad de marca, assets autorizados, productos y fuentes de verdad. Criterio: coherencia de marca y permisos/aislamiento correctos.

### Fase 4 — Renderizado y fidelidad
Mantener fotografía original inmutable; componer fondo, tipografía, copy y CTA por capas controladas. Criterio: pruebas visuales 1:1, 4:5 y 9:16, sin deformaciones ni texto inventado.

### Fase 5 — Jobs y almacenamiento
Validar recuperación de jobs, reintentos, concurrencia, límites de ejecución y storage persistente. Criterio: ningún asset depende del filesystem efímero de Vercel y los jobs huérfanos se recuperan. El cron actual es diario y debe seguir siendo un safety net, no el único mecanismo de dispatch.

### Fase 6 — Meta Ads
No existe una ruta de publicación de anuncios confirmada en el código raíz actual; solo se verificó CAPI. Diseñar la integración de Marketing API como módulo separado. Criterio: revisión humana, permisos mínimos, publicación en pausa y sin activar gasto automáticamente.

### Fase 7 — SaaS multiusuario
Diseñar identidad, organizaciones, membresías, roles, autorización tenant-aware, cuotas, auditoría y aislamiento de assets/datos. Criterio: pruebas negativas de acceso cruzado antes de abrir a clientes.

## Validación mínima por cambio
Desde `ventads-ai/`:
- `npm run lint`
- `npm test` (requiere TEST_DATABASE_URL separada)
- `npm run build`

Además: pruebas de integración de API, QA visual de PNG exportados y pruebas de autorización. No afirmar build/test exitoso sin ejecutarlo.

## Próximo trabajo
Terminar la auditoría de endpoints de upload/regeneración/worker y ejecutar la suite desde un entorno reproducible. La primera modificación de producto debería ser una pequeña mejora aislada dentro de `ventads-ai/`, no una fusión de carpetas ni un cambio de producción.
