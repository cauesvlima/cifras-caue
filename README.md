# Cifras Offline

SPA em React + Vite + TypeScript para criar e imprimir cifras pessoais, com autosave no `localStorage` e uso offline.

## Rodar o projeto

```bash
npm install
npm run dev
```

Para build:

```bash
npm run build
npm run preview
```

## Como editar cifras

1. **Cadastro**: informe título e tom (obrigatórios), além dos demais metadados.
2. **Letra crua**: cole apenas a letra, sem acordes.
3. **Editor**:
   - Edite cada linha com **acordes acima** da letra (alinhamento por espaços).
   - Use **+ Acorde** para inserir no cursor do campo de acordes.
   - A lista de **acordes recentes** aparece automaticamente.
   - Opcional: modo **Texto único** (pares de linhas: acorde + letra).
4. **Impressão**: ajuste cores, tamanho, espaçamento, transposição e capotraste no painel.

## Transposição

- O botão **- / +** move em **meio tom** (semitons).
- A transposição aplica-se apenas a tokens detectados como acordes.
- Suporte a sustenidos/bemóis, baixos (ex.: `A/C#`) e extensões (`m7`, `sus4`, `add9`, `maj7`, `b5`, `#9` etc.).
- Use **Preferir bemóis** para trocar a representação das notas.

## Backup pessoal

- **Exportar JSON** salva o estado completo no arquivo.
- **Importar JSON** restaura o projeto a partir do arquivo salvo.
- **Resetar** limpa o cache local do projeto atual.
