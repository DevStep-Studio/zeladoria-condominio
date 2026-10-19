#!/usr/bin/env bash

# Gerenciador de Serviço em Background para o Auto-Commit
# Uso:
#   ./scripts/auto-commit-daemon.sh start          (Inicia em background)
#   ./scripts/auto-commit-daemon.sh start --push   (Inicia em background com push automático)
#   ./scripts/auto-commit-daemon.sh stop           (Encerra o serviço)
#   ./scripts/auto-commit-daemon.sh status         (Verifica se está rodando)
#   ./scripts/auto-commit-daemon.sh logs           (Exibe logs em tempo real)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$ROOT_DIR/.autocommit.pid"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/autocommit.log"

ACTION="$1"
shift

mkdir -p "$LOG_DIR"

case "$ACTION" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "⚠️  Auto-commit já está em execução (PID: $(cat "$PID_FILE"))."
      exit 0
    fi

    echo "🚀 Iniciando Auto-Commit em background..."
    nohup node "$SCRIPT_DIR/auto-commit.mjs" "$@" >> "$LOG_FILE" 2>&1 &
    PID=$!
    echo "$PID" > "$PID_FILE"
    sleep 1

    if kill -0 "$PID" 2>/dev/null; then
      echo "✅ Auto-Commit iniciado com sucesso (PID: $PID)!"
      echo "📄 Logs em tempo real: npm run autocommit:logs  (ou ./scripts/auto-commit-daemon.sh logs)"
    else
      echo "❌ Falha ao iniciar auto-commit. Verifique os logs em $LOG_FILE"
      rm -f "$PID_FILE"
      exit 1
    fi
    ;;

  stop)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Parando Auto-Commit (PID: $PID)..."
        kill "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Auto-Commit parado com sucesso."
      else
        echo "⚠️  Processo não estava em execução. Limpando arquivo de PID."
        rm -f "$PID_FILE"
      fi
    else
      echo "ℹ️  Auto-Commit não está em execução."
    fi
    ;;

  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "🟢 Auto-Commit ATIVO e monitorando (PID: $(cat "$PID_FILE"))."
    else
      echo "⚪ Auto-Commit DESATIVADO."
    fi
    ;;

  logs)
    if [ -f "$LOG_FILE" ]; then
      tail -n 40 -f "$LOG_FILE"
    else
      echo "ℹ️  Arquivo de log ainda não foi criado ($LOG_FILE)."
    fi
    ;;

  *)
    echo "Uso: $0 {start|stop|status|logs} [--push]"
    exit 1
    ;;
esac
