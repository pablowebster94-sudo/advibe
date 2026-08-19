import { test } from "node:test";
import assert from "node:assert/strict";

import { buildXmp, escapeXml, formatXmpDate, sidecarName } from "../lib/photo/xmp/write";
import { extractCrsProperties, extractSequence, parseXmp } from "../lib/photo/xmp/read";
import { CRS_VERSION, PROCESS_VERSION, toCrsProperties } from "../lib/photo/xmp/crs";
import { clampAdjustments, defaultAdjustments } from "../lib/photo/editing/adjustments";

function sampleAdjustments() {
  const adjustments = defaultAdjustments();
  adjustments.exposure = 0.35;
  adjustments.contrast = 12;
  adjustments.highlights = -31;
  adjustments.shadows = 14;
  adjustments.whites = -6;
  adjustments.blacks = -9;
  adjustments.temperature = 8;
  adjustments.tint = -3;
  adjustments.vibrance = 11;
  adjustments.saturation = -2;
  adjustments.clarity = -4;
  adjustments.texture = 5;
  adjustments.dehaze = 7;
  adjustments.sharpenAmount = 45;
  adjustments.sharpenMasking = 55;
  adjustments.luminanceNR = 22;
  adjustments.lensProfile = true;
  adjustments.autoLateralCA = true;
  adjustments.vignetteAmount = -8;
  adjustments.hsl.saturation.orange = -14;
  adjustments.hsl.luminance.orange = 6;
  adjustments.colorGrade.shadowHue = 210;
  adjustments.colorGrade.shadowSat = 12;
  return clampAdjustments(adjustments);
}

test("sidecarName usa el nombre que busca Lightroom Classic", () => {
  assert.equal(sidecarName("DSC08487.ARW"), "DSC08487.xmp");
  assert.equal(sidecarName("boda/DSC08487.arw"), "boda/DSC08487.xmp");
  assert.equal(sidecarName("sin-extension"), "sin-extension.xmp");
  assert.equal(sidecarName(".oculto"), ".oculto.xmp");
});

test("escapeXml protege los nombres de archivo con caracteres especiales", () => {
  assert.equal(escapeXml('A&B<C>"D"'), "A&amp;B&lt;C&gt;&quot;D&quot;");
});

test("formatXmpDate produce un timestamp con zona horaria", () => {
  const stamp = formatXmpDate(new Date(2026, 7, 18, 14, 3, 11));
  assert.match(stamp, /^2026-08-18T14:03:11(Z|[+-]\d{2}:\d{2})$/);
});

test("toCrsProperties usa balance incremental para RAW", () => {
  const properties = toCrsProperties(sampleAdjustments(), { isRaw: true });
  const byName = new Map(properties.map((property) => [property.name, property.value]));

  assert.equal(byName.get("WhiteBalance"), "As Shot");
  assert.equal(byName.get("IncrementalTemperature"), 8);
  assert.equal(byName.get("IncrementalTint"), -3);
  // El absoluto no debe aparecer: sería una invención sin la matriz de color.
  assert.equal(byName.has("Temperature"), false);
  assert.equal(byName.get("Version"), CRS_VERSION);
  assert.equal(byName.get("ProcessVersion"), PROCESS_VERSION);
  assert.equal(byName.get("HasSettings"), true);
});

test("toCrsProperties usa balance absoluto relativo para archivos no RAW", () => {
  const properties = toCrsProperties(sampleAdjustments(), { isRaw: false });
  const byName = new Map(properties.map((property) => [property.name, property.value]));

  assert.equal(byName.get("WhiteBalance"), "Custom");
  assert.equal(byName.get("Temperature"), 8);
  assert.equal(byName.get("Tint"), -3);
  assert.equal(byName.has("IncrementalTemperature"), false);
});

test("buildXmp genera un paquete XMP bien formado", () => {
  const xmp = buildXmp(sampleAdjustments(), {
    isRaw: true,
    fileName: "DSC08487.ARW",
    modifyDate: new Date(2026, 7, 18, 14, 3, 11),
  });

  assert.ok(xmp.startsWith("<?xpacket begin="));
  assert.ok(xmp.trimEnd().endsWith('<?xpacket end="w"?>'));
  assert.ok(xmp.includes('xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"'));
  assert.ok(xmp.includes('crs:Exposure2012="+0.35"'));
  assert.ok(xmp.includes('crs:Highlights2012="-31"'));
  assert.ok(xmp.includes('crs:Shadows2012="14"'));
  assert.ok(xmp.includes('crs:RawFileName="DSC08487.ARW"'));
  assert.ok(xmp.includes('crs:LensProfileEnable="1"'));
  assert.ok(xmp.includes('crs:SaturationAdjustmentOrange="-14"'));
  assert.ok(xmp.includes("<crs:ToneCurvePV2012>"));
  assert.ok(xmp.includes("<rdf:li>0, 0</rdf:li>"));

  // Todas las etiquetas abiertas se cierran.
  const opened = [...xmp.matchAll(/<([a-zA-Z][\w:]*)(?=[\s>])/g)].map((m) => m[1]);
  const closed = [...xmp.matchAll(/<\/([a-zA-Z][\w:]*)>/g)].map((m) => m[1]);
  for (const tag of new Set(closed)) {
    assert.ok(opened.includes(tag), `etiqueta ${tag} cerrada sin abrir`);
  }
});

