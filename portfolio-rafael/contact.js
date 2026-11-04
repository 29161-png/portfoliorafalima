// Função serverless da Vercel: recebe o formulário e envia por e-mail via Resend.
// Variáveis de ambiente: RESEND_API_KEY e CONTACT_TO (seu e-mail).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const { nome = '', email = '', assunto = '', mensagem = '', site = '' } = req.body || {};
  if (site) return res.status(200).json({ ok: true }); // honeypot anti-spam
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (nome.trim().length < 2 || !emailOk || assunto.trim().length < 3 || mensagem.trim().length < 10) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO) {
    return res.status(500).json({ error: 'Servidor não configurado' });
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfólio <onboarding@resend.dev>',
      to: [process.env.CONTACT_TO],
      reply_to: email,
      subject: `[Portfólio] ${assunto.slice(0, 120)}`,
      html: `<p><b>${esc(nome)}</b> (${esc(email)})</p><p>${esc(mensagem).replace(/\n/g, '<br>')}</p>`
    })
  });
  return r.ok ? res.status(200).json({ ok: true }) : res.status(502).json({ error: 'Falha ao enviar' });
};
