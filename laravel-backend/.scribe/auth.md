# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer {YOUR_AUTH_KEY}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

Log in with <code>POST /api/v1/auth/login</code> (staff: <code>liza.ramos</code> / <code>password123</code>) or <code>POST /api/v1/customer/auth/login</code> (customers), and paste the <code>access_token</code> here. Send it as <code>Authorization: Bearer {token}</code>. Tokens last JWT_TTL minutes; exchange an expired one with <code>/auth/refresh</code>.
