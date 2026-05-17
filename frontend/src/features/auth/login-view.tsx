import type { FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function LoginView({ onSubmit, error }: { onSubmit: (payload: unknown) => void; error?: string }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    onSubmit({ email: values.email, password: values.password });
  };

  return (
    <main className="login-shell">
      <Card className="login-card">
        <CardHeader>
          <CardTitle>Garage OS</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="form-grid" onSubmit={submit}>
            <input name="email" type="email" required defaultValue="admin@example.jp" placeholder="メールアドレス" />
            <input name="password" type="password" required defaultValue="password" placeholder="パスワード" />
            {error && <p className="form-error">{error}</p>}
            <Button className="primary">ログイン</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
