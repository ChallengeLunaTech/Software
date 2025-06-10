"use client"

import { useState } from "react"
import { Search, Filter, X, Hash, Tag, Calendar, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BuscaAvancadaProps {
  tarefas: any[]
  onFiltroChange: (filtros: any) => void
  filtrosAtivos: any
}

export default function BuscaAvancada({ tarefas, onFiltroChange, filtrosAtivos }: BuscaAvancadaProps) {
  const [buscaGeral, setBuscaGeral] = useState("")
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false)

  // Extrair opções únicas dos dados
  const fases = [...new Set(tarefas.map((t) => t.fase))].filter(Boolean).sort()
  const categorias = [...new Set(tarefas.map((t) => t.categoria))].filter(Boolean).sort()
  const condicoes = [...new Set(tarefas.map((t) => t.condicao))].filter(Boolean).sort()
  const numeros = [...new Set(tarefas.map((t) => t.numero))].filter(Boolean).sort((a, b) => {
    const numA = typeof a === "number" ? a : Number.parseInt(String(a)) || 0
    const numB = typeof b === "number" ? b : Number.parseInt(String(b)) || 0
    return numA - numB
  })

  const handleBuscaGeral = (valor: string) => {
    setBuscaGeral(valor)
    onFiltroChange({
      ...filtrosAtivos,
      buscaTexto: valor,
    })
  }

  const handleFiltroEspecifico = (campo: string, valor: string) => {
    onFiltroChange({
      ...filtrosAtivos,
      [campo]: valor,
    })
  }

  const limparTodosFiltros = () => {
    setBuscaGeral("")
    onFiltroChange({
      buscaTexto: "",
      buscaNumero: "",
      filtroFase: "todas",
      filtroCategoria: "todas",
      filtroStatus: "todos",
      filtroCondicao: "todas",
    })
  }

  const contarFiltrosAtivos = () => {
    let count = 0
    if (filtrosAtivos.buscaTexto) count++
    if (filtrosAtivos.buscaNumero) count++
    if (filtrosAtivos.filtroFase !== "todas") count++
    if (filtrosAtivos.filtroCategoria !== "todas") count++
    if (filtrosAtivos.filtroStatus !== "todos") count++
    if (filtrosAtivos.filtroCondicao !== "todas") count++
    return count
  }

  const filtrosAtivosCount = contarFiltrosAtivos()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Busca e Filtros Avançados
            {filtrosAtivosCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filtrosAtivosCount} ativo{filtrosAtivosCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {filtrosExpandidos ? "Ocultar" : "Mostrar"} Filtros
            </Button>
            {filtrosAtivosCount > 0 && (
              <Button variant="outline" size="sm" onClick={limparTodosFiltros} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Limpar Tudo
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Encontre tarefas específicas usando busca por texto, número ou filtros detalhados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca Geral */}
        <div className="space-y-2">
          <label className="text-sm font-medium">🔍 Busca Geral</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Digite qualquer palavra: nome da tarefa, fase, categoria, condição..."
              value={buscaGeral}
              onChange={(e) => handleBuscaGeral(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
          {buscaGeral && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Search className="w-4 h-4" />
              <span>Buscando por "{buscaGeral}" em todos os campos</span>
            </div>
          )}
        </div>

        {/* Filtros Expandidos */}
        {filtrosExpandidos && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Busca por Número */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Número da Tarefa
                </label>
                <Input
                  placeholder="Ex: 1, 10, 25..."
                  value={filtrosAtivos.buscaNumero || ""}
                  onChange={(e) => handleFiltroEspecifico("buscaNumero", e.target.value)}
                />
                {numeros.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {numeros.slice(0, 10).map((num) => (
                      <Button
                        key={num}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleFiltroEspecifico("buscaNumero", String(num))}
                      >
                        {num}
                      </Button>
                    ))}
                    {numeros.length > 10 && <span className="text-xs text-slate-500">+{numeros.length - 10} mais</span>}
                  </div>
                )}
              </div>

              {/* Filtro por Fase */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Fase
                </label>
                <Select
                  value={filtrosAtivos.filtroFase || "todas"}
                  onValueChange={(value) => handleFiltroEspecifico("filtroFase", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Fases</SelectItem>
                    {fases.map((fase) => (
                      <SelectItem key={fase} value={fase}>
                        {fase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoria
                </label>
                <Select
                  value={filtrosAtivos.filtroCategoria || "todas"}
                  onValueChange={(value) => handleFiltroEspecifico("filtroCategoria", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Categorias</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Condição */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Condição
                </label>
                <Select
                  value={filtrosAtivos.filtroCondicao || "todas"}
                  onValueChange={(value) => handleFiltroEspecifico("filtroCondicao", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Condições</SelectItem>
                    {condicoes.map((condicao) => (
                      <SelectItem key={condicao} value={condicao}>
                        {condicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filtrosAtivos.filtroStatus || "todos"}
                  onValueChange={(value) => handleFiltroEspecifico("filtroStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros Ativos */}
            {filtrosAtivosCount > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Filtros Ativos:</h4>
                <div className="flex flex-wrap gap-2">
                  {filtrosAtivos.buscaTexto && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Texto: "{filtrosAtivos.buscaTexto}"
                      <X className="w-3 h-3 cursor-pointer" onClick={() => handleFiltroEspecifico("buscaTexto", "")} />
                    </Badge>
                  )}
                  {filtrosAtivos.buscaNumero && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Número: {filtrosAtivos.buscaNumero}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => handleFiltroEspecifico("buscaNumero", "")} />
                    </Badge>
                  )}
                  {filtrosAtivos.filtroFase !== "todas" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Fase: {filtrosAtivos.filtroFase}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleFiltroEspecifico("filtroFase", "todas")}
                      />
                    </Badge>
                  )}
                  {filtrosAtivos.filtroCategoria !== "todas" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Categoria: {filtrosAtivos.filtroCategoria}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleFiltroEspecifico("filtroCategoria", "todas")}
                      />
                    </Badge>
                  )}
                  {filtrosAtivos.filtroCondicao !== "todas" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Condição: {filtrosAtivos.filtroCondicao}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleFiltroEspecifico("filtroCondicao", "todas")}
                      />
                    </Badge>
                  )}
                  {filtrosAtivos.filtroStatus !== "todos" && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Status: {filtrosAtivos.filtroStatus}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleFiltroEspecifico("filtroStatus", "todos")}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
