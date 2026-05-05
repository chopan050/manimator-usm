import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Loader2 } from "lucide-react";

const API_URL = "/api";

export default function App() {
  const [fTex, setFTex] = useState("(\\cos(t), \\sin(t))");
  const [aTex, setATex] = useState("0");
  const [bTex, setBTex] = useState('2\\pi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const render = async () => {
    setLoading(true);
    setError("");

    const res = await fetch(`${API_URL}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ f_tex: fTex, a_tex: aTex, b_tex: bTex }),
    });

    const data = await res.json();
    pollStatus(data.task_id);
  };

  const pollStatus = (taskId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/status/${taskId}`);
      const data = await res.json();

      setError("");

      if (data.status === "done") {
        clearInterval(interval);
        setVideoUrl(`${API_URL}${data.video_url}`);
        setLoading(false);
      }

      if (data.status === "error") {
        clearInterval(interval);
        setError(`Error al renderizar: ${data.error}`);
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">Renderizador de curvas paramétricas</h1>

          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fTex">Curva paramétrica f(t)</FieldLabel>
                <Input name="fTex" value={fTex} onChange={(e: any) => setFTex(e.target.value)} placeholder="Curva en LaTeX" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="aTex">Límite inferior a</FieldLabel>
                  <Input name="aTex" value={aTex} onChange={(e: any) => setATex(e.target.value)} placeholder="Límite inferior" />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bTex">Límite superior b</FieldLabel>
                  <Input name="bTex" value={bTex} onChange={(e: any) => setBTex(e.target.value)} placeholder="Límite superior" />
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>

          <Button onClick={render} disabled={loading} className="w-full blue">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Renderizando...
              </span>
            ) : (
              "Renderizar"
            )}
          </Button>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="w-full rounded-xl border"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