test("extractCrsProperties lee forma de atributo y de elemento", () => {
  const xmp = `<rdf:Description crs:Exposure2012="+0.20" crs:Contrast2012="5">
    <crs:Dehaze>12</crs:Dehaze>
  </rdf:Description>`;
  const values = extractCrsProperties(xmp);
  assert.equal(values.get("Exposure2012"), "+0.20");
  assert.equal(values.get("Contrast2012"), "5");
  assert.equal(values.get("Dehaze"), "12");
});

test("extractSequence lee la curva de tonos", () => {
  const xmp = `<crs:ToneCurvePV2012><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>128, 140</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012>`;
  assert.deepEqual(extractSequence(xmp, "ToneCurvePV2012"), ["0, 0", "128, 140", "255, 255"]);
});

test("XMP ida y vuelta: escribir y volver a leer conserva los valores", () => {
  const original = sampleAdjustments();
  const xmp = buildXmp(original, { isRaw: true, fileName: "DSC08487.ARW" });
  const parsed = parseXmp(xmp);

  assert.equal(parsed.empty, false);
  assert.equal(parsed.processVersion, PROCESS_VERSION);
  assert.equal(parsed.whiteBalance, "As Shot");
  assert.deepEqual(parsed.unsupported, []);

  for (const key of [
    "exposure",
    "contrast",
    "highlights",
    "shadows",
    "whites",
    "blacks",
    "temperature",
    "tint",
    "vibrance",
    "saturation",
    "clarity",
    "texture",
    "dehaze",
    "sharpenAmount",
    "sharpenMasking",
    "luminanceNR",
    "vignetteAmount",
  ] as const) {
    assert.equal(parsed.adjustments[key], original[key], `difiere ${key}`);
  }
  assert.equal(parsed.adjustments.lensProfile, true);
  assert.equal(parsed.adjustments.autoLateralCA, true);
  assert.equal(parsed.adjustments.hsl.saturation.orange, -14);
  assert.equal(parsed.adjustments.hsl.luminance.orange, 6);
  assert.equal(parsed.adjustments.colorGrade.shadowHue, 210);
  assert.equal(parsed.adjustments.colorGrade.shadowSat, 12);
  assert.deepEqual(parsed.adjustments.toneCurve, []);
});

test("parseXmp lee un sidecar real de Lightroom Classic", () => {
  // Fragmento con el formato y el orden que escribe Lightroom Classic.
  const lightroom = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c145 79.163499, 2018/08/13-16:40:22        ">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
   crs:Version="13.2"
   crs:ProcessVersion="11.0"
   crs:WhiteBalance="As Shot"
   crs:IncrementalTemperature="+12"
   crs:IncrementalTint="-4"
   crs:Exposure2012="+0.45"
   crs:Contrast2012="+18"
   crs:Highlights2012="-42"
   crs:Shadows2012="+37"
   crs:Whites2012="-11"
   crs:Blacks2012="-15"
   crs:Texture="+8"
   crs:Clarity2012="+6"
   crs:Dehaze="+4"
   crs:Vibrance="+14"
   crs:Saturation="-3"
   crs:LuminanceAdjustmentOrange="+9"
   crs:GrainAmount="18"
   crs:HasCrop="False">
   <crs:ToneCurvePV2012>
    <rdf:Seq>
     <rdf:li>0, 0</rdf:li>
     <rdf:li>255, 255</rdf:li>
    </rdf:Seq>
   </crs:ToneCurvePV2012>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const parsed = parseXmp(lightroom);
  assert.equal(parsed.crsVersion, "13.2");
  assert.equal(parsed.adjustments.exposure, 0.45);
  assert.equal(parsed.adjustments.contrast, 18);
  assert.equal(parsed.adjustments.highlights, -42);
  assert.equal(parsed.adjustments.shadows, 37);
  assert.equal(parsed.adjustments.temperature, 12);
  assert.equal(parsed.adjustments.tint, -4);
  assert.equal(parsed.adjustments.hsl.luminance.orange, 9);
  // Grano no está en nuestro modelo: se informa en lugar de perderse en silencio.
  assert.deepEqual(parsed.unsupported, ["GrainAmount"]);
});

test("parseXmp informa de un balance absoluto en Kelvin en lugar de inventarlo", () => {
  const xmp = `<rdf:Description crs:WhiteBalance="Custom" crs:Temperature="5450" crs:Tint="+6" crs:Exposure2012="0.00"/>`;
  const parsed = parseXmp(xmp);
  assert.equal(parsed.adjustments.temperature, 0, "no debe copiar 5450 al slider relativo");
  assert.equal(parsed.unsupported.length, 1);
  assert.match(parsed.unsupported[0], /5450K/);
});

test("parseXmp devuelve empty en un archivo sin propiedades crs", () => {
  const parsed = parseXmp("<x:xmpmeta><rdf:RDF/></x:xmpmeta>");
  assert.equal(parsed.empty, true);
  assert.deepEqual(parsed.adjustments, defaultAdjustments());
});

test("parseXmp recupera curva de tonos y recorte", () => {
  const xmp = `<rdf:Description crs:HasCrop="True" crs:CropTop="0.1" crs:CropLeft="0.05" crs:CropBottom="0.9" crs:CropRight="0.95" crs:CropAngle="-1.5">
   <crs:ToneCurvePV2012><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>128, 145</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012>
  </rdf:Description>`;
  const parsed = parseXmp(xmp);
  assert.deepEqual(parsed.adjustments.crop, {
    top: 0.1,
    left: 0.05,
    bottom: 0.9,
    right: 0.95,
    angle: -1.5,
  });
  assert.deepEqual(parsed.adjustments.toneCurve, [
    { x: 0, y: 0 },
    { x: 128, y: 145 },
    { x: 255, y: 255 },
  ]);
});
