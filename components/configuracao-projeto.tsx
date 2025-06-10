"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Target, Layers, ArrowRight, CheckCircle, Settings, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConfiguracaoProjetoProps {
  excelData: any[]
  onConfiguracaoCompleta: (config: ConfiguracaoProjeto) => void
}

export interface ConfiguracaoProjeto {
  objetivo: string
  segmento: string
  categoria: string
  descricao: string
  prazoDesejado: string
  fasesSelecionadas: {
    [fase: string]: {
      ativa: boolean
      condicoesSelecionadas: string[]
      justificativa: string
    }
  }
  criteriosDecisao: {
    incluirSempre: boolean
    incluirObrigatorias: boolean
    criteriosCustomizados: string[]
  }
}

export default function ConfiguracaoProjeto({ excelData, onConfiguracaoCompleta }: ConfiguracaoProjetoProps) {
  // Análise dos dados para extrair informações
  const analise = analisarDados(excelData)

  const [config, setConfig] = useState<ConfiguracaoProjeto>({
    objetivo: "",
    segmento: analise.segmentos[0] || "",
    categoria: analise.categorias[0] || "",
    descricao: "",
    prazoDesejado: "",
    fasesSelecionadas: Object.fromEntries(
      analise.fases.map((fase) => [
        fase,
        {
          ativa: true,
          condicoesSelecionadas: [],
          justificativa: "",
        },
      ]),
    ),
    criteriosDecisao: {
      incluirSempre: true,
      incluirObrigatorias: true,
      criteriosCustomizados: [],
    },
  })

  const [etapaAtual, setEtapaAtual] = useState(1)

  function analisarDados(data: any[]) {
    if (!data || data.length === 0)
      return { fases: [], categorias: [], segmentos: [], condicoes: [], classificacoes: [] }

    const primeiraLinha = data[0] || {}
    const colunas = Object.keys(primeiraLinha)

    const mapeamento = {
      fase: encontrarColuna(colunas, ["fase", "etapa", "stage", "phase"]),
      categoria: encontrarColuna(colunas, ["categoria", "category", "tipo", "type"]),
      condicao: encontrarColuna(colunas, ["condicao", "condição", "condition", "criterio", "critério"]),
      classificacao: encontrarColuna(colunas, ["classificacao", "classificação", "class", "priority"]),
      segmento: encontrarColuna(colunas, ["segmento", "segment", "area", "área"]),
    }

    return {
      fases: [...new Set(data.map((item) => item[mapeamento.fase]).filter(Boolean))].sort(),
      categorias: [...new Set(data.map((item) => item[mapeamento.categoria]).filter(Boolean))].sort(),
      condicoes: [...new Set(data.map((item) => item[mapeamento.condicao]).filter(Boolean))].sort(),
      classificacoes: [...new Set(data.map((item) => item[mapeamento.classificacao]).filter(Boolean))].sort(),
      segmentos: [...new Set(data.map((item) => item[mapeamento.segmento]).filter(Boolean))].sort(),
      mapeamento,
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

  function contarTarefasPorCondicao(fase: string, condicao: string) {
    return excelData.filter(
      (item) => item[analise.mapeamento.fase] === fase && item[analise.mapeamento.condicao] === condicao,
    ).length
  }

  function obterCondicoesPorFase(fase: string) {
    return [
      ...new Set(
        excelData
          .filter((item) => item[analise.mapeamento.fase] === fase)
          .map((item) => item[analise.mapeamento.condicao])
          .filter(Boolean),
      ),
    ].sort()
  }

  const handleFaseChange = (fase: string, ativa: boolean) => {
    setConfig((prev) => ({
      ...prev,
      fasesSelecionadas: {
        ...prev.fasesSelecionadas,
        [fase]: {
          ...prev.fasesSelecionadas[fase],
          ativa,
        },
      },
    }))
  }

  const handleCondicaoChange = (fase: string, condicao: string, selecionada: boolean) => {
    setConfig((prev) => {
      const condicoes = prev.fasesSelecionadas[fase].condicoesSelecionadas
      const novasCondicoes = selecionada ? [...condicoes, condicao] : condicoes.filter((c) => c !== condicao)

      return {
        ...prev,
        fasesSelecionadas: {
          ...prev.fasesSelecionadas,
          [fase]: {
            ...prev.fasesSelecionadas[fase],
            condicoesSelecionadas: novasCondicoes,
          },
        },
      }
    })
  }

  const handleJustificativaChange = (fase: string, justificativa: string) => {
    setConfig((prev) => ({
      ...prev,
      fasesSelecionadas: {
        ...prev.fasesSelecionadas,
        [fase]: {
          ...prev.fasesSelecionadas[fase],
          justificativa,
        },
      },
    }))
  }

  const calcularResumoSelecao = () => {
    const fasesAtivas = Object.values(config.fasesSelecionadas).filter((f) => f.ativa).length
    const totalCondicoes = Object.values(config.fasesSelecionadas).reduce(
      (total, fase) => total + fase.condicoesSelecionadas.length,
      0,
    )

    return { fasesAtivas, totalCondicoes }
  }

  const handleSubmit = () => {
    onConfiguracaoCompleta(config)
  }

  const resumo = calcularResumoSelecao()

  return (
    <div className="space-y-6">
      {/* Progresso */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${etapaAtual >= 1 ? "bg-blue-500 text-white" : "bg-slate-200"}`}
              >
                1
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${etapaAtual >= 2 ? "bg-blue-500 text-white" : "bg-slate-200"}`}
              >
                2
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${etapaAtual >= 3 ? "bg-blue-500 text-white" : "bg-slate-200"}`}
              >
                3
              </div>
            </div>
            <div className="text-sm text-slate-600">Etapa {etapaAtual} de 3</div>
          </div>
        </CardContent>
      </Card>

      {/* Etapa 1: Informações do Projeto */}
      {etapaAtual === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Informações do Projeto
            </CardTitle>
            <CardDescription>Defina as características básicas do seu projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objetivo">Objetivo do Projeto *</Label>
                <Input
                  id="objetivo"
                  placeholder="Ex: Implementação de novo sistema"
                  value={config.objetivo}
                  onChange={(e) => setConfig((prev) => ({ ...prev, objetivo: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo Desejado</Label>
                <Input
                  id="prazo"
                  placeholder="Ex: 6 meses, 120 dias"
                  value={config.prazoDesejado}
                  onChange={(e) => setConfig((prev) => ({ ...prev, prazoDesejado: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento</Label>
                <Select
                  value={config.segmento}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, segmento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    {analise.segmentos.map((segmento) => (
                      <SelectItem key={segmento} value={segmento}>
                        {segmento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria Principal</Label>
                <Select
                  value={config.categoria}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {analise.categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Projeto</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva brevemente o escopo e objetivos do projeto..."
                value={config.descricao}
                onChange={(e) => setConfig((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setEtapaAtual(2)} disabled={!config.objetivo} className="flex items-center gap-2">
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 2: Seleção de Fases e Condições */}
      {etapaAtual === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Seleção de Fases e Condições
            </CardTitle>
            <CardDescription>Escolha as fases do projeto e suas condições específicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analise.fases.map((fase) => {
              const condicoesDaFase = obterCondicoesPorFase(fase)
              const condicoesObrigatorias = condicoesDaFase.filter((c) =>
                ["sempre", "obrigatório", "obrigatorio", "required"].includes(c.toLowerCase()),
              )

              return (
                <div key={fase} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id={`fase-${fase}`}
                      checked={config.fasesSelecionadas[fase]?.ativa}
                      onCheckedChange={(checked) => handleFaseChange(fase, checked === true)}
                    />
                    <Label htmlFor={`fase-${fase}`} className="text-lg font-medium">
                      {fase}
                    </Label>
                    {condicoesObrigatorias.length > 0 && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {condicoesObrigatorias.length} obrigatória{condicoesObrigatorias.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  {config.fasesSelecionadas[fase]?.ativa && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Condições disponíveis:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {condicoesDaFase.map((condicao) => {
                            const isObrigatoria = ["sempre", "obrigatório", "obrigatorio", "required"].includes(
                              condicao.toLowerCase(),
                            )
                            const count = contarTarefasPorCondicao(fase, condicao)

                            return (
                              <div
                                key={`${fase}-${condicao}`}
                                className={`flex items-center space-x-2 p-2 rounded ${isObrigatoria ? "bg-green-50" : "bg-slate-50"}`}
                              >
                                <Checkbox
                                  id={`condicao-${fase}-${condicao}`}
                                  checked={
                                    isObrigatoria ||
                                    config.fasesSelecionadas[fase]?.condicoesSelecionadas.includes(condicao)
                                  }
                                  onCheckedChange={(checked) => handleCondicaoChange(fase, condicao, checked === true)}
                                  disabled={isObrigatoria}
                                />
                                <Label
                                  htmlFor={`condicao-${fase}-${condicao}`}
                                  className={`flex-1 ${isObrigatoria ? "font-medium text-green-800" : ""}`}
                                >
                                  {condicao}
                                </Label>
                                <Badge variant="outline" className="text-xs">
                                  {count} tarefas
                                </Badge>
                                {isObrigatoria && <CheckCircle className="w-4 h-4 text-green-600" />}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`justificativa-${fase}`}>Justificativa para seleções (opcional)</Label>
                        <Textarea
                          id={`justificativa-${fase}`}
                          placeholder="Explique por que escolheu essas condições para esta fase..."
                          value={config.fasesSelecionadas[fase]?.justificativa || ""}
                          onChange={(e) => handleJustificativaChange(fase, e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setEtapaAtual(1)}>
                Voltar
              </Button>
              <Button onClick={() => setEtapaAtual(3)} className="flex items-center gap-2">
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 3: Critérios de Decisão e Resumo */}
      {etapaAtual === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Critérios de Decisão
              </CardTitle>
              <CardDescription>Configure os critérios para inclusão de tarefas no cronograma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir-sempre"
                    checked={config.criteriosDecisao.incluirSempre}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        criteriosDecisao: {
                          ...prev.criteriosDecisao,
                          incluirSempre: checked === true,
                        },
                      }))
                    }
                  />
                  <Label htmlFor="incluir-sempre">Incluir automaticamente tarefas marcadas como "Sempre"</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incluir-obrigatorias"
                    checked={config.criteriosDecisao.incluirObrigatorias}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({
                        ...prev,
                        criteriosDecisao: {
                          ...prev.criteriosDecisao,
                          incluirObrigatorias: checked === true,
                        },
                      }))
                    }
                  />
                  <Label htmlFor="incluir-obrigatorias">Incluir automaticamente tarefas obrigatórias</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resumo da Configuração
              </CardTitle>
              <CardDescription>Revise suas escolhas antes de gerar o cronograma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informações do Projeto</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Objetivo:</strong> {config.objetivo}
                    </p>
                    <p>
                      <strong>Segmento:</strong> {config.segmento}
                    </p>
                    <p>
                      <strong>Categoria:</strong> {config.categoria}
                    </p>
                    {config.prazoDesejado && (
                      <p>
                        <strong>Prazo:</strong> {config.prazoDesejado}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Seleções</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Fases ativas:</strong> {resumo.fasesAtivas} de {analise.fases.length}
                    </p>
                    <p>
                      <strong>Condições selecionadas:</strong> {resumo.totalCondicoes}
                    </p>
                    <p>
                      <strong>Incluir "Sempre":</strong> {config.criteriosDecisao.incluirSempre ? "Sim" : "Não"}
                    </p>
                    <p>
                      <strong>Incluir obrigatórias:</strong>{" "}
                      {config.criteriosDecisao.incluirObrigatorias ? "Sim" : "Não"}
                    </p>
                  </div>
                </div>
              </div>

              {config.descricao && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-sm text-slate-600">{config.descricao}</p>
                </div>
              )}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Configuração completa! O cronograma será gerado com base nas suas seleções.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setEtapaAtual(2)}>
              Voltar
            </Button>
            <Button onClick={handleSubmit} className="flex items-center gap-2">
              Gerar Cronograma Otimizado <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
