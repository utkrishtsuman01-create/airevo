# Airevo storefront

A responsive multi-page kitchen-appliance demo storefront built with static HTML, CSS and JavaScript, connected to a dedicated Airevo Supabase project.

## Pages and storefront features

- Six-slide appliance hero with slide-specific product image, copy and CTA
- Hover mega-menus for Categories, Collection and Our Approach
- Separate Home, Catalogue, Category, Collection, Product, Reviews, Contact, Account, Journal and Admin pages
- Appliance-specific product cards with galleries, hover details and variant selection
- Product and package dimensions, weight, MRP, discounted price and stock fields
- Customer email/password sign-up and sign-in, email verification and password reset
- Separate administrator sign-in and admin access-request flow at `/admin`
- Admin tools for products, variants, categories, collections, inventory, orders, printable bills, reviews, blogs and enquiries
- Supabase-backed orders, database stock decrement, reviews, blog content and enquiries
- Public display of approved five-star reviews only

## Supabase

Airevo has its own Supabase project in Mumbai (`ap-south-1`). The browser uses the public publishable key in `supabase-config.js`; no service-role key is stored in the repository.

The database uses Row Level Security. The initial owner/admin account must be assigned once by the project owner after the chosen email has registered and completed verification. Further admin accounts are created as requests and require approval by an existing administrator.

The `place-order` Edge Function validates a verified customer session and checks/decrements inventory in the database. Payment is **not** integrated yet; orders are demo orders with payment pending.

## Demo catalogue and imagery

Product names, model numbers, prices, discounts, dimensions and stock quantities are illustrative preview data. Product photos are manufacturer/retailer reference images for client-demo presentation. Replace sample data with Airevo-approved products and properly licensed product photography before commercial launch.

The three seeded journal articles and homepage testimonials include sample/demo copy. Approved customer five-star reviews replace testimonial placeholders when they exist.

## Before production launch

1. Confirm the first admin-owner email and promote that verified account.
2. Set the production Site URL and allowed redirect URLs in Supabase Auth to the final Airevo domain.
3. Configure custom SMTP for reliable verification and password-reset emails.
4. Replace demo catalogue, pricing, stock, dimensions, warranty and delivery terms with approved client data.
5. Confirm usage rights or replace manufacturer/retailer reference images with licensed Airevo photography.
6. Configure tax, shipping, invoice details and connect Razorpay (or another payment provider), including server-side webhook verification.
7. Connect this GitHub repository to its own Vercel project and attach the production domain.

## Vercel

The repository includes `vercel.json` rewrites for clean routes such as `/admin`, `/login`, `/catalogue`, `/reviews` and `/contact`. This is a static frontend; no build command or additional frontend environment variables are required.
