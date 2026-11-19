import { test } from "node:test";
import assert from "node:assert/strict";

import { categorias, descuento, dinero, enlaceWhatsApp, esSi, filasARemates, filtrar, fotoURL, ordenar, parseCSV, precio, type Remate } from "../lib/remates";
import { urlCSV, whatsapp, demoPermitido, MUEBLES_IDEAL } from "../lib/remates-data";

test("parseCSV respeta comillas, comas internas y comillas escapadas", () => {
  const rows = parseCSV('a,b\n"uno, con coma","dice ""hola"""\n');
  assert.deepEqual(rows, [["a", "b"], ["uno, con coma", 'dice "hola"']]);
});

test("parseCSV soporta CRLF, BOM y saltos dentro de comillas", () => {
  const rows = parseCSV('﻿nombre,desc\r\nMesa,"linea 1\nlinea 2"\r\n');
  assert.deepEqual(rows, [["nombre", "desc"], ["Mesa", "linea 1\nlinea 2"]]);
});

test("parseCSV descarta filas totalmente vacías", () => {
  assert.equal(parseCSV("a,b\n,\nMesa,x\n").length, 2);
});

test("precio entiende los formatos que escribe la gente", () => {
  assert.equal(precio("890"), 890);
  assert.equal(precio("$ 1.200"), 1200);
  assert.equal(precio("1,200.50"), 1200.5);
  assert.equal(precio("890,50"), 890.5);
  assert.equal(precio("1.234.567"), 1234567);
  assert.equal(precio(""), undefined);
  assert.equal(precio("gratis"), undefined);
  assert.equal(precio("0"), undefined);
});

test("fotoURL convierte Drive a imagen directa y respeta URLs normales", () => {
  const id = "1rUuEt9oOm8LLhdsFqzPHGewVQOJozWszKgq64uRsTUo";
  assert.equal(fotoURL("https://drive.google.com/file/d/" + id + "/view?usp=sharing"), "https://lh3.googleusercontent.com/d/" + id);
  assert.equal(fotoURL("https://drive.google.com/open?id=" + id), "https://lh3.googleusercontent.com/d/" + id);
  assert.equal(fotoURL(id), "https://lh3.googleusercontent.com/d/" + id);
  assert.equal(fotoURL("https://cdn.ejemplo.com/mesa.jpg"), "https://cdn.ejemplo.com/mesa.jpg");
  assert.equal(fotoURL("no es una foto"), undefined);
  assert.equal(fotoURL(""), undefined);
});

test("filasARemates acepta sinónimos de encabezado y acentos", () => {
  const items = filasARemates(parseCSV("Producto,Precio Regular,Precio Remate,Categoría\nSofá,720,450,Salas"));
  assert.equal(items.length, 1);
  assert.equal(items[0].nombre, "Sofá");
  assert.equal(items[0].precioAntes, 720);
  assert.equal(items[0].precioRemate, 450);
  assert.equal(items[0].categoria, "Salas");
});

test("filasARemates respeta mostrar=no, marca vendido y salta filas sin nombre", () => {
  const items = filasARemates(parseCSV(
    "nombre,precio_remate,vendido,mostrar\nVisible,100,,si\nOculto,100,,no\n,100,,si\nVendido,100,si,si"));
  assert.deepEqual(items.map((x) => x.nombre), ["Visible", "Vendido"]);
  assert.equal(items[1].vendido, true);
  assert.equal(items[0].vendido, false);
});

test("filasARemates devuelve vacío sin encabezado de nombre o sin filas", () => {
  assert.deepEqual(filasARemates(parseCSV("precio,foto\n100,x")), []);
  assert.deepEqual(filasARemates([["nombre"]]), []);
  assert.deepEqual(filasARemates([]), []);
});

test("filasARemates separa varias fotos por | y descarta basura", () => {
  const items = filasARemates(parseCSV('nombre,fotos\nMesa,"https://a.com/1.jpg|https://a.com/2.jpg|roto"'));
  assert.deepEqual(items[0].fotos, ["https://a.com/1.jpg", "https://a.com/2.jpg"]);
});

