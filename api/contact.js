export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, businessType, email, footTraffic, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const html = `
        <h2 style="color:#00e3fd;font-family:sans-serif;">New Machine Placement Inquiry</h2>
        <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;">
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Name</td><td>${esc(name)}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Business Type</td><td>${esc(businessType || '—')}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Daily Foot Traffic</td><td>${esc(footTraffic || '—')}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;vertical-align:top;">Message</td><td>${esc(message || '—')}</td></tr>
        </table>
    `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Vegas Robo Treats <noreply@vegasrobotreats.com>',
                to: ['dakota@vegasrobotreats.com'],
                reply_to: email,
                subject: `New Inquiry — ${name}`,
                html,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Resend error:', err);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
