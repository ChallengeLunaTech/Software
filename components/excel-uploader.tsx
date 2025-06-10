"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExcelUploaderProps {
  onDataProcessed: (data: any, cronograma: any) => void
}

export default function ExcelUploader({ onDataProcessed }: ExcelUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Por favor, selecione um arquivo Excel (.xlsx ou .xls)")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/process-excel", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao processar arquivo")
      }

      const result = await response.json()
      setSuccess(true)
      onDataProcessed(result.data, result.cronograma)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400"}
          ${uploading ? "cursor-not-allowed opacity-50" : ""}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById("fileInput")?.click()}
      >
        <input
          id="fileInput"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : success ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : (
            <FileSpreadsheet className="w-12 h-12 text-slate-400" />
          )}

          <div>
            <p className="text-lg font-medium text-slate-700">
              {uploading
                ? "Processando arquivo..."
                : success
                  ? "Arquivo processado com sucesso!"
                  : dragActive
                    ? "Solte o arquivo aqui"
                    : "Arraste seu arquivo Excel aqui"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {!uploading && !success && "ou clique para selecionar (formatos: .xlsx, .xls)"}
            </p>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-slate-600 text-center">Analisando dados e gerando cronograma... {progress}%</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Arquivo processado com sucesso! Verifique o cronograma gerado na aba correspondente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
