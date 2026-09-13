# Conversión y UTMs

## Eventos

Los CTA de diagnóstico disparan dos capas de medición:

- `*_cta`: clic del CTA con `utm_source`, `utm_medium` y `utm_campaign`.
- `lead`: hook de conversión. Si Meta Pixel está cargado y expone `window.fbq`, también dispara `fbq('track', 'Lead', ...)`.
- `whatsapp_open`: apertura de un enlace/formulario que lleva a WhatsApp.
- `diagnostic_form_view`: el formulario de diagnóstico entró en el viewport. Es el denominador que faltaba: sin él se sabe cuántos hicieron clic en un CTA y cuántos enviaron, pero no cuántos llegaron a ver el formulario.

Si Meta Pixel no está instalado, el hook queda preparado y no genera error.

### Eventos de visualización

`diagnostic_form_view` se dispara **una sola vez por carga de página**, así que volver a
pasar por la sección no infla el conteo, y lleva los mismos UTMs que los CTA para que la
visualización sea atribuible a la misma procedencia. Se registra cuando al menos el 25 %
del formulario es visible; en un navegador sin `IntersectionObserver` se dispara al montar,
lo que sobreestima un poco antes que perder el dato.

Con esto el embudo queda completo: `*_cta` → `diagnostic_form_view` →
`diagnostic_form_submitted` → `lead`.

## UTMs de adquisición

Usar URLs distintas en los puntos de entrada para que el tráfico de Instagram pueda separarse:

- Bio de Instagram: `?utm_source=instagram&utm_medium=bio&utm_campaign=diagnostic_funnel`
- Historias de Instagram: `?utm_source=instagram&utm_medium=story&utm_campaign=diagnostic_funnel`
- Publicaciones orgánicas de Instagram: `?utm_source=instagram&utm_medium=organic_social&utm_campaign=content`
- Facebook orgánico: `?utm_source=facebook&utm_medium=organic_social&utm_campaign=content`
- Meta Ads: `?utm_source=facebook&utm_medium=paid_social&utm_campaign=<nombre_de_campana>`

El componente de CTA conserva los UTMs de entrada y solo completa valores faltantes para no sobrescribir la procedencia original.

## Implementación

`lib/tracking.ts` centraliza el tracking y la construcción de URLs. `trackViewOnce` y `observeViewOnce` implementan los eventos de visualización y son reutilizables para cualquier otra sección. `components/EventButton.tsx` aplica UTMs a los CTA internos y registra los clics. Los enlaces de WhatsApp no reciben parámetros UTM porque el destino `wa.me` no los necesita; su apertura se mide con `whatsapp_open` y, cuando corresponde, `lead`.
