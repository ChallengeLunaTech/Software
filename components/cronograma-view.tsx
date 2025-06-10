"use client"

import { useState, useMemo } from "react"
import { Calendar, Clock, CalendarIcon, Tag, CheckCircle, Brain, Zap, Hash } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BuscaAvancada from "./busca-avancada"

interface CronogramaViewProps {
  cronograma: any
  excelData: any
}

export default function CronogramaView({ cronograma, excelData }: CronogramaViewProps) {
  const [filtros, setFiltros] = useState({
    buscaTexto: "",
    buscaNumero: "",
    filtroFase: "todas",
    filtroCategoria: "todas",
    filtroStatus: "todos",
    filtroCondicao: "todas",
  })
  const [viewMode, setViewMode] = useState("lista")

  const { tarefas, analiseOriginal, estatisticas, processamento } = cronograma || {}

  // Extrair fases e categorias dos dados processados
  const fases = useMemo(() => [...new Set(tarefas.map((t: any) => t.fase))].filter(Boolean).sort(), [tarefas])
  const categorias = useMemo(() => [...new Set(tarefas.map((t: any) => t.categoria))].filter(Boolean).sort(), [tarefas])

  // Agrupar tarefas por fase
  const tarefasPorFase = useMemo(() => {
    return tarefas.reduce((acc: any, tarefa: any) => {
      const fase = tarefa.fase || "Sem fase"
      if (!acc[fase]) {
        acc[fase] = []
      }
      acc[fase].push(tarefa)
      return acc
    }, {})
  }, [tarefas])

  // Filtrar e buscar tarefas
  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter((tarefa: any) => {
      // Filtros básicos
      const statusMatch = filtros.filtroStatus === "todos" || tarefa.status === filtros.filtroStatus
      const faseMatch = filtros.filtroFase === "todas" || tarefa.fase === filtros.filtroFase
      const categoriaMatch = filtros.filtroCategoria === "todas" || tarefa.categoria === filtros.filtroCategoria
      const condicaoMatch = filtros.filtroCondicao === "todas" || tarefa.condicao === filtros.filtroCondicao

      // Busca por texto melhorada
      let textoMatch = true
      if (filtros.buscaTexto && filtros.buscaTexto.trim()) {
        const termoBusca = filtros.buscaTexto.toLowerCase().trim()

        const camposBusca = [
          tarefa.tarefa || "",
          tarefa.fase || "",
          tarefa.categoria || "",
          tarefa.condicao || "",
          tarefa.classificacao || "",
          String(tarefa.numero || ""),
          String(tarefa.id || ""),
        ]

        textoMatch = camposBusca.some((campo) => campo.toLowerCase().includes(termoBusca))

        if (!textoMatch) {
          const palavras = termoBusca.split(" ").filter((p) => p.length > 0)
          textoMatch = palavras.every((palavra) => camposBusca.some((campo) => campo.toLowerCase().includes(palavra)))
        }
      }

      // Busca por número
      let numeroMatch = true
      if (filtros.buscaNumero && filtros.buscaNumero.trim()) {
        const termoNumero = filtros.buscaNumero.trim()
        numeroMatch = tarefa.numero && String(tarefa.numero).includes(termoNumero)
      }

      return statusMatch && faseMatch && categoriaMatch && condicaoMatch && textoMatch && numeroMatch
    })
  }, [tarefas, filtros])

  // Função para calcular duração em dias
  function parseDuracao(duracaoStr: string) {
    if (!duracaoStr) return 1
    const str = duracaoStr.toLowerCase()
    const match = str.match(/(\d+)/)
    if (!match) return 1
    const numero = Number.parseInt(match[1], 10)
    if (str.includes("semana")) return numero * 7
    if (str.includes("mes") || str.includes("mês")) return numero * 30
    return numero
  }

  function calcularDuracaoTotal(tarefasList: any[]) {
    return tarefasList.reduce((total: number, tarefa: any) => {
      return total + parseDuracao(tarefa.duracao)
    }, 0)
  }

  function formatarDuracao(dias: number) {
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

  const limparFiltros = () => {
    setFiltros({
      buscaTexto: "",
      buscaNumero: "",
      filtroFase: "todas",
      filtroCategoria: "todas",
      filtroStatus: "todos",
      filtroCondicao: "todas",
    })
  }

  if (!cronograma) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-slate-500">Nenhum cronograma disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo da Análise Completa */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-600" />
            Cronograma Completo - Todas as Tarefas
          </CardTitle>
          <CardDescription>Todas as tarefas do Excel foram incluídas e organizadas automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Processamento Completo
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tarefas no Excel:</span>
                  <span className="font-medium">{processamento.totalOriginal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarefas processadas:</span>
                  <span className="font-medium text-green-600">{processamento.totalProcessado}</span>
                </div>
                <div className="flex justify-between">
                  <span>Com numeração:</span>
                  <span className="font-medium text-blue-600">{estatisticas.numeracao.comNumero}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sem numeração:</span>
                  <span className="font-medium text-purple-600">{estatisticas.numeracao.semNumero}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-500" />
                Análise de Numeração
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Números únicos:</span>
                  <span className="font-medium">{estatisticas.numeracao.numerosUnicos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Menor número:</span>
                  <span className="font-medium">{estatisticas.numeracao.numeroMinimo || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Maior número:</span>
                  <span className="font-medium">{estatisticas.numeracao.numeroMaximo || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Segmento:</span>
                  <span className="font-medium">{analiseOriginal.segmento}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resumo Geral - {analiseOriginal.segmento}
          </CardTitle>
          <CardDescription>Visão completa de todas as tarefas identificadas no Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estatisticas.totalTarefas}</div>
              <div className="text-sm text-slate-600">Total de Tarefas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estatisticas.tarefasObrigatorias}</div>
              <div className="text-sm text-slate-600">Obrigatórias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{estatisticas.tarefasOpcionais}</div>
              <div className="text-sm text-slate-600">Condicionais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{estatisticas.duracaoFormatada}</div>
              <div className="text-sm text-slate-600">Duração Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{estatisticas.dataEstimadaConclusao}</div>
              <div className="text-sm text-slate-600">Conclusão Estimada</div>
            </div>
          </div>

          {/* Alerta sobre processamento completo */}
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Processamento Completo:</strong> {processamento.criterio}.
              {estatisticas.numeracao.comNumero > 0 &&
                ` Tarefas organizadas por numeração (${estatisticas.numeracao.numeroMinimo} a ${estatisticas.numeracao.numeroMaximo}).`}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-500">Duração por Fase:</h3>
            <div className="space-y-3">
              {Object.entries(estatisticas.faseStats).map(([fase, stats]: [string, any]) => (
                <div key={fase} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {fase} ({stats.total} tarefas, {stats.comNumero} numeradas)
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

      {/* Busca e Filtros Avançados */}
      <BuscaAvancada tarefas={tarefas} onFiltroChange={setFiltros} filtrosAtivos={filtros} />

      {/* Visualização do Cronograma */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Todas as Tarefas
            </CardTitle>
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-[400px]">
              <TabsList>
                <TabsTrigger value="lista">Lista</TabsTrigger>
                <TabsTrigger value="fases">Por Fases</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="lista" className="mt-0">
            <div className="space-y-4">
              {tarefasFiltradas.length > 0 ? (
                tarefasFiltradas.map((tarefa: any, index: number) => (
                  <Card
                    key={index}
                    className={`hover:shadow-md transition-shadow ${tarefa.obrigatoria ? "border-l-4 border-l-green-500 bg-green-50/30" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {tarefa.numero && (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono">
                                    #{tarefa.numero}
                                  </Badge>
                                )}
                                <h4 className="font-semibold text-lg">{tarefa.tarefa}</h4>
                                {tarefa.obrigatoria && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    OBRIGATÓRIA
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {tarefa.fase && (
                                  <Badge variant="outline" className="bg-blue-50">
                                    {tarefa.fase}
                                  </Badge>
                                )}
                                {tarefa.categoria && (
                                  <Badge variant="outline" className="bg-purple-50">
                                    {tarefa.categoria}
                                  </Badge>
                                )}
                                {tarefa.condicao && (
                                  <Badge
                                    variant="outline"
                                    className={tarefa.obrigatoria ? "bg-green-100 text-green-800" : "bg-amber-50"}
                                  >
                                    {tarefa.condicao}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                            {tarefa.classificacao && (
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                <span>{tarefa.classificacao}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="font-medium">ID:</span>
                              <span>{tarefa.id}</span>
                            </div>

                            {tarefa.duracao && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{tarefa.duracao}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {tarefa.obrigatoria ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Clock className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-slate-500">Nenhuma tarefa encontrada com os filtros aplicados</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fases" className="mt-0">
            <div className="space-y-6">
              {Object.entries(tarefasPorFase)
                .filter(([fase, tarefas]: [string, any]) => {
                  // Filtrar fases que têm tarefas após aplicar filtros
                  const tarefasDaFase = tarefas.filter((t: any) => tarefasFiltradas.some((tf: any) => tf.id === t.id))
                  return tarefasDaFase.length > 0
                })
                .map(([fase, tarefas]: [string, any]) => {
                  const tarefasDaFase = tarefas.filter((t: any) => tarefasFiltradas.some((tf: any) => tf.id === t.id))
                  const tarefasObrigatoriasNaFase = tarefasDaFase.filter((t: any) => t.obrigatoria)
                  const tarefasComNumeroNaFase = tarefasDaFase.filter((t: any) => t.numero !== null)

                  return (
                    <Card key={fase} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center">
                          <span>{fase}</span>
                          <div className="flex gap-2">
                            {tarefasObrigatoriasNaFase.length > 0 && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {tarefasObrigatoriasNaFase.length} obrigatórias
                              </Badge>
                            )}
                            {tarefasComNumeroNaFase.length > 0 && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {tarefasComNumeroNaFase.length} numeradas
                              </Badge>
                            )}
                            <Badge variant="outline" className="ml-2">
                              {formatarDuracao(calcularDuracaoTotal(tarefasDaFase))}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {tarefasDaFase.map((tarefa: any, index: number) => (
                            <div
                              key={index}
                              className={`p-3 border rounded-md hover:bg-slate-50 transition-colors flex justify-between items-center ${
                                tarefa.obrigatoria ? "border-green-200 bg-green-50/50" : ""
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  {tarefa.numero && (
                                    <Badge variant="outline" className="bg-slate-100 text-slate-700 font-mono text-xs">
                                      #{tarefa.numero}
                                    </Badge>
                                  )}
                                  <p className="font-medium">{tarefa.tarefa}</p>
                                  {tarefa.obrigatoria && <CheckCircle className="w-4 h-4 text-green-600" />}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {tarefa.categoria && (
                                    <Badge variant="outline" className="bg-purple-50 text-xs">
                                      {tarefa.categoria}
                                    </Badge>
                                  )}
                                  {tarefa.condicao && (
                                    <Badge
                                      variant="outline"
                                      className={
                                        tarefa.obrigatoria
                                          ? "bg-green-100 text-green-800 text-xs"
                                          : "bg-amber-50 text-xs"
                                      }
                                    >
                                      {tarefa.condicao}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge>{tarefa.duracao}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-[20px] w-0.5 bg-slate-200"></div>
              <div className="space-y-8 relative">
                {Object.entries(tarefasPorFase)
                  .filter(([fase, tarefas]: [string, any]) => {
                    const tarefasDaFase = tarefas.filter((t: any) => tarefasFiltradas.some((tf: any) => tf.id === t.id))
                    return tarefasDaFase.length > 0
                  })
                  .map(([fase, tarefas]: [string, any], index: number) => {
                    const tarefasDaFase = tarefas.filter((t: any) => tarefasFiltradas.some((tf: any) => tf.id === t.id))
                    const tarefasObrigatoriasNaFase = tarefasDaFase.filter((t: any) => t.obrigatoria)

                    return (
                      <div key={fase} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center z-10">
                          {index + 1}
                        </div>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-center">
                              <span>{fase}</span>
                              {tarefasObrigatoriasNaFase.length > 0 && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {tarefasObrigatoriasNaFase.length} obrigatórias
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              Duração: {formatarDuracao(calcularDuracaoTotal(tarefasDaFase))} |{tarefasDaFase.length}{" "}
                              {tarefasDaFase.length === 1 ? "tarefa" : "tarefas"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {tarefasDaFase.map((tarefa: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-2 border-b last:border-b-0 flex justify-between items-center ${
                                    tarefa.obrigatoria ? "bg-green-50/50" : ""
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {tarefa.numero && (
                                        <Badge
                                          variant="outline"
                                          className="bg-slate-100 text-slate-700 font-mono text-xs"
                                        >
                                          #{tarefa.numero}
                                        </Badge>
                                      )}
                                      <p className="font-medium">{tarefa.tarefa}</p>
                                      {tarefa.obrigatoria && <CheckCircle className="w-4 h-4 text-green-600" />}
                                    </div>
                                    {tarefa.condicao && (
                                      <p
                                        className={`text-xs ${tarefa.obrigatoria ? "text-green-600" : "text-slate-500"}`}
                                      >
                                        Condição: {tarefa.condicao}
                                      </p>
                                    )}
                                  </div>
                                  <Badge>{tarefa.duracao}</Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
              </div>
            </div>
          </TabsContent>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="text-sm text-slate-500">
            {tarefasFiltradas.length} de {tarefas.length} {tarefasFiltradas.length === 1 ? "tarefa" : "tarefas"}
            {tarefasFiltradas.length !== tarefas.length && " (filtradas)"}
          </div>
          <div className="text-sm font-medium">
            Duração total: {formatarDuracao(calcularDuracaoTotal(tarefasFiltradas))}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
