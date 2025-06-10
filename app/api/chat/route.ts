import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sua_chave_openai_aqui") {
      return new Response(
        JSON.stringify({
          error: "API Key da OpenAI não configurada. Por favor, configure OPENAI_API_KEY no arquivo .env.local",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { messages, excelData, cronograma } = await req.json()

    // Preparar contexto com dados do projeto
    const contexto = prepararContexto(excelData, cronograma)

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: `Você é um assistente especializado em análise de projetos e cronogramas. 
      
      Você tem acesso aos seguintes dados do projeto do usuário:
      ${contexto}
      
      Suas responsabilidades:
      - Responder perguntas sobre o cronograma e tarefas
      - Fornecer insights sobre o progresso do projeto
      - Sugerir melhorias e otimizações
      - Identificar riscos e problemas potenciais
      - Ajudar com análise de dados do Excel
      
      Seja sempre útil, preciso e forneça respostas práticas. Use os dados fornecidos para dar respostas específicas e relevantes.
      Responda sempre em português brasileiro.`,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Erro no chat:", error)

    // Verificar se é erro de API key
    if (error instanceof Error && error.message.includes("API key")) {
      return new Response(
        JSON.stringify({
          error:
            "Chave da API OpenAI inválida. Verifique se você configurou corretamente a OPENAI_API_KEY no arquivo .env.local",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor. Verifique os logs para mais detalhes.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

function prepararContexto(excelData: any, cronograma: any) {
  if (!cronograma) {
    return "Nenhum cronograma foi carregado ainda. Peça ao usuário para fazer upload de um arquivo Excel primeiro."
  }

  const { tarefas, resumo } = cronograma

  let contexto = `
RESUMO DO PROJETO:
- Total de tarefas: ${resumo?.total || 0}
- Tarefas concluídas: ${resumo?.concluidas || 0}
- Tarefas pendentes: ${resumo?.pendentes || 0}
- Tarefas atrasadas: ${resumo?.atrasadas || 0}
- Responsáveis: ${resumo?.responsaveis?.join(", ") || "Não informado"}

TAREFAS DETALHADAS:
`

  if (tarefas && tarefas.length > 0) {
    tarefas.slice(0, 20).forEach((tarefa: any, index: number) => {
      contexto += `
${index + 1}. ${tarefa.tarefa || "Sem título"}
   - Status: ${tarefa.status || "Não informado"}
   - Responsável: ${tarefa.responsavel || "Não informado"}
   - Data início: ${tarefa.data_inicio || "Não informado"}
   - Data fim: ${tarefa.data_fim || "Não informado"}
   - Prioridade: ${tarefa.prioridade || "Não informado"}
   ${tarefa.descricao ? `- Descrição: ${tarefa.descricao}` : ""}
`
    })

    if (tarefas.length > 20) {
      contexto += `\n... e mais ${tarefas.length - 20} tarefas.`
    }
  }

  return contexto
}
