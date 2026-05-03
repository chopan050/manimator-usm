import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const API_URL = "/api";

export default function App() {
  const [fTex, setFTex] = useState("(\\cos(t), \\sin(t))");
  const [aTex, setATex] = useState("0");
  const [bTex, setBTex] = useState('2\\pi');
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const render = async () => {
    setLoading(true);
    setStatus("Enviando tarea...");
    setVideoUrl("");

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

      setStatus(data.status);

      if (data.status === "done") {
        clearInterval(interval);
        setVideoUrl(`${API_URL}${data.video_url}`);
        setLoading(false);
      }

      if (data.status === "error") {
        clearInterval(interval);
        setStatus("Error al renderizar");
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">Manim Curve Renderer</h1>

          <Input
            value={fTex}
            onChange={(e: any) => setFTex(e.target.value)}
            placeholder="Ingresa tu curva en LaTeX..."
          />

          <Input
            value={aTex}
            onChange={(e: any) => setATex(e.target.value)}
            placeholder="Ingresa tu curva en LaTeX..."
          />

          <Input
            value={bTex}
            onChange={(e: any) => setBTex(e.target.value)}
            placeholder="Ingresa tu curva en LaTeX..."
          />

          <Button onClick={render} disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Procesando...
              </span>
            ) : (
              "Renderizar"
            )}
          </Button>

          {status && (
            <p className="text-sm text-gray-600">Estado: {status}</p>
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
