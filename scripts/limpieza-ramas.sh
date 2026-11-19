#!/usr/bin/env bash
# Limpieza de ramas del repo advibe. Auditoría: docs/advibe-os/infra-vercel.md
#
#   bash scripts/limpieza-ramas.sh              # muestra qué haría (no borra)
#   bash scripts/limpieza-ramas.sh --ejecutar   # borra de verdad
#
# Vuelve a verificar todo antes de borrar: no se fía de la lista escrita.

set -uo pipefail

EJECUTAR=0
[[ "${1:-}" == "--ejecutar" ]] && EJECUTAR=1

FUSIONADAS=(
  chore/remove-one-time-optimize-workflow
  claude/advibe-ai-photo-editor-izz6aw
  claude/advibe-repo-setup-3rmxvv
  claude/bold-knuth-kcjm7a
  claude/landing-latin-eagle
  claude/sleepy-pascal-56j512
  claude/tender-hypatia-1258mz
  feat/ventads-schema-module1
  feature/enfoque-public-final
  fix-goat-mobile-final
  fix-web-carefully
  fix/enfoque-contact
  fix/p0-testimonials-og-image
  fix/p1-cta-consistency-tracking
  fix/p1-security-headers
  fix/ventads-photo-framing
  fix/vercel-production-build
  mejora-hero-local
  redesign-interactive-advibe
)

# Duplicados exactos: deben apuntar al mismo commit que la rama que se conserva.
CONSERVAR=feat/advibe-visual-redesign
DUPLICADAS=(
  feat/advibe-visual-redesign-check
  feat/advibe-visual-redesign-check2
  feat/advibe-visual-redesign-final
  feat/advibe-visual-redesign-pr
)

# El intento de publicación de campañas que se descartó. Cierra el PR #53.
DESCARTADA=feat/advibe-meta-marketing-api-integration

BORRAR=()
SALTAR=()

echo "Actualizando referencias desde origin..."
git fetch --quiet --prune origin || { echo "ERROR: no se pudo contactar origin"; exit 1; }

sha_remoto() { git ls-remote --heads origin "$1" | awk '{print $1}'; }

echo
echo "== Ramas fusionadas en main =="
for b in "${FUSIONADAS[@]}"; do
  if [[ -z "$(sha_remoto "$b")" ]]; then
    echo "  ya no existe: $b"
  elif git merge-base --is-ancestor "origin/$b" origin/main 2>/dev/null; then
    echo "  contenida en main, se borra: $b"
    BORRAR+=("$b")
  else
    echo "  !! TIENE COMMITS FUERA DE MAIN, se conserva: $b"
    SALTAR+=("$b")
  fi
done

echo
echo "== Duplicados de $CONSERVAR =="
REF=$(sha_remoto "$CONSERVAR")
if [[ -z "$REF" ]]; then
  echo "  !! $CONSERVAR no existe en origin. No se borra ningún duplicado."
  SALTAR+=("${DUPLICADAS[@]}")
else
  echo "  referencia conservada: ${REF:0:7}"
  for b in "${DUPLICADAS[@]}"; do
    s=$(sha_remoto "$b")
    if [[ -z "$s" ]]; then
      echo "  ya no existe: $b"
    elif [[ "$s" == "$REF" ]]; then
      echo "  mismo commit, se borra: $b"
      BORRAR+=("$b")
    else
      echo "  !! APUNTA A OTRO COMMIT (${s:0:7}), se conserva: $b"
      SALTAR+=("$b")
    fi
  done
fi

echo
echo "== Intento descartado =="
if [[ -z "$(sha_remoto "$DESCARTADA")" ]]; then
  echo "  ya no existe: $DESCARTADA"
elif git merge-base --is-ancestor "origin/$DESCARTADA" origin/main 2>/dev/null; then
  echo "  se borra (ya está en main): $DESCARTADA"
  BORRAR+=("$DESCARTADA")
else
  echo "  se borra: $DESCARTADA"
  echo "  AVISO: no está fusionada en main. Es lo esperado: este trabajo se"
  echo "         descartó a propósito. Al borrarla se cierra el PR #53."
  BORRAR+=("$DESCARTADA")
fi

echo
echo "-------------------------------------------"
echo "A borrar:    ${#BORRAR[@]}"
echo "Conservadas: ${#SALTAR[@]}"
echo "-------------------------------------------"

if [[ ${#BORRAR[@]} -eq 0 ]]; then
  echo "Nada que hacer."
  exit 0
fi

if [[ $EJECUTAR -eq 0 ]]; then
  echo
  echo "Simulación. Para borrar de verdad:"
  echo "  bash scripts/limpieza-ramas.sh --ejecutar"
  exit 0
fi

echo
echo "Borrando..."
git push origin --delete "${BORRAR[@]}"
echo
echo "Listo. Ramas restantes: $(git ls-remote --heads origin | wc -l)"
