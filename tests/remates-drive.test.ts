import { test } from "node:test";
import assert from "node:assert/strict";

import { archivosARemates, esImagen, fotoDeDrive, leerNombreArchivo } from "../lib/remates-drive";

test("esImagen acepta formatos de foto y descarta lo demás", () => {
  for (const n of ["a.jpg", "a.JPEG", "a.png", "a.webp", "a.HEIC"]) assert.equal(esImagen(n), true, n);
  for (const n of ["a.pdf", "a.mp4", "a", "a.jpg.txt"]) assert.equal(esImagen(n), false, n);
});

test("lee nombre, los dos precios y la categoría del nombre del archivo", () => {
  const p = leerNombreArchivo("Sofá Bruno - 720 - 450 - Salas.jpg");
  assert.equal(p.nombre, "Sofá Bruno");
  assert.equal(p.precioAntes, 720);
  assert.equal(p.precioRemate, 450);
  assert.equal(p.categoria, "Salas");
  assert.equal(p.vendido, false);
});

test("un solo precio es el de remate", () => {
  const p = leerNombreArchivo("Mesa de centro - 199.png");
  assert.equal(p.nombre, "Mesa de centro");
  assert.equal(p.precioRemate, 199);
  assert.equal(p.precioAntes, undefined);
});

test("sin precio publica el mueble igual", () => {
  const p = leerNombreArchivo("Juego de comedor.jpg");
  assert.equal(p.nombre, "Juego de comedor");
  assert.equal(p.precioRemate, undefined);
});

test("da igual el orden de los precios: el mayor es el de antes", () => {
  const p = leerNombreArchivo("Cama - 450 - 720.jpg");
  assert.equal(p.precioAntes, 720);
  assert.equal(p.precioRemate, 450);
});

test("acepta $ y separadores de miles", () => {
  const p = leerNombreArchivo("Modular - $1.200 - $890.jpg");
  assert.equal(p.precioAntes, 1200);
  assert.equal(p.precioRemate, 890);
});

test("la palabra VENDIDO marca el mueble y no ensucia el nombre", () => {
  const p = leerNombreArchivo("Colchón Ortopédico - 340 - 199 VENDIDO.jpg");
  assert.equal(p.vendido, true);
  assert.equal(p.nombre, "Colchón Ortopédico");
  assert.equal(p.precioRemate, 199);
});

test("la numeración para ordenar y el (1) de copia no se muestran", () => {
  assert.equal(leerNombreArchivo("01. Sofá Bruno - 450.jpg").nombre, "Sofá Bruno");
  assert.equal(leerNombreArchivo("3) Mesa - 90.jpg").nombre, "Mesa");
  assert.equal(leerNombreArchivo("Mesa (1).jpg").nombre, "Mesa");
});

test("fotoDeDrive arma la URL de imagen directa", () => {
  assert.equal(fotoDeDrive("ABC123"), "https://lh3.googleusercontent.com/d/ABC123");
});

test("archivosARemates convierte la carpeta en catálogo y usa la subcarpeta como categoría", () => {
  const items = archivosARemates([
    { id: "1", nombre: "Sofá Bruno - 720 - 450.jpg", carpeta: "Salas" },
    { id: "2", nombre: "notas.pdf", carpeta: "Salas" },
    { id: "3", nombre: "Cama Milano - 590.jpg", carpeta: "Dormitorios" },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0].nombre, "Sofá Bruno");
  assert.equal(items[0].categoria, "Salas");
  assert.deepEqual(items[0].fotos, ["https://lh3.googleusercontent.com/d/1"]);
  assert.equal(items[1].categoria, "Dormitorios");
});

test("la categoría del nombre del archivo manda sobre la subcarpeta", () => {
  const items = archivosARemates([{ id: "1", nombre: "Sofá - 450 - Ofertas.jpg", carpeta: "Salas" }]);
  assert.equal(items[0].categoria, "Ofertas");
});

test("varias fotos del mismo mueble se agrupan en una ficha", () => {
  const items = archivosARemates([
    { id: "1", nombre: "Sofá Bruno - 720 - 450.jpg" },
    { id: "2", nombre: "Sofá Bruno (1).jpg" },
    { id: "3", nombre: "sofa bruno.jpg" },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].fotos.length, 3);
  assert.equal(items[0].precioRemate, 450);
});

test("si cualquier foto del mueble dice VENDIDO, el mueble queda vendido", () => {
  const items = archivosARemates([
    { id: "1", nombre: "Mesa - 300.jpg" },
    { id: "2", nombre: "Mesa VENDIDO.jpg" },
  ]);
  assert.equal(items[0].vendido, true);
});

test("un archivo sin nombre utilizable se ignora", () => {
  assert.deepEqual(archivosARemates([{ id: "1", nombre: ".jpg" }]), []);
  assert.deepEqual(archivosARemates([]), []);
});
