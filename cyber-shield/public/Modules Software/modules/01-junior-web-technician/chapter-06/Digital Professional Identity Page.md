Task 6 — Msebetsi Employee: Build a Digital Professional Identity Page
🏗️ Context: Employee Professional Identity (Msebetsi Solutions)
🔥 Updated User Story

As an employee of Msebetsi Solutions, I want a professional digital identity page that presents my role, photo, bio, and contact links so that colleagues, partners, and potential clients can quickly verify my credentials and contact me.

✅ Acceptance Criteria

This task is complete when:

The page title and main header read “Msebetsi Professional Profile”.

Section 1 includes the employee’s full name, role at Msebetsi, a professional photo, and a short bio.

Section 2 includes a subheader “Contact & Professional Links” and a list with:

Company email (mailto using firstname.lastname@msebetsi.africa)

LinkedIn profile (opens in a new tab)

Internal staff directory link (or portfolio / project page)

The page includes accessible markup, responsive images, and JSON-LD structured data identifying the person and organization.

The layout matches the mockup proportions and stacks for mobile.

🛠️ Implementation — index.html (Msebetsi Employee Profile)

🔗 Updated Advanced References (for employees / internal best practices)

MDN — HTML & Accessibility (authoritative):
https://developer.mozilla.org/en-US/docs/Web/Accessibility

Web.dev — Performance & SEO Best Practices:
https://web.dev/

Schema.org — Person & Organization (structured data):
https://schema.org/Person

https://schema.org/Organization

OWASP — Secure Development Practices (for public employee pages):
https://owasp.org/

Internal policy tip: Use company-approved images and correct email format: firstname.lastname@msebetsi.africa.

💡 Implementation Notes (employee-focused)

Use the company portrait (not public photos) for internal pages.

The sameAs links and worksFor JSON-LD help search engines validate employee affiliation. For public pages, confirm HR approval before publishing.

For intranet-only profiles, remove external structured data or block via robots.txt if privacy is required.

For production, extract CSS to styles.css and add proper caching headers.