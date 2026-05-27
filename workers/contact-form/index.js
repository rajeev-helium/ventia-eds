/**
 * Ventia Contact Form — Cloudflare Worker
 *
 * Validates and forwards form submissions. Configure env vars:
 *   EMAIL_TO      — recipient address
 *   EMAIL_FROM    — verified sender address
 *   SENDGRID_API_KEY — SendGrid API key (or swap for your email provider)
 */

const ALLOWED_ORIGINS = [
  'https://main--ventia-eds--',
  'http://localhost:3000',
];

const REQUIRED_FIELDS = ['full_name', 'email_address', 'message'];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed) || origin === allowed);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function handleOptions(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

async function handlePost(request, env) {
  const origin = request.headers.get('Origin') || '';

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(origin) });
  }

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter((f) => !body[f]?.toString().trim());
  if (missing.length) {
    return Response.json(
      { success: false, error: `Missing fields: ${missing.join(', ')}` },
      { status: 422, headers: corsHeaders(origin) },
    );
  }

  if (!validateEmail(body.email_address)) {
    return Response.json({ success: false, error: 'Invalid email address' }, { status: 422, headers: corsHeaders(origin) });
  }

  // Rate limiting via KV (optional — requires KV binding named RATE_LIMIT)
  if (env.RATE_LIMIT) {
    const key = `form:${body.email_address}`;
    const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
    if (count >= 5) {
      return Response.json({ success: false, error: 'Too many submissions. Please try again later.' }, { status: 429, headers: corsHeaders(origin) });
    }
    await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 3600 });
  }

  // Forward to email provider (SendGrid example)
  if (env.SENDGRID_API_KEY && env.EMAIL_TO) {
    const emailBody = {
      personalizations: [{ to: [{ email: env.EMAIL_TO }] }],
      from: { email: env.EMAIL_FROM || 'noreply@ventia.com', name: 'Ventia Website' },
      reply_to: { email: body.email_address, name: body.full_name },
      subject: `Website enquiry — ${body.enquiry_type || 'General'}`,
      content: [{
        type: 'text/plain',
        value: Object.entries(body).map(([k, v]) => `${k}: ${v}`).join('\n'),
      }],
    };

    const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!sgResp.ok) {
      // Log but don't expose internal error to client
      console.error('SendGrid error:', sgResp.status, await sgResp.text()); // eslint-disable-line no-console
      return Response.json({ success: false, error: 'Failed to send message. Please try again.' }, { status: 500, headers: corsHeaders(origin) });
    }
  }

  return Response.json({ success: true }, { status: 200, headers: corsHeaders(origin) });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return handleOptions(request);
    if (request.method === 'POST') return handlePost(request, env);
    return new Response('Method not allowed', { status: 405 });
  },
};
