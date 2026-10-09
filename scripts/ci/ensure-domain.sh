#!/usr/bin/env bash
# Idempotently attach $DOMAIN to the Pages project $PROJECT and make sure DNS
# points at it. Never overwrites a DNS record that points somewhere else; it
# warns instead, so a hand-made record is left for a person to decide about.
set -euo pipefail
api="https://api.cloudflare.com/client/v4"
auth=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")
zone_name="${DOMAIN#*.}"   # www.codefyui.com -> codefyui.com
target="${PROJECT}.pages.dev"

# 1. custom domain on the Pages project
domains=$(curl -fsS "${auth[@]}" "$api/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT/domains")
if echo "$domains" | jq -e --arg d "$DOMAIN" '.result[] | select(.name == $d)' >/dev/null; then
  echo "Custom domain $DOMAIN is attached: $(echo "$domains" | jq -r --arg d "$DOMAIN" '.result[] | select(.name == $d) | .status')"
else
  curl -fsS "${auth[@]}" -X POST "$api/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT/domains" \
    --data "$(jq -n --arg d "$DOMAIN" '{name: $d}')" >/dev/null
  echo "Attached $DOMAIN to $PROJECT."
fi

# 2. DNS record (needs Zone:Read and DNS:Edit on the zone; skipped with a warning otherwise)
zone_id=$(curl -fsS "${auth[@]}" "$api/zones?name=$zone_name" | jq -r '.result[0].id // empty') || true
if [ -z "${zone_id:-}" ]; then
  echo "::warning::Cannot read zone $zone_name with this token; add a proxied CNAME $DOMAIN -> $target yourself."
  exit 0
fi
record=$(curl -fsS "${auth[@]}" "$api/zones/$zone_id/dns_records?name=$DOMAIN" | jq -c '.result[0] // empty')
if [ -z "$record" ]; then
  curl -fsS "${auth[@]}" -X POST "$api/zones/$zone_id/dns_records" \
    --data "$(jq -n --arg n "$DOMAIN" --arg c "$target" '{type: "CNAME", name: $n, content: $c, proxied: true, comment: "CodefyUI website (Cloudflare Pages)"}')" >/dev/null
  echo "Created CNAME $DOMAIN -> $target."
elif [ "$(echo "$record" | jq -r '.type + " " + .content')" = "CNAME $target" ]; then
  echo "DNS for $DOMAIN already points at $target."
else
  echo "::warning::$DOMAIN already has a $(echo "$record" | jq -r .type) record to $(echo "$record" | jq -r .content). Left unchanged; point it at $target to serve the site."
fi
