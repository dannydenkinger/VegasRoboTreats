module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, business, phone, email, address, notes, selected_date, selected_time } = req.body;

    if (!name || !email || !phone || !business) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const html = `
        <h2 style="color:#00e3fd;font-family:sans-serif;">New Consultation Booking</h2>
        <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;">
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Date</td><td>${esc(selected_date || '—')}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Time</td><td>${esc(selected_time || '—')} PT</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Name</td><td>${esc(name)}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Business</td><td>${esc(business)}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Phone</td><td>${esc(phone)}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Address</td><td>${esc(address || '—')}</td></tr>
            <tr><td style="padding:6px 16px 6px 0;font-weight:bold;vertical-align:top;">Notes</td><td>${esc(notes || '—')}</td></tr>
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
                subject: `Consultation Booking — ${name} on ${selected_date} at ${selected_time}`,
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
