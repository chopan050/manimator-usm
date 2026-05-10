import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Check, ExternalLink, Heart, Loader2 } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const API_URL = "/api";

type VideoKey = "draw" | "tangent";

type VideoUrls = {
  draw: string | null;
  tangent: string | null;
};

export default function App() {
  const [fTex, setFTex] = useState("(\\cos(t), \\sin(t))");
  const [aTex, setATex] = useState("0");
  const [bTex, setBTex] = useState("2\\pi");
  const [includeTangent, setIncludeTangent] = useState(false);
  const [sceneConfig, setSceneConfig] = useState({ "preserve_proportions": true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoUrls, setVideoUrls] = useState<VideoUrls>({
    draw: null,
    tangent: null,
  });
  const [activeTab, setActiveTab] = useState<VideoKey>("draw");

  // Tabs dinámicas dependiendo de las opciones habilitadas
  const tabs = useMemo(() => {
    const baseTabs: { key: VideoKey; label: string }[] = [
      {
        key: "draw",
        label: "Curva",
      },
    ];

    if (includeTangent) {
      baseTabs.push({
        key: "tangent",
        label: "Tangente",
      });
    }

    return baseTabs;
  }, [includeTangent]);

  // Mantener tab válida
  useEffect(() => {
    if (!tabs.find((t) => t.key === activeTab)) {
      setActiveTab("draw");
    }
  }, [tabs, activeTab]);

  const resetVideos = () => {
    setVideoUrls({
      draw: null,
      tangent: null,
    });
  };

  const render = async () => {
    setLoading(true);
    setError("");
    resetVideos();
    setActiveTab("draw");

    const res = await fetch(`${API_URL}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        f_tex: fTex,
        a_tex: aTex,
        b_tex: bTex,
        include_tangent: includeTangent,
        scene_config: sceneConfig,
      }),
    });

    const data = await res.json();
    pollStatus(data.task_id);
  };

  const pollStatus = (taskId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/status/${taskId}`);
      const data = await res.json();

      setError("");

      const getNewVideoUrls = (data: any) => {
        const newVideoUrls: VideoUrls = {
          draw: null,
          tangent: null,
        };

        for (const key in data.video_urls) {
          const videoUrl = data.video_urls[key];
          if (videoUrl !== null) {
            newVideoUrls[key as VideoKey] = `${API_URL}${videoUrl}`;
          }
        }

        return newVideoUrls;
      }

      if (data.status === "progress") {
        setVideoUrls(getNewVideoUrls(data));
      }

      if (data.status === "done") {
        clearInterval(interval);
        setVideoUrls(getNewVideoUrls(data));
        setLoading(false);
      }

      if (data.status === "error") {
        clearInterval(interval);
        setError(`Error al renderizar: ${data.error}`);
        setLoading(false);
      }
    }, 2000);
  };

  const renderVideoPanel = () => {
    const currentVideo = videoUrls[activeTab];

    // Loader mientras se genera
    if (loading && !currentVideo) {
      return (
        <div className="w-full aspect-video rounded-xl border bg-gray-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-gray-500" size={36} />

          <p className="text-sm text-gray-500">
            Generando video...
          </p>
        </div>
      );
    }

    // Video listo
    if (currentVideo) {
      return (
        <video
          src={currentVideo}
          controls
          className="w-full rounded-xl border"
        />
      );
    }

    // Estado vacío
    return (
      <div className="w-full aspect-video rounded-xl border bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Aún no hay video disponible
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-3xl font-bold">
            Renderizador de curvas paramétricas
          </h1>

          {/* Formulario */}
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fTex">
                  Curva paramétrica f(t)
                </FieldLabel>

                <Input
                  id="fTex"
                  name="fTex"
                  value={fTex}
                  onChange={(e: any) => setFTex(e.target.value)}
                  placeholder="Curva en LaTeX"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="aTex">
                    Límite inferior a
                  </FieldLabel>

                  <Input
                    id="aTex"
                    name="aTex"
                    value={aTex}
                    onChange={(e: any) => setATex(e.target.value)}
                    placeholder="Límite inferior"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bTex">
                    Límite superior b
                  </FieldLabel>

                  <Input
                    id="bTex"
                    name="bTex"
                    value={bTex}
                    onChange={(e: any) => setBTex(e.target.value)}
                    placeholder="Límite superior"
                  />
                </Field>
              </div>

              <Field orientation="horizontal">
                <Checkbox
                  id="preserveProportions"
                  name="preserveProportions"
                  checked={sceneConfig.preserve_proportions}
                  onCheckedChange={value => setSceneConfig({ ...sceneConfig, preserve_proportions: !!value })}
                />
                <FieldLabel htmlFor="preserveProportions">
                  Preservar proporciones de curva (ancho, largo, alto)
                </FieldLabel>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="includeTangent"
                  name="includeTangent"
                  checked={includeTangent}
                  onCheckedChange={value => setIncludeTangent(!!value)}
                />
                <FieldLabel htmlFor="includeTangent">
                  Incluir derivada y vector tangente
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button
            onClick={render}
            disabled={loading}
            className="w-full"
          >
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
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Tabs */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              {tabs.map((tab) => {
                const isReady = !!videoUrls[tab.key];

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2
                      ${
                        activeTab === tab.key
                          ? "border-black text-black"
                          : "border-transparent text-gray-500 hover:text-black"
                      }
                    `}
                  >
                    {tab.label}

                    {!isReady && loading && (
                      <Loader2
                        className="animate-spin"
                        size={14}
                      />
                    )}

                    {isReady && (
                      <Check
                        size={14}
                        className="text-green-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {renderVideoPanel()}
          </div>
        </CardContent>
      </Card>

      <footer className="w-full max-w-3xl mt-10 text-sm text-gray-500">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              
              {/* Autor */}
              <div className="flex items-center gap-4">
                <img
                    src="/logo_utfsm.png"
                    alt="Logo"
                    className="w-13 h-12"
                  />

                <div>
                  <p className="font-semibold text-gray-800">
                    Francisco Manríquez Novoa
                  </p>

                  <p className="text-xs text-gray-500">
                    Desarrollado con React, FastAPI,
                    Celery y Manim
                  </p>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/chopan050/manimator-usm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-black transition"
                >
                  <FaGithub size={16} />
                  GitHub
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Línea divisoria */}
            <div className="border-t pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              
              <p className="text-xs">
                © {new Date().getFullYear()} Francisco Manríquez Novoa
              </p>

              <div className="flex items-center gap-1 text-xs">
                Hecho con
                <Heart
                  size={12}
                  className="text-red-500 fill-red-500"
                />
                usando Manim
              </div>
            </div>
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
