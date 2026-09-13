#!/usr/bin/env bash
#
# Calcula a próxima versão SemVer a partir da última tag alcançável e das
# mensagens de commit desde então (conventional commits).
#
# Uso:  scripts/next-version.sh [<ref>]
# Saída (stdout): a versão, ex. "v2.0.1"
#
# Regras de bump, da maior para a menor precedência:
#   major  -> commit com "!" antes dos ":" (ex. "feat!:", "Feat!"), ou
#             "BREAKING CHANGE" no corpo, ou "[major]" em qualquer lugar da mensagem
#   minor  -> título começando com feat/feature, com ou sem escopo e separador:
#             "feat:", "Feat: ...", "Feature - ...", "feat(ui) ...", "[Feat] ...",
#             ou "[minor]" na mensagem
#   patch  -> qualquer outra coisa (padrão)
#
# A comparação ignora maiúsculas/minúsculas.
#
# Se ainda não existir nenhuma tag no repositório, devolve SEED_VERSION.

set -euo pipefail

REF="${1:-HEAD}"
SEED_VERSION="${SEED_VERSION:-v0.1.0}"
TAG_PATTERN="${TAG_PATTERN:-v[0-9]*.[0-9]*.[0-9]*}"

# Última tag alcançável a partir de REF. Sem tags -> semeia e encerra.
if ! last_tag="$(git describe --tags --abbrev=0 --match "$TAG_PATTERN" "$REF" 2>/dev/null)"; then
  echo "$SEED_VERSION"
  exit 0
fi

if [[ ! "$last_tag" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "última tag '$last_tag' não é SemVer vX.Y.Z" >&2
  exit 1
fi
major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"

# Commits novos desde a última tag. Nenhum -> nada a versionar.
range="${last_tag}..${REF}"
if [ -z "$(git rev-list "$range")" ]; then
  echo "$last_tag"
  exit 0
fi

# Regexes em variáveis: dentro de [[ =~ ]] os parênteses precisam vir assim.
# Tudo é comparado em minúsculas (via tr, para funcionar também no bash 3 do macOS).
re_breaking='^[a-z]+(\([^)]*\))?![[:space:]]*:'
# Tipos conhecidos podem marcar breaking só com "!", sem os dois-pontos ("Feat! ...")
re_breaking_typed='^\[?(feat|feature|fix|bugfix|hotfix|refactor|perf)\]?(\([^)]*\))?!'
# feat/feature seguido de separador (":", "-", espaço) ou fim; não pega "featured"
re_feat='^\[?(feat|feature)\]?(\([^)]*\))?([[:space:]]*[:-]|[[:space:]]|$)'

bump=patch
while IFS= read -r -d '' msg; do
  msg="$(printf '%s' "$msg" | tr '[:upper:]' '[:lower:]')"
  subject="${msg%%$'\n'*}"
  if [[ "$subject" =~ $re_breaking ]] \
     || [[ "$subject" =~ $re_breaking_typed ]] \
     || [[ "$msg" == *"breaking change"* ]] \
     || [[ "$msg" == *"[major]"* ]]; then
    bump=major
    break
  fi
  if [[ "$subject" =~ $re_feat ]] || [[ "$msg" == *"[minor]"* ]]; then
    bump=minor
  fi
done < <(git log --format='%B%x00' "$range")

case "$bump" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

echo "v${major}.${minor}.${patch}"
