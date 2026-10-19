# Algoritmo de Ranking e Reputação — Zeladoria Serviços

## 1. Princípio Fundamental de Integridade
> **PREMIUM NÃO ALTERA RANKING ORGÂNICO.**
>
> Patrocínio é rotulado estritamente com o selo **"PATROCINADO"** e nunca distorce o algoritmo de relevância técnica.

---

## 2. Composição da Nota e Score Ponderado

A pontuação do prestador (Score de 0 a 100) é calculada por múltiplos fatores auditáveis:

```typescript
Score = (
    (ratingBayesiano * 0.40) +          // Média de estrelas com suavização bayesiana
    (completionRateScore * 0.25) +      // Taxa de serviços concluídos sem cancelamento
    (reviewsVolumeScore * 0.15) +       // Quantidade de avaliações verificadas
    (responseTimeScore * 0.10) +        // Agilidade no atendimento (minutos)
    (verifiedBadgeBonus * 0.10)         // Documentos e antecedentes aprovados (+10 pts)
)
```

### Proteção para Novos Prestadores ("Cold Start")
- Prestadores recém-aprovados recebem o selo de identificação **"Novo no Zeladoria"**.
- O cálculo bayesiano impede que um prestador com 1 única avaliação 5 estrelas fique posicionado acima de um profissional com 300 avaliações de nota 4.9.
