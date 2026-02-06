import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function enviar() {
    const res = await fetch("http://localhost:4000/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (res.ok) setMsg("Se o email existir, enviamos o link.");
    else setMsg("Erro ao enviar.");
  }

  return (
    <div>
      <h2>Esqueci minha senha</h2>

      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Digite seu email"
      />

      <button onClick={enviar}>Enviar</button>

      <p>{msg}</p>
    </div>
  );
}
