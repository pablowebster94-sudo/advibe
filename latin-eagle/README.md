# Latin Eagle Multiservices — Landing page

Landing page for Latin Eagle Multiservices, aimed at the Latino community in Long Island.

## Included
- Responsive Spanish-language landing page
- Service cards for money transfers, international parcels, airline tickets, bill payments, phone top-ups, and copies/printing
- Featured Ecuador parcel promotion ($28 for 8 lb) with terms and availability to be confirmed
- FAQ accordion
- WhatsApp CTAs configured via environment variable

## Configure WhatsApp
Set `NEXT_PUBLIC_LATIN_EAGLE_WHATSAPP` to the business number in international format, digits only (example format: 16315551234, replace with the real number). Until set, buttons point to the contact section.

## Integration
This page is added under `latin-eagle/app/page.tsx` so it does not replace the existing AdVibe homepage. To deploy as a standalone site, create a new Next.js project and move this page to `app/page.tsx`, or create a separate repository.
