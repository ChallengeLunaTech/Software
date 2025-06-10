"use client"
import { useChat } from "ai/react"
import { Send, Bot, User, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ChatBotProps {
  excelData: any
  cronograma: any
}

export default function ChatBot({ excelData, cronograma }: ChatBotProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      excelData,
      cronograma,
    },
    onError: (error) => {
      console.error("Erro no chat:", error)
    },
  })

  const suggestedQuestions = [
    "Qual é o status geral do projeto?",
    "Quais tarefas estão atrasadas?",
    "Quem são os responsáveis principais?",
    "Qual a previsão de conclusão?",
    "Como posso otimizar o cronograma?",
  ]

  return (
    <div className="space-y-4">
      {/* Mostrar erro se houver */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message.includes("API key")
              ? "⚠️ Para usar o ChatBot, você precisa configurar sua chave da OpenAI. Crie um arquivo .env.local na raiz do projeto e adicione: OPENAI_API_KEY=sua_chave_aqui"
              : `Erro: ${error.message}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Área de mensagens */}
      <Card className="h-96">
        <CardContent className="p-0">
          <ScrollArea className="h-full p-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 mt-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="mb-4">Olá! Sou seu assistente para análise de projetos.</p>
                <p className="text-sm">Faça perguntas sobre seu cronograma, tarefas ou dados do Excel.</p>
                {!process.env.OPENAI_API_KEY && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      💡 Para ativar o ChatBot, configure sua chave da OpenAI no arquivo .env.local
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className="flex-shrink-0">
                        {message.role === "user" ? (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Perguntas sugeridas */}
      {messages.length === 0 && !error && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Perguntas sugeridas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleInputChange({ target: { value: question } } as any)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input de mensagem */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Digite sua pergunta sobre o projeto..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  )
}
