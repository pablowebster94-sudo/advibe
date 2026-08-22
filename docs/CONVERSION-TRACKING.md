# Conversión y UTMs

## Eventos

Los CTA de diagnóstico disparan dos capas de medición:

- `*_cta`: clic del CTA con `utm_source`, `utm_medium` y `utm_campaign`.
- `lead`: hook de conversión. Si Meta Pixel está cargado y expone `window.fbq`, también dispara `fbq('track', 'Lead', ...)`.
- `whatsapp_open`: apertura de un enlace/formulario que lleva a WhatsApp.

Si Meta Pixel no está instalado, el hook queda preparado y no genera error.

## UTMs de adquisición

Usar URLs distintas en los puntos de entrada para que el tráfico de Instagram pueda separarse:

- Bio de Instagram: `?utm_source=instagram&utm_medium=bio&utm_campaign=diagnostic_funnel`
- Historias de Instagram: `?utm_source=instagram&utm_medium=story&utm_campaign=diagnostic_funnel`
- Publicaciones orgánicas de Instagram: `?utm_source=instagram&utm_medium=organic_social&utm_campaign=content`
- Facebook orgánico: `?utm_source=facebook&utm_medium=organic_social&utm_campaign=content`
- Meta Ads: `?utm_source=facebook&utm_medium=paid_social&utm_campaign=<nombre_de_campana>`

El componente de CTA conserva los UTMs de entrada y solo completa valores faltantes para no sobrescribir la procedencia original.

## Implementación

`lib/tracking.ts` centraliza el tracking y la construcción de URLs. `components/EventButton.tsx` aplica UTMs a los CTA internos y registra los clics. Los enlaces de WhatsApp no reciben parámetros UTM porque el destino `wa.me` no los necesita; su apertura se mide con `whatsapp_open` y, cuando corresponde, `lead`.
