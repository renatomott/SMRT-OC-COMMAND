# ⚠️ HOTFIX DE SEGURANÇA — EXECUTE IMEDIATAMENTE

## Problema
`scripts/serviceAccountKey.json` está commitado no histórico do repositório.
Essa chave tem acesso **admin** ao Firebase (`clawdbot-app-e5db1`).

---

## Passo 1 — Revogar a chave atual (firebase console)
1. Acesse: https://console.firebase.google.com/project/clawdbot-app-e5db1/settings/serviceaccounts/adminsdk
2. Clique na chave → **Revogar**
3. Gere uma nova → salve localmente em `scripts/serviceAccountKey.json`
   (o `.gitignore` já foi atualizado para bloquear esse arquivo)

---

## Passo 2 — Remover do histórico git com BFG
```bash
brew install bfg   # se não tiver

cd ~/caminho/SMRT-OC-COMMAND
bfg --delete-files serviceAccountKey.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## Passo 3 — Confirmar limpeza
```bash
# Deve retornar vazio
git log --all --full-history -- "scripts/serviceAccountKey.json"
```

---

## Passo 4 — Atualizar chave no sync script
Copie a nova chave gerada para:
```
~/.config/firebase/serviceAccountKey.json
```