test("esSi reconoce las formas de decir sí", () => {
  for (const v of ["si", "Sí", "X", "TRUE", "1"]) assert.equal(esSi(v), true, v);
  for (const v of ["", "no", "0", "quizá"]) assert.equal(esSi(v), false, v);
});

const r = (p: Partial<Remate>): Remate => ({ id: "x", nombre: "n", fotos: [], vendido: false, ...p });

test("descuento solo aplica cuando el remate es menor que el precio anterior", () => {
  assert.equal(descuento(r({ precioAntes: 1000, precioRemate: 750 })), 25);
  assert.equal(descuento(r({ precioAntes: 500, precioRemate: 500 })), undefined);
  assert.equal(descuento(r({ precioRemate: 500 })), undefined);
});

test("ordenar deja disponibles primero y mayor descuento arriba", () => {
  const items = [
    r({ id: "a", precioAntes: 100, precioRemate: 90 }),
    r({ id: "b", vendido: true, precioAntes: 100, precioRemate: 10 }),
    r({ id: "c", precioAntes: 100, precioRemate: 50 }),
  ];
  assert.deepEqual(ordenar(items).map((x) => x.id), ["c", "a", "b"]);
});

test("categorias y filtrar ignoran acentos y mayúsculas", () => {
  const items = [r({ id: "a", categoria: "Salas" }), r({ id: "b", categoria: "Colchónes" }), r({ id: "c" })];
  assert.deepEqual(categorias(items), ["Colchónes", "Salas"]);
  assert.deepEqual(filtrar(items, "colchones").map((x) => x.id), ["b"]);
  assert.equal(filtrar(items, "todo").length, 3);
  assert.equal(filtrar(items, undefined).length, 3);
});

test("dinero formatea en dólares y sin decimales cuando son enteros", () => {
  assert.equal(dinero(590), "$590");
  assert.equal(dinero(1200), "$1.200");
  assert.equal(dinero(199.5), "$199,50");
  assert.equal(dinero(undefined), "");
});

test("enlaceWhatsApp arma el mensaje con el mueble y el precio", () => {
  const url = enlaceWhatsApp("+593 99 123 4567", "Muebles Ideal", r({ nombre: "Sofá Bruno", precioRemate: 450 }));
  assert.ok(url.startsWith("https://wa.me/593991234567?text="));
  const texto = decodeURIComponent(url.split("text=")[1]);
  assert.equal(texto, "Hola Muebles Ideal, me interesa el Sofá Bruno ($450) que vi en la página de remates.");
});

test("urlCSV normaliza el enlace publicado de Google Sheets", () => {
  assert.equal(urlCSV("https://docs.google.com/spreadsheets/d/e/XYZ/pubhtml"), "https://docs.google.com/spreadsheets/d/e/XYZ/pub?output=csv");
  assert.equal(urlCSV("https://docs.google.com/spreadsheets/d/e/XYZ/pub?output=tsv"), "https://docs.google.com/spreadsheets/d/e/XYZ/pub?output=csv");
  assert.equal(urlCSV("https://docs.google.com/spreadsheets/d/e/XYZ/pub?gid=0&single=true"), "https://docs.google.com/spreadsheets/d/e/XYZ/pub?gid=0&single=true&output=csv");
  assert.equal(urlCSV("  "), "");
});

test("whatsapp deja solo dígitos y demoPermitido nunca abre demo en producción", () => {
  assert.equal(whatsapp(MUEBLES_IDEAL, { [MUEBLES_IDEAL.waEnv]: "+593 99 123 4567" }), "593991234567");
  assert.equal(whatsapp(MUEBLES_IDEAL, {}), "");
  assert.equal(demoPermitido({ NODE_ENV: "production" }), false);
  assert.equal(demoPermitido({ NODE_ENV: "development" }), true);
  assert.equal(demoPermitido({ NODE_ENV: "production", REMATES_ALLOW_DEMO: "true" }), true);
});
