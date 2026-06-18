#!/bin/bash

set -e

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║       OPINIA — Plataforma de Pesquisa         ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker não encontrado. Instale em: https://www.docker.com"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
  echo "❌ Docker Compose não encontrado."
  exit 1
fi

echo "🐳 Iniciando serviços com Docker Compose..."
docker-compose up --build -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

echo ""
echo "✅ Serviços disponíveis:"
echo "   🌐 Frontend:  http://localhost:4200"
echo "   🔌 Backend:   http://localhost:3000"
echo "   🗄️  Database:  localhost:5432"
echo ""
echo "🔑 Credenciais padrão:"
echo "   E-mail:  admin@opinia.com"
echo "   Senha:   admin123"
echo ""
echo "📋 Comandos úteis:"
echo "   docker-compose logs -f backend    # logs do backend"
echo "   docker-compose logs -f frontend   # logs do frontend"
echo "   docker-compose down               # parar serviços"
echo ""
