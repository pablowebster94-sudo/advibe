"use client";

/**
 * The delivery note.
 *
 * Everything somebody needs before they trust the file, in the order they need
 * it, plus the numbers measured off the generated grid rather than predicted
 * from the settings. The clipping and grid-error figures are there because a
 * LUT that quietly crushes or bands is indistinguishable from a good one until
 * it is on a client's timeline.
 */
import { Badge, Button, Notice, Stat } from "@/components/studio/ui";
import type { LutReport } from "@/lib/color/pipeline";
import { NEUTRAL_TONE_CURVE } from "@/lib/color/tonemap";

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs uppercase tracking-wider text-neutral-500">{term}</dt>
      <dd className="leading-relaxed text-neutral-300">{children}</dd>
    </div>
  );
}

export function ResultCard({
  report,
  cameraLabel,
  analysisSummary,
  onDownload,
}: {
  report: LutReport;
  cameraLabel: string;
  analysisSummary: string[];
  onDownload: () => void;
}) {
  const measured = report.measured;
  const grid = report.size;
  const neutralGrey = NEUTRAL_TONE_CURVE.greyTarget;

  return (
    <div className="space-y-4">
      <dl className="space-y-3 text-sm">
        <Row term="Nombre del LUT">{report.name}</Row>
        <Row term="Tipo">
          <Badge tone={report.kind === "combined" ? "good" : "accent"}>{report.kindLabel}</Badge>
        </Row>
        <Row term="Cámara y perfil">{cameraLabel}</Row>
        <Row term="Gamma / gamut de entrada">
          {report.inputTransfer} · {report.inputGamut} — gris 18% en{" "}
          {report.inputMidGrey.toFixed(1)}%, {report.inputHeadroom.toFixed(1)} pasos de margen
          sobre gris
        </Row>
        <Row term="Transformación utilizada">{report.transformation}</Row>
        <Row term="Análisis resumido">
          {analysisSummary.length === 0 ? (
            <span className="text-neutral-500">
              Sin material analizado: el LUT es genérico para el perfil de cámara.
            </span>
          ) : (
            <ul className="space-y-0.5">
              {analysisSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </Row>
        <Row term="Corrección aplicada">{report.correctionSummary}</Row>
        <Row term="Look aplicado">{report.lookDescription}</Row>
        <Row term="Intensidad en CapCut">
          <strong className="text-neutral-100">{report.capcutIntensity}%</strong>.{" "}
          {report.intensityReason}
        </Row>
        <Row term="Tamaño del LUT">
          {grid}³ — {grid ** 3} entradas
          {grid >= 65 ? " (máxima precisión)" : " (compatibilidad máxima)"}
        </Row>
      </dl>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Gris 18% sale a"
          value={`${(measured.midGrey * 100).toFixed(1)}%`}
          // Without the reference this number reads as a fault. A corrective
          // LUT is *supposed* to move grey: the gap between the two is the
          // exposure correction plus the look, in IRE.
          hint={`rendición neutra: ${(neutralGrey * 100).toFixed(1)}%`}
        />
        <Stat label="Blanco máximo" value={`${(measured.white * 100).toFixed(1)}%`} />
        <Stat
          label="Recorte"
          value={`${(measured.clippedHigh * 100).toFixed(2)}%`}
          hint="nodos en blanco puro"
        />
        <Stat
          label="Error de rejilla"
          value={`${(measured.interpolationError * 100).toFixed(1)}%`}
          hint={measured.interpolationError > 0.02 ? "sube a 65³ si corriges encima" : "holgado"}
        />
      </div>

      {report.validation.errors.map((error) => (
        <Notice key={error} tone="error">
          {error}
        </Notice>
      ))}
      {report.validation.warnings.map((warning) => (
        <Notice key={warning} tone="warn">
          {warning}
        </Notice>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={onDownload} disabled={!report.validation.valid}>
          DESCARGAR .CUBE
        </Button>
        <span className="text-xs text-neutral-500">
          {report.fileName} · en CapCut: Ajustar → LUT → Importar, intensidad al{" "}
          {report.capcutIntensity}%.
        </span>
      </div>
    </div>
  );
}
