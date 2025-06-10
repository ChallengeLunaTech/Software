"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Target, Layers, ArrowRight, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectSetupProps {
  excelData: any
  cronograma: any
  onSetupComplete: (config: ProjectConfig) => void
}

export interface ProjectConfig {
  objetivo: string
  segmento: string
  categoria: string
  fases: {
    [key: string]: {
      selecionada: boolean
      condicoes: string[]
    }
  }
}

export default function ProjectSetup({ excelData, cronograma, onSetupComplete }: ProjectSetupProps) {
  // Extrair categorias, fases e condições únicas dos dados
  const categorias = [...new Set((excelData || []).map((item: any) => item.Categoria || item.categoria))]
    .filter(Boolean)
    .sort()

  const fases = [...new Set((excelData || []).map((item: any) => item.Fase || item.fase))].filter(Boolean).sort()

  const segmentos = [...new Set((excelData || []).map((item: any) => item.Segmento || item.segmento))]
    .filter(Boolean)
    .sort()

  // Identificar tarefas que sempre devem aparecer
  const tarefasSempre = (excelData || []).filter((item: any) => {
    const condicao = (item.Condicao || item.condicao || "").toLowerCase()
    return condicao === "sempre" || condicao === "obrigatório" || condicao === "obrigatorio" || condicao === "required"
  })

  // Estado para armazenar a configuração do projeto
  const [config, setConfig] = useState<ProjectConfig>({
    objetivo: "",
    segmento: segmentos[0] || "",
    categoria: categorias[0] || "",
    fases: Object.fromEntries(
      fases.map((fase) => [
        fase,
        {
          selecionada: true,
          condicoes: [],
        },
      ]),
    ),
  })

  // Função para obter condições disponíveis para uma fase específica
  const getCondicoesPorFase = (fase: string) => {
    const condicoes = [
      ...new Set(
        (excelData || [])
          .filter((item: any) => (item.Fase || item.fase) === fase)
          .map((item: any) => item.Condicao || item.condicao),
      ),
    ]
      .filter(Boolean)
      .sort()

    // Separar condições "sempre" das outras
    const condicoesSempre = condicoes.filter((c) =>
      ["sempre", "obrigatório", "obrigatorio", "required"].includes(c.toLowerCase()),
    )
    const condicoesOpcionais = condicoes.filter(
      (c) => !["sempre", "obrigatório", "obrigatorio", "required"].includes(c.toLowerCase()),
    )

    return { condicoesSempre, condicoesOpcionais, todas: condicoes }
  }

  // Função para contar tarefas por condição
  const contarTarefasPorCondicao = (fase: string, condicao: string) => {
    return (excelData || []).filter(
      (item: any) => (item.Fase || item.fase) === fase && (item.Condicao || item.condicao) === condicao,
    ).length
  }

  // Manipuladores de eventos
  const handleFaseChange = (fase: string, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      fases: {
        ...prev.fases,
        [fase]: {
          ...prev.fases[fase],
          selecionada: checked,
        },
      },
    }))
  }

  const handleCondicaoChange = (fase: string, condicao: string, checked: boolean) => {
    setConfig((prev) => {
      const condicoes = prev.fases[fase].condicoes || []
      const novasCondicoes = checked ? [...condicoes, condicao] : condicoes.filter((c) => c !== condicao)

      return {
        ...prev,
        fases: {
          ...prev.fases,
          [fase]: {
            ...prev.fases[fase],
            condicoes: novasCondicoes,
          },
        },
      }
    })
  }

  // Auto-selecionar condições "sempre" quando uma fase é selecionada
  useEffect(() => {
    setConfig((prev) => {
      const novaConfig = { ...prev }

      Object.keys(novaConfig.fases).forEach((fase) => {
        if (novaConfig.fases[fase].selecionada) {
          const { condicoesSempre } = getCondicoesPorFase(fase)
          const condicoesAtuais = novaConfig.fases[fase].condicoes || []

          // Adicionar condições "sempre" se não estiverem já incluídas
          condicoesSempre.forEach((condicao) => {
            if (!condicoesAtuais.includes(condicao)) {
              condicoesAtuais.push(condicao)
            }
          })

          novaConfig.fases[fase].condicoes = condicoesAtuais
        }
      })

      return novaConfig
    })
  }, [excelData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSetupComplete(config)
  }

  const isCondicaoObrigatoria = (condicao: string) => {
    return ["sempre", "obrigatório", "obrigatorio", "required"].includes(condicao.toLowerCase())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Configuração do Projeto
          </CardTitle>
          <CardDescription>
            Defina o objetivo, segmento e categoria do projeto para gerar um cronograma otimizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="objetivo">Objetivo do Projeto</Label>
              <Input
                id="objetivo"
                placeholder="Ex: Lançamento de novo produto"
                value={config.objetivo}
                onChange={(e) => setConfig((prev) => ({ ...prev, objetivo: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmento">Segmento</Label>
              <Select
                value={config.segmento}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, segmento: value }))}
              >
                <SelectTrigger id="segmento">
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {segmentos.length > 0 ? (
                    segmentos.map((segmento) => (
                      <SelectItem key={segmento} value={segmento}>
                        {segmento}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default">Segmento não especificado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={config.categoria}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.length > 0 ? (
                    categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default">Categoria não especificada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre tarefas obrigatórias */}
      {tarefasSempre.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{tarefasSempre.length} tarefas obrigatórias</strong> foram identificadas e serão incluídas
            automaticamente no cronograma (condição "Sempre").
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Fases do Projeto
          </CardTitle>
          <CardDescription>
            Selecione as fases que deseja incluir no cronograma e suas condições. Tarefas marcadas como "Sempre" são
            obrigatórias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {fases.length > 0 ? (
              fases.map((fase) => {
                const { condicoesSempre, condicoesOpcionais } = getCondicoesPorFase(fase)
                const todasCondicoes = [...condicoesSempre, ...condicoesOpcionais]

                return (
                  <div key={fase} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id={`fase-${fase}`}
                        checked={config.fases[fase]?.selecionada}
                        onCheckedChange={(checked) => handleFaseChange(fase, checked === true)}
                      />
                      <Label htmlFor={`fase-${fase}`} className="text-lg font-medium">
                        {fase}
                      </Label>
                      {condicoesSempre.length > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {condicoesSempre.length} obrigatória{condicoesSempre.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {todasCondicoes.length > 0 && (
                      <div className="ml-6 border-l-2 pl-4 space-y-4">
                        {/* Condições Obrigatórias */}
                        {condicoesSempre.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Tarefas Obrigatórias (incluídas automaticamente):
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {condicoesSempre.map((condicao) => (
                                <div
                                  key={`${fase}-${condicao}`}
                                  className="flex items-center space-x-2 bg-green-50 p-2 rounded"
                                >
                                  <Checkbox id={`condicao-${fase}-${condicao}`} checked={true} disabled={true} />
                                  <Label
                                    htmlFor={`condicao-${fase}-${condicao}`}
                                    className="text-green-800 font-medium"
                                  >
                                    {condicao}
                                  </Label>
                                  <span className="text-xs text-green-600 ml-auto">
                                    ({contarTarefasPorCondicao(fase, condicao)} tarefas)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Condições Opcionais */}
                        {condicoesOpcionais.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-500 mb-2">Condições opcionais:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {condicoesOpcionais.map((condicao) => (
                                <div key={`${fase}-${condicao}`} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`condicao-${fase}-${condicao}`}
                                    checked={config.fases[fase]?.condicoes.includes(condicao)}
                                    onCheckedChange={(checked) =>
                                      handleCondicaoChange(fase, condicao, checked === true)
                                    }
                                    disabled={!config.fases[fase]?.selecionada}
                                  />
                                  <Label
                                    htmlFor={`condicao-${fase}-${condicao}`}
                                    className={!config.fases[fase]?.selecionada ? "text-slate-400" : ""}
                                  >
                                    {condicao}
                                  </Label>
                                  <span className="text-xs text-slate-500 ml-auto">
                                    ({contarTarefasPorCondicao(fase, condicao)} tarefas)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-slate-500 text-center py-4">
                Nenhuma fase encontrada nos dados. Verifique o formato do arquivo Excel.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="flex items-center gap-2">
          Gerar Cronograma Otimizado <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
