# Trabalho de Visualização

## Configuração dos Dados

Tudo que estiver dentro da pasta **"00 - data"** do código do professor deve ser copiado para a pasta **"data"**.

Os dados **não são enviados para o Git** por serem grandes demais.

Se quiser utilizar dados de outros anos, além de **2023**, devem ser baixados e colocados na pasta do **taxi** correspondente.

---

## Desenvolvimento

- Faça uma **branch local**, não modifique diretamente o **main**.  
- O código já está todo configurado.  
- Para criar os gráficos desejados:
  - Crie **novas consultas SQL** em `taxi.js` e `main.js`.  
  - Adicione um **botão em `index.html`** para carregar o seu gráfico no SVG.

---

## Criando Novos Gráficos

1. Crie um novo arquivo, por exemplo **`plot2.js`**, e copie tudo de `plot.js`.  
2. Faça modificações a partir do comentário: "// ---- Escalas", tudo que vem antes são tratamentos de dados e definições das margens.

3. Utilize as constantes innerWidth e innerHeight para definir o tamanho que o gráfico irá utilizar de todo o canvas SVG.

## Importante

Lembre-se de deixar as consultas que estão sendo utilizadas pelos outros gráficos com os mesmos nomes de variáveis e com as consultas intocadas! Não quebre o código que já está funcionando!

