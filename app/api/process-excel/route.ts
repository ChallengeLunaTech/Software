import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Verificar se é um arquivo Excel
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json({ error: "Arquivo deve ser .xlsx ou .xls" }, { status: 400 })
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Importar XLSX dinamicamente
    const XLSX = await import("xlsx")

    // Ler arquivo Excel
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]

    if (!sheetName) {
      return NextResponse.json({ error: "Planilha não encontrada no arquivo" }, { status: 400 })
    }

    const worksheet = workbook.Sheets[sheetName]

    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: "Nenhum dado encontrado na planilha" }, { status: 400 })
    }

    // Processar dados e gerar cronograma COMPLETO
    const cronogramaCompleto = gerarCronogramaCompleto(jsonData)

    return NextResponse.json({
      success: true,
      data: jsonData,
      cronograma: cronogramaCompleto,
    })
  } catch (error) {
    console.error("Erro ao processar Excel:", error)
    return NextResponse.json(
      {
        error: `Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      },
      { status: 500 },
    )
  }
}

function gerarCronogramaCompleto(data: any[]) {
  try {
    console.log("📋 Iniciando processamento completo de todas as tarefas...")

    // 1. ANÁLISE AUTOMÁTICA DOS DADOS
    const analise = analisarDadosAutomaticamente(data)
    console.log("📊 Análise dos dados:", analise)

    // 2. PROCESSAR TODAS AS TAREFAS (sem exclusões)
    const todasTarefasProcessadas = processarTodasTarefas(data, analise)
    console.log("✅ Todas as tarefas processadas:", todasTarefasProcessadas.length)

    // 3. GERAR ESTATÍSTICAS COMPLETAS
    const estatisticas = calcularEstatisticasCompletas(todasTarefasProcessadas, analise)

    return {
      tarefas: todasTarefasProcessadas,
      analiseOriginal: analise,
      estatisticas,
      processamento: {
        totalOriginal: data.length,
        totalProcessado: todasTarefasProcessadas.length,
        tarefasComNumero: todasTarefasProcessadas.filter((t) => t.numero).length,
        tarefasSemNumero: todasTarefasProcessadas.filter((t) => !t.numero).length,
        criterio: "Inclusão completa de todas as tarefas do Excel",
      },
    }
  } catch (error) {
    console.error("Erro ao gerar cronograma completo:", error)
    throw new Error("Erro ao processar dados da planilha")
  }
}

function analisarDadosAutomaticamente(data: any[]) {
  // Identificar colunas automaticamente
  const primeiraLinha = data[0] || {}
  const colunas = Object.keys(primeiraLinha)

  // Mapear colunas comuns
  const mapeamento = {
    tarefa: encontrarColuna(colunas, [
      "tarefa",
      "atividade",
      "task",
      "nome",
      "titulo",
      "título",
      "ação",
      "acao",
      "nome_da_tarefa",
      "nome da tarefa",
    ]),
    fase: encontrarColuna(colunas, ["fase", "etapa", "stage", "phase"]),
    categoria: encontrarColuna(colunas, ["categoria", "category", "tipo", "type"]),
    condicao: encontrarColuna(colunas, ["condicao", "condição", "condition", "criterio", "critério"]),
    duracao: encontrarColuna(colunas, ["duracao", "duração", "duration", "tempo", "prazo"]),
    numero: encontrarColuna(colunas, ["numero", "número", "number", "id", "seq", "item"]),
    classificacao: encontrarColuna(colunas, ["classificacao", "classificação", "class", "priority", "prioridade"]),
  }

  // Identificar padrões nos dados
  const fases = [...new Set(data.map((item) => item[mapeamento.fase]).filter(Boolean))].sort()
  const categorias = [...new Set(data.map((item) => item[mapeamento.categoria]).filter(Boolean))].sort()
  const condicoes = [...new Set(data.map((item) => item[mapeamento.condicao]).filter(Boolean))].sort()

  // Identificar tarefas obrigatórias automaticamente
  const tarefasObrigatorias = data.filter((item) => {
    const condicao = (item[mapeamento.condicao] || "").toLowerCase()
    return ["sempre", "obrigatório", "obrigatorio", "required", "mandatory", "essencial"].includes(condicao)
  })

  // Detectar segmento/projeto automaticamente
  const segmento = detectarSegmento(data, mapeamento)

  // Analisar numeração
  const numerosEncontrados = data.map((item) => item[mapeamento.numero]).filter(Boolean)
  const temNumeracao = numerosEncontrados.length > 0
  const numeroMinimo = temNumeracao ? Math.min(...numerosEncontrados.map((n) => Number.parseInt(String(n)) || 0)) : 0
  const numeroMaximo = temNumeracao ? Math.max(...numerosEncontrados.map((n) => Number.parseInt(String(n)) || 0)) : 0

  return {
    mapeamento,
    fases,
    categorias,
    condicoes,
    tarefasObrigatorias: tarefasObrigatorias.length,
    totalTarefas: data.length,
    segmento,
    numeracao: {
      temNumeracao,
      numeroMinimo,
      numeroMaximo,
      totalComNumero: numerosEncontrados.length,
      totalSemNumero: data.length - numerosEncontrados.length,
    },
    estruturaDetectada: {
      temFases: fases.length > 0,
      temCategorias: categorias.length > 0,
      temCondicoes: condicoes.length > 0,
      temDuracao: mapeamento.duracao !== null,
      temNumeracao: temNumeracao,
    },
  }
}

function processarTodasTarefas(data: any[], analise: any) {
  const { mapeamento } = analise

  // Processar TODAS as tarefas sem exclusões
  const todasTarefas = data
    .map((item, index) => {
      const condicao = item[mapeamento.condicao] || ""
      const isObrigatoria = ["sempre", "obrigatório", "obrigatorio", "required", "mandatory", "essencial"].includes(
        condicao.toLowerCase(),
      )

      // Extrair número da tarefa
      let numeroTarefa = item[mapeamento.numero]
      if (numeroTarefa) {
        // Tentar converter para número
        const numeroConvertido = Number.parseInt(String(numeroTarefa))
        numeroTarefa = isNaN(numeroConvertido) ? numeroTarefa : numeroConvertido
      }

      return {
        id: index + 1,
        tarefa: item[mapeamento.tarefa] || `Tarefa ${index + 1}`,
        fase: item[mapeamento.fase] || "Sem fase",
        categoria: item[mapeamento.categoria] || "Geral",
        classificacao: item[mapeamento.classificacao] || "",
        condicao: condicao,
        numero: numeroTarefa || null,
        duracao: item[mapeamento.duracao] || "1 dia",
        status: "Pendente",
        obrigatoria: isObrigatoria,
        prioridade: isObrigatoria ? 1 : 2,
        // Dados originais para referência
        dadosOriginais: item,
      }
    })
    .filter((tarefa) => {
      // Filtrar apenas linhas completamente vazias
      const temConteudo = tarefa.tarefa && tarefa.tarefa.trim().length > 0 && tarefa.tarefa !== `Tarefa ${tarefa.id}`
      return temConteudo
    })

  // Ordenar por número (se disponível), depois por ordem original
  todasTarefas.sort((a, b) => {
    // Se ambos têm número, ordenar por número
    if (a.numero !== null && b.numero !== null) {
      const numA = typeof a.numero === "number" ? a.numero : Number.parseInt(String(a.numero)) || 0
      const numB = typeof b.numero === "number" ? b.numero : Number.parseInt(String(b.numero)) || 0
      return numA - numB
    }

    // Se apenas um tem número, colocar o com número primeiro
    if (a.numero !== null && b.numero === null) return -1
    if (a.numero === null && b.numero !== null) return 1

    // Se nenhum tem número, manter ordem original
    return a.id - b.id
  })

  return todasTarefas
}

function detectarSegmento(data: any[], mapeamento: any) {
  // Tentar detectar o segmento/tipo de projeto baseado nas tarefas
  const tarefas = data.map((item) => (item[mapeamento.tarefa] || "").toLowerCase()).join(" ")

  if (tarefas.includes("desenvolvimento") || tarefas.includes("software") || tarefas.includes("sistema")) {
    return "Desenvolvimento de Software"
  }
  if (tarefas.includes("marketing") || tarefas.includes("campanha") || tarefas.includes("publicidade")) {
    return "Marketing"
  }
  if (tarefas.includes("construção") || tarefas.includes("obra") || tarefas.includes("engenharia")) {
    return "Construção/Engenharia"
  }
  if (tarefas.includes("evento") || tarefas.includes("festa") || tarefas.includes("cerimônia")) {
    return "Eventos"
  }
  if (tarefas.includes("produto") || tarefas.includes("lançamento") || tarefas.includes("produção")) {
    return "Desenvolvimento de Produto"
  }

  return "Projeto Geral"
}

function calcularEstatisticasCompletas(tarefas: any[], analise: any) {
  const faseStats = tarefas.reduce((acc: any, tarefa) => {
    const fase = tarefa.fase
    if (!acc[fase]) {
      acc[fase] = { total: 0, obrigatorias: 0, duracao: 0, comNumero: 0, semNumero: 0 }
    }
    acc[fase].total++
    if (tarefa.obrigatoria) acc[fase].obrigatorias++
    if (tarefa.numero !== null) acc[fase].comNumero++
    else acc[fase].semNumero++
    acc[fase].duracao += parseDuracao(tarefa.duracao)
    return acc
  }, {})

  const duracaoTotal = Object.values(faseStats).reduce((total: number, fase: any) => total + fase.duracao, 0)

  // Estatísticas de numeração
  const tarefasComNumero = tarefas.filter((t) => t.numero !== null)
  const tarefasSemNumero = tarefas.filter((t) => t.numero === null)
  const numerosUnicos = [...new Set(tarefasComNumero.map((t) => t.numero))].sort((a, b) => {
    const numA = typeof a === "number" ? a : Number.parseInt(String(a)) || 0
    const numB = typeof b === "number" ? b : Number.parseInt(String(b)) || 0
    return numA - numB
  })

  return {
    totalTarefas: tarefas.length,
    tarefasObrigatorias: tarefas.filter((t) => t.obrigatoria).length,
    tarefasOpcionais: tarefas.filter((t) => !t.obrigatoria).length,
    fases: Object.keys(faseStats).length,
    duracaoTotal,
    duracaoFormatada: formatarDuracao(duracaoTotal),
    faseStats,
    dataEstimadaConclusao: new Date(Date.now() + duracaoTotal * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
    numeracao: {
      comNumero: tarefasComNumero.length,
      semNumero: tarefasSemNumero.length,
      numerosUnicos: numerosUnicos.length,
      numeroMinimo: numerosUnicos.length > 0 ? numerosUnicos[0] : null,
      numeroMaximo: numerosUnicos.length > 0 ? numerosUnicos[numerosUnicos.length - 1] : null,
      numerosEncontrados: numerosUnicos,
    },
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
