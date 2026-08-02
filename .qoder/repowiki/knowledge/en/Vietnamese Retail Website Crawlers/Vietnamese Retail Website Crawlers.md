---
kind: external_dependency
name: Vietnamese Retail Website Crawlers
slug: vietnamese-ecommerce-sites
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Custom web scrapers targeting three major Vietnamese retail chains: BachHoaXanh (bachhoaxanh.com), WinMart, and Co.op Mart. Uses axios for HTTP requests and cheerio for HTML parsing. Scheduled daily at 2 AM via node-cron. Each crawler has specific selectors and rate limiting to avoid blocking.