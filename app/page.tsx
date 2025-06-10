"use client"

import { useState } from "react"
import { Upload, FileSpreadsheet, Calendar, MessageCircle, Settings, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ExcelUploader from "@/components/excel-uploader"
import CronogramaView from "@/components/cronograma-view"
import ChatBot from "@/components/chat-bot"
import ConfiguracaoProjeto from "@/components/configuracao-projeto"
import CronogramaCondicional from "@/components/cronograma-condicional"

export default function HomePage() {
  const [excelData, setExcelData] = useState(null)
  const [cronograma, setCronograma] = useState(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [etapaAtual, setEtapaAtual] = useState("upload") // "upload", "configuracao", "condicional", "cronograma", "chat"
  const [configuracaoProjeto, setConfiguracaoProjeto] = useState(null)
  const [cronogramaCondicional, setCronogramaCondicional] = useState(null)

  const handleExcelProcessed = (data: any, generatedCronograma: any) => {
    setExcelData(data)
    setCronograma(generatedCronograma)
    setEtapaAtual("configuracao")
  }

  const handleConfiguracaoCompleta = (config: any) => {
    setConfiguracaoProjeto(config)
    setEtapaAtual("condicional")
  }

  const handleVoltarConfiguracao = () => {
    setEtapaAtual("configuracao")
  }

  const handleGerarCompleto = (cronogramaCondicional: any) => {
    setCronogramaCondicional(cronogramaCondicional)
    setEtapaAtual("cronograma")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">LunaTech</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Faça upload do seu arquivo Excel
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Excel
            </TabsTrigger>
            <TabsTrigger value="configuracao" className="flex items-center gap-2" disabled={!excelData}>
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="condicional" className="flex items-center gap-2" disabled={!configuracaoProjeto}>
              <Target className="w-4 h-4" />
              Cronograma Condicional
            </TabsTrigger>
            <TabsTrigger value="cronograma" className="flex items-center gap-2" disabled={!cronograma}>
              <Calendar className="w-4 h-4" />
              Cronograma Completo
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              ChatBot Assistente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Upload do Arquivo Excel
                </CardTitle>
                <CardDescription>
                  Faça upload do seu arquivo Excel aqui embaixo!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExcelUploader onDataProcessed={handleExcelProcessed} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracao" className="space-y-6">
            {excelData ? (
              <ConfiguracaoProjeto excelData={excelData} onConfiguracaoCompleta={handleConfiguracaoCompleta} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-slate-500">Faça upload de um arquivo Excel primeiro</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="condicional" className="space-y-6">
            {configuracaoProjeto && excelData ? (
              <CronogramaCondicional
                excelData={excelData}
                configuracao={configuracaoProjeto}
                onVoltarConfiguracao={handleVoltarConfiguracao}
                onGerarCompleto={handleGerarCompleto}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-slate-500">Configure o projeto primeiro</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cronograma" className="space-y-6">
            {cronograma ? (
              <CronogramaView cronograma={cronograma} excelData={excelData} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-slate-500">Faça upload de um arquivo Excel primeiro</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  ChatBot Assistente
                </CardTitle>
                <CardDescription>
                  Use o chatbot para ajustar o cronograma, fazer perguntas sobre as tarefas e otimizar seu projeto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatBot excelData={excelData} cronograma={cronograma} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
