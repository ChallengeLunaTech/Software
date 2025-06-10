"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Target, FileText, Download, Zap } from "lucide-react"
import type { ConfiguracaoProjeto } from "./configuracao-projeto"

interface CronogramaCondicionalProps {
  excelData: any[]
  configuracao: ConfiguracaoProjeto
  onVoltarConfiguracao: () => void
  onGerarCompleto: (cronogramaCondicional: any) => void
}

export default function CronogramaCondicional({
  excelData,
  configuracao,
  onVoltarConfiguracao,
  onGerarCompleto,
}: CronogramaCondicionalProps) {
  const [viewMode, setViewMode] = useState("resumo")

  // Gerar cronograma baseado na configuração
  const cronogramaCondicional = useMemo(() => {
    return gerarCronogramaCondicional(excelData, configuracao)
  }, [excelData, configuracao])

  function gerarCronogramaCondicional(data: any[], config: ConfiguracaoProjeto) {
    // Mapear colunas
    const primeiraLinha = data[0] || {}
    const colunas = Object.keys(primeiraLinha)

    const mapeamento = {
      tarefa: encontrarColuna(colunas, ["tarefa", "atividade", "task", "nome", "titulo", "título"]),
      fase: encontrarColuna(colunas, ["fase", "etapa", "stage", "phase"]),
      categoria: encontrarColuna(colunas, ["categoria", "category", "tipo", "type"]),
      condicao: encontrarColuna(colunas, ["condicao", "condição", "condition", "criterio", "critério"]),
      duracao: encontrarColuna(colunas, ["duracao", "duração", "duration", "tempo", "prazo"]),
      numero: encontrarColuna(colunas, ["numero", "número", "number", "id", "seq"]),
      classificacao: encontrarColuna(colunas, ["classificacao", "classificação", "class", "priority"]),
    }

    // Filtrar tarefas baseado na configuração
    const tarefasSelecionadas = data.filter((item) => {
      const fase = item[mapeamento.fase]
      const condicao = item[mapeamento.condicao]

      // Verificar se a fase está ativa
      const faseConfig = config.fasesSelecionadas[fase]
      if (!faseConfig?.ativa) return false

      // Incluir tarefas "sempre" se configurado
      const isSempre = ["sempre", "obrigatório", "obrigatorio", "required"].includes(condicao?.toLowerCase() || "")
      if (isSempre && config.criteriosDecisao.incluirSempre) return true

      // Incluir tarefas das condições selecionadas
      return faseConfig.condicoesSelecionadas.includes(condicao)
    })

    // Processar tarefas
    const tarefasProcessadas = tarefasSelecionadas.map((item, index) => {
      const condicao = item[mapeamento.condicao] || ""
      const isObrigatoria = ["sempre", "obrigatório", "obrigatorio", "required"].includes(condicao.toLowerCase())

      return {
        id: index + 1,
        tarefa: item[mapeamento.tarefa] || `Tarefa ${index + 1}`,
        fase: item[mapeamento.fase] || "Sem fase",
        categoria: item[mapeamento.categoria] || "Geral",
        classificacao: item[mapeamento.classificacao] || "",
        condicao: condicao,
        numero: item[mapeamento.numero] || null,
        duracao: item[mapeamento.duracao] || "1 dia",
        obrigatoria: isObrigatoria,
        motivoInclusao: isObrigatoria ? "Tarefa obrigatória" : "Condição selecionada",
        dadosOriginais: item,
      }
    })

    // Calcular estatísticas
    const estatisticas = calcularEstatisticas(tarefasProcessadas, config)

    return {
      tarefas: tarefasProcessadas,
      configuracao: config,
      estatisticas,
      relatorioDecisoes: gerarRelatorioDecisoes(config, tarefasProcessadas, data.length),
    }
  }

  function encontrarColuna(colunas: string[], possiveisNomes: string[]): string | null {
    for (const nome of possiveisNomes) {
      const coluna = colunas.find(
        (c) => c.toLowerCase().includes(nome.toLowerCase()) || nome.toLowerCase().includes(c.toLowerCase()),
      )
      if (coluna) return coluna
    }
    return null
  }

  function calcularEstatisticas(tarefas: any[], config: ConfiguracaoProjeto) {
    const faseStats = tarefas.reduce((acc: any, tarefa) => {
      const fase = tarefa.fase
      if (!acc[fase]) {
        acc[fase] = { total: 0, obrigatorias: 0, condicionais: 0, duracao: 0 }
      }
      acc[fase].total++
      if (tarefa.obrigatoria) acc[fase].obrigatorias++
      else acc[fase].condicionais++
      acc[fase].duracao += parseDuracao(tarefa.duracao)
      return acc
    }, {})

    const duracaoTotal = Object.values(faseStats).reduce((total: number, fase: any) => total + fase.duracao, 0)

    return {
      totalTarefas: tarefas.length,
      tarefasObrigatorias: tarefas.filter((t) => t.obrigatoria).length,
      tarefasCondicionais: tarefas.filter((t) => !t.obrigatoria).length,
      fasesAtivas: Object.keys(faseStats).length,
      duracaoTotal,
      duracaoFormatada: formatarDuracao(duracaoTotal),
      faseStats,
      dataEstimadaConclusao: new Date(Date.now() + duracaoTotal * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      eficiencia: Math.round((tarefas.length / excelData.length) * 100),
    }
  }

  function gerarRelatorioDecisoes(config: ConfiguracaoProjeto, tarefasSelecionadas: any[], totalOriginal: number) {
    const fasesAtivas = Object.entries(config.fasesSelecionadas).filter(([_, faseConfig]) => faseConfig.ativa)

    const decisoes = fasesAtivas.map(([fase, faseConfig]) => ({
      fase,
      ativa: faseConfig.ativa,
      condicoesSelecionadas: faseConfig.condicoesSelecionadas,
      justificativa: faseConfig.justificativa,
      tarefasIncluidas: tarefasSelecionadas.filter((t) => t.fase === fase).length,
    }))

    return {
      projeto: {
        objetivo: config.objetivo,
        segmento: config.segmento,
        categoria: config.categoria,
        prazoDesejado: config.prazoDesejado,
      },
      criterios: config.criteriosDecisao,
      decisoesPorFase: decisoes,
      resumo: {
        totalOriginal,
        totalSelecionado: tarefasSelecionadas.length,
        percentualInclusao: Math.round((tarefasSelecionadas.length / totalOriginal) * 100),
        fasesAtivas: fasesAtivas.length,
        totalCondicoesSelecionadas: fasesAtivas.reduce(
          (total, [_, faseConfig]) => total + faseConfig.condicoesSelecionadas.length,
          0,
        ),
      },
    }
  }

  function parseDuracao(duracaoStr: string): number {
    if (!duracaoStr) return 1
    const str = duracaoStr.toLowerCase()
    const match = str.match(/(\d+)/)
    if (!match) return 1
    const numero = Number.parseInt(match[1], 10)
    if (str.includes("semana")) return numero * 7
    if (str.includes("mes") || str.includes("mês")) return numero * 30
    return numero
  }

  function formatarDuracao(dias: number): string {
    if (dias >= 30) {
      const meses = Math.floor(dias / 30)
      const diasRestantes = dias % 30
      return `${meses} ${meses === 1 ? "mês" : "meses"}${diasRestantes > 0 ? ` e ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}` : ""}`
    } else if (dias >= 7) {
      const semanas = Math.floor(dias / 7)
      const diasRestantes = dias % 7
      return `${semanas} ${semanas === 1 ? "semana" : "semanas"}${diasRestantes > 0 ? ` e ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}` : ""}`
    } else {
      return `${dias} ${dias === 1 ? "dia" : "dias"}`
    }
  }

  const { tarefas, estatisticas, relatorioDecisoes } = cronogramaCondicional

  return (
    <div className="space-y-6">
      {/* Header com informações do projeto */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Cronograma Condicional - {configuracao.objetivo}
          </CardTitle>
          <CardDescription>Cronograma otimizado baseado nas condições selecionadas para cada fase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.totalTarefas}</div>
              <div className="text-sm text-slate-600">Tarefas Selecionadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estatisticas.eficiencia}%</div>
              <div className="text-sm text-slate-600">Eficiência</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{estatisticas.duracaoFormatada}</div>
              <div className="text-sm text-slate-600">Duração Estimada</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{estatisticas.fasesAtivas}</div>
              <div className="text-sm text-slate-600">Fases Ativas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="fases">Por Fases</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Otimização Concluída:</strong> {estatisticas.eficiencia}% das tarefas originais foram
                  selecionadas baseado nos critérios definidos, resultando em um cronograma de{" "}
                  {estatisticas.duracaoFormatada}.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-3">Distribuição por Tipo</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tarefas Obrigatórias:</span>
                      <Badge className="bg-green-100 text-green-800">{estatisticas.tarefasObrigatorias}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarefas Condicionais:</span>
                      <Badge className="bg-blue-100 text-blue-800">{estatisticas.tarefasCondicionais}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Informações do Projeto</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Segmento:</strong> {configuracao.segmento}
                    </p>
                    <p>
                      <strong>Categoria:</strong> {configuracao.categoria}
                    </p>
                    <p>
                      <strong>Conclusão Estimada:</strong> {estatisticas.dataEstimadaConclusao}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Duração por Fase</h4>
                <div className="space-y-3">
                  {Object.entries(estatisticas.faseStats).map(([fase, stats]: [string, any]) => (
                    <div key={fase} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {fase} ({stats.total} tarefas)
                        </span>
                        <span>{formatarDuracao(stats.duracao)}</span>
                      </div>
                      <Progress value={(stats.duracao / estatisticas.duracaoTotal) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarefas" className="space-y-4">
          <div className="space-y-4">
            {tarefas.map((tarefa, index) => (
              <Card
                key={index}
                className={`${tarefa.obrigatoria ? "border-l-4 border-l-green-500" : "border-l-4 border-l-blue-500"}`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {tarefa.numero && (
                          <Badge variant="outline" className="font-mono">
                            #{tarefa.numero}
                          </Badge>
                        )}
                        <h4 className="font-semibold">{tarefa.tarefa}</h4>
                        {tarefa.obrigatoria && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OBRIGATÓRIA
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {tarefa.fase}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50">
                          {tarefa.categoria}
                        </Badge>
                        <Badge variant="outline" className="bg-amber-50">
                          {tarefa.condicao}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500">Motivo: {tarefa.motivoInclusao}</p>
                    </div>

                    <div className="text-right">
                      <Badge>{tarefa.duracao}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fases" className="space-y-4">
          {Object.entries(estatisticas.faseStats).map(([fase, stats]: [string, any]) => {
            const tarefasDaFase = tarefas.filter((t) => t.fase === fase)

            return (
              <Card key={fase} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{fase}</span>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">{stats.obrigatorias} obrigatórias</Badge>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{stats.condicionais} condicionais</Badge>
                      <Badge variant="outline">{formatarDuracao(stats.duracao)}</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tarefasDaFase.map((tarefa, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          {tarefa.numero && (
                            <Badge variant="outline" className="font-mono text-xs">
                              #{tarefa.numero}
                            </Badge>
                          )}
                          <span className="font-medium">{tarefa.tarefa}</span>
                          {tarefa.obrigatoria && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                        <Badge>{tarefa.duracao}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Relatório de Decisões
              </CardTitle>
              <CardDescription>Documentação detalhada das escolhas realizadas na configuração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Informações do Projeto</h4>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                  <p>
                    <strong>Objetivo:</strong> {relatorioDecisoes.projeto.objetivo}
                  </p>
                  <p>
                    <strong>Segmento:</strong> {relatorioDecisoes.projeto.segmento}
                  </p>
                  <p>
                    <strong>Categoria:</strong> {relatorioDecisoes.projeto.categoria}
                  </p>
                  {relatorioDecisoes.projeto.prazoDesejado && (
                    <p>
                      <strong>Prazo Desejado:</strong> {relatorioDecisoes.projeto.prazoDesejado}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Critérios de Decisão Aplicados</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 ${relatorioDecisoes.criterios.incluirSempre ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span className="text-sm">Incluir tarefas marcadas como "Sempre"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 ${relatorioDecisoes.criterios.incluirObrigatorias ? "text-green-600" : "text-slate-400"}`}
                    />
                    <span className="text-sm">Incluir tarefas obrigatórias</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Decisões por Fase</h4>
                <div className="space-y-4">
                  {relatorioDecisoes.decisoesPorFase.map((decisao, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{decisao.fase}</h5>
                        <Badge>{decisao.tarefasIncluidas} tarefas incluídas</Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Condições selecionadas:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {decisao.condicoesSelecionadas.map((condicao, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {condicao}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {decisao.justificativa && (
                          <div>
                            <strong>Justificativa:</strong>
                            <p className="text-slate-600 mt-1">{decisao.justificativa}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Resumo Final</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Total Original:</strong> {relatorioDecisoes.resumo.totalOriginal} tarefas
                      </p>
                      <p>
                        <strong>Total Selecionado:</strong> {relatorioDecisoes.resumo.totalSelecionado} tarefas
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Percentual de Inclusão:</strong> {relatorioDecisoes.resumo.percentualInclusao}%
                      </p>
                      <p>
                        <strong>Fases Ativas:</strong> {relatorioDecisoes.resumo.fasesAtivas}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <Card>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onVoltarConfiguracao}>
            Voltar à Configuração
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Relatório
            </Button>
            <Button onClick={() => onGerarCompleto(cronogramaCondicional)} className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Gerar Cronograma Completo
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
