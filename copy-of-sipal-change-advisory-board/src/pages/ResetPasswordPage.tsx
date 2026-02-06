import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  async function salvar() {
    const res = await fetch("http://localhost:4000/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    if (res.ok) setMsg("Senha alterada com sucesso!");
    else setMsg("Token inválido.");
  }

  return (
    <div>
      <h2>Nova senha</h2>

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Nova senha"
      />

      <button onClick={salvar}>Salvar</button>

      <p>{msg}</p>
    </div>
  );
}
