# Security headers plan

The web audit reported 1/7 recommended response-security headers on the public site.

Recommended headers to configure at the Vercel/Next.js delivery layer:

- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Content-Security-Policy: define a policy based on the site's actual scripts, styles, images, fonts, APIs, and frames; validate in staging before enforcing.
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

Important: CSP must be validated against the actual production dependencies before deployment. Do not apply a restrictive policy blindly because the site contains interactive components, a chatbot, and external resources.
