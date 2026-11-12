# AdVibe AI — plan de integración

## Estado
- Rama de trabajo: `feature/advibe-ai-integration`
- Base: `main`
- Alcance inicial: integración gradual, sin alterar el proyecto raíz ni el deployment de producción.
- Este documento registra la auditoría inicial y las puertas de aceptación. No implica que las fases de código estén implementadas.

## Decisión de arquitectura
Usar `ventads-ai/` como núcleo de producto (dominio, persistencia, orquestación de campañas, cola, renderizado y almacenamiento) y reutilizar selectivamente capacidades de la aplicación raíz. No fusionar aplicaciones copiando carpetas completas ni reemplazar producción antes de validar paridad funcional.

## Hallazgos verificados

### Aplicación raíz
- Next.js 16.2.10 / React 19.2.4.
- Tiene un `package.json` independiente en la raíz.
- Contiene rutas de API raíz bajo `app/api/`, incluyendo `meta/`, `chat/`, `enfoque/` y `am-motorsport/`.
- Mantenerla fuera del alcance de cambios de VentAds salvo cambios explícitos de integración entre proyectos.

### ventads-ai
- Proyecto Next.js independiente dentro de `ventads-ai/`, con su propio `package.json`, lockfile, configuración y aplicación App Router.
- Next.js 16, React 19, TypeScript, Prisma 7 y PostgreSQL.
- Dominio existente de marcas, productos, campañas, conceptos, copies y creatividades.
- APIs existentes para marcas, productos, campañas, creatividades, uploads, procesamiento de jobs y generación de campañas.
- Orquestador documentado: Gemini (estrategia), Claude (copy) y OpenAI (dirección de arte), con fallback determinista.
- Renderizado de copy separado de la generación visual; las fotos originales de producto no deben sobrescribirse.
- Cola persistente basada en registros Creative y workers HTTP.
- Storage local no es persistente en Vercel; la documentación contempla storage en base de datos o S3 compatible.

## Restricciones obligatorias
1. No modificar `main` ni producción durante esta integración.
2. No copiar secretos ni valores reales de variables de entorno a documentación, commits o logs.
3. No exponer claves de proveedores en código cliente.
4. No inventar precios, características ni claims de productos: usar exclusivamente datos verificados del ProductBrief.
5. No sobrescribir las fotografías originales ni alterar logotipos, placas, vehículos o productos.
6. Los textos exactos (precio, titular, CTA) se renderizan de forma determinista, no dentro de la imagen generativa.
7. La publicación en Meta permanece separada, con aprobación humana y preferiblemente en estado PAUSED.
8. No introducir cambios de esquema hasta revisar migraciones, datos y compatibilidad.
9. No implementar multi-tenant SaaS sobre Basic Auth; antes del acceso a clientes se requiere autenticación de usuarios, organizaciones, autorización por tenant y pruebas de aislamiento.

## Fases y criterios de aceptación

### Fase 0 — Auditoría técnica
- [x] Confirmar rama base y crear rama de integración.
- [x] Confirmar separación de los dos proyectos y sus manifests.
- [x] Inventariar endpoints raíz y endpoints de VentAds.
- [x] Revisar documentación de Next.js 16, Prisma 7, proveedores y despliegue.
- [ ] Inspeccionar contratos request/response de los endpoints de generación y publicación.
- [ ] Inspeccionar componentes raíz que se pretenden reutilizar y dependencias transitivas.
- [ ] Ejecutar lint, tests y build en entorno con dependencias y variables seguras.
- [ ] Revisar configuración real del proyecto Vercel sin modificarla.

**Puerta de salida:** inventario de contratos, dependencias, variables necesarias y pruebas reproducibles. No iniciar una migración de UI antes de completar esta puerta.

### Fase 1 — Experiencia integrada
Conectar la experiencia de creación elegida a las APIs de VentAds mediante contratos explícitos. Evitar acoplar componentes cliente a Prisma o servicios internos. Criterio: crear campaña, consultar estado, ver variantes y regenerar una creatividad desde un único flujo.

### Fase 2 — Proveedores de IA
Formalizar interfaces de proveedores; validar Gemini, Claude, OpenAI y Pixazo con el mismo conjunto de pruebas. Pixazo se incorpora solo si cumple calidad, coste, latencia, términos de uso y preservación del producto. Criterio: fallback probado y claves solo server-side.

### Fase 3 — Brand Kit y catálogo
Completar identidad de marca, assets autorizados, productos y fuentes de verdad. Criterio: aislamiento de datos y consistencia de marca entre formatos.

### Fase 4 — Renderizado y fidelidad
Mantener fotografía original inmutable; componer fondo, tipografía, copy y CTA por capas controladas. Criterio: pruebas visuales de 1:1, 4:5 y 9:16, sin deformaciones ni texto inventado.

### Fase 5 — Jobs y almacenamiento
Validar recuperación de jobs, reintentos, concurrencia, límites de ejecución y storage persistente (R2/S3 o database storage). Criterio: ningún asset depende del filesystem efímero de Vercel y los jobs huérfanos se recuperan.

### Fase 6 — Meta Ads
Integrar la publicación como flujo independiente. Criterio: revisión humana, permisos mínimos, publicación en pausa y sin activar gasto automáticamente.

### Fase 7 — SaaS multiusuario
Diseñar identidad, organizaciones, membresías, roles, autorización tenant-aware, cuotas, auditoría y aislamiento de assets/datos. Criterio: pruebas negativas de acceso cruzado antes de abrir a clientes.

## Validación mínima por cambio
Desde `ventads-ai/`:
- `npm run lint`
- `npm test` (requiere TEST_DATABASE_URL separada)
- `npm run build`

Además: pruebas de integración de API, QA visual de PNG exportados y pruebas de autorización. No afirmar build/test exitoso sin ejecutarlo.

## Riesgos que requieren verificación
- El proyecto Vercel `advibe-ai` debe tener Root Directory `ventads-ai`; verificarlo en configuración antes de cualquier deployment.
- El cron `*/5 * * * *` documentado requiere un plan Vercel compatible; validar plan y configuración antes de confiar en él.
- Verificar la implementación real del fallback de almacenamiento en Vercel y los límites de tamaño/tiempo de generación.
- Verificar que las rutas de publicación Meta no puedan activarse sin aprobación y que las credenciales tengan permisos mínimos.
- Verificar el estado real de los componentes de la aplicación raíz antes de reutilizarlos; el plan no presupone compatibilidad directa.

## Próximo trabajo
Completar los contratos de API y la matriz de dependencias en Fase 0. Después implementar un adaptador de integración en una frontera estable; no mover archivos de una aplicación a la otra de forma masiva.
